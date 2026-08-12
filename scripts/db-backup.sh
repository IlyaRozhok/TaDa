#!/usr/bin/env bash
#
# TaDa production database backup.
#
#   pg_dump -Fc  ->  gzip  ->  local staging dir  ->  S3 (write-only IAM user)
#
# Runs on the app VPS as the `deploy` user, driven by `tada-db-backup.timer`
# (every 6h) and by the pre-deploy step of .github/workflows/deploy.yml.
#
# Design notes, so the next person does not have to re-derive them:
#
#   * Postgres is host-native on the same VPS, so the dump goes over the unix
#     socket as the `postgres` superuser (`sudo -u postgres`). No password, no
#     network, no credentials in this script.
#   * The database NAME is read from the app's env file — never hardcoded — so
#     this script cannot dump the wrong database after a rename.
#   * The AWS credentials live in a SEPARATE env file (`/opt/tada/backup.env`),
#     not in the app env file, and belong to the `tada-backup-uploader` IAM
#     user, which can ONLY ListBucket + PutObject. It cannot read or delete an
#     object. That is deliberate: a compromised app host cannot wipe history.
#     The consequence is that upload verification uses `aws s3 ls`
#     (ListObjectsV2) rather than `head-object` (GetObject) — see verify_upload.
#   * `-Fc` output is already zlib-compressed; the extra gzip layer buys little
#     but keeps the artifact a plain `.gz` that any tool can open, and the dump
#     is under 10MB (media is stored in S3 by reference, not as bytea).
#   * Any failure is fatal and loud. A silent half-backup is worse than none,
#     because the deploy pipeline treats a zero exit as "there is a floor under
#     the migration".
#
# Exit codes (referenced by docs/ops/BACKUP_RUNBOOK.md):
#   0  success
#   2  configuration / environment problem
#   3  pg_dump failed
#   4  dump produced but empty or implausibly small
#   5  upload to S3 failed
#   6  upload could not be verified afterwards
#   7  another backup is already running
#
set -euo pipefail

readonly PROGRAM_NAME="tada-db-backup"

# ---------------------------------------------------------------------------
# Defaults — every one of them is overridable by flag or environment.
# ---------------------------------------------------------------------------
ENV_FILE="${ENV_FILE:-/opt/tada/.env}"
BACKUP_ENV_FILE="${BACKUP_ENV_FILE:-/opt/tada/backup.env}"
STAGING_DIR="${STAGING_DIR:-/var/backups/tada}"
LOG_FILE="${LOG_FILE:-/var/log/tada-backup.log}"
LOCK_FILE="${LOCK_FILE:-/tmp/tada-db-backup.lock}"
KEEP_LOCAL="${KEEP_LOCAL:-3}"

# A gzip of a -Fc dump of an empty database is still a few hundred bytes, so a
# file below this threshold means the dump did not really happen.
MIN_DUMP_BYTES="${MIN_DUMP_BYTES:-1024}"

# S3 prefix. `--pre-deploy` switches it; see usage.
S3_PREFIX="daily"

# `sudo -u postgres` is how we reach the socket. Overridable for local dry runs
# (see the "Dry run" section of the runbook), where the invoking user already
# owns the cluster and no sudo is available or needed.
PG_SUDO="${PG_SUDO:-sudo -u postgres}"

# DB_HOST values that mean "the Postgres on this very machine". The backend runs
# inside Docker and reaches the host cluster as `host.docker.internal`, so that
# spelling is local too even though it does not look it.
readonly LOCAL_DB_HOSTS=" localhost 127.0.0.1 ::1 host.docker.internal "
IGNORE_HOST_CHECK=0

usage() {
    cat <<'EOF'
Usage: db-backup.sh [options]

Dumps the TaDa production database, gzips it into a local staging directory and
uploads it to S3. Intended to be run by systemd (every 6h) and by the deploy
workflow (--pre-deploy) on the app VPS.

Options:
  --pre-deploy            Upload under the s3 "pre-deploy/" prefix instead of
                          "daily/". Use for the dump taken immediately before a
                          release runs migrations.
  --env-file PATH         App env file to read DB_NAME from.
                          Default: /opt/tada/.env
  --backup-env-file PATH  Env file holding AWS_ACCESS_KEY_ID,
                          AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION and
                          BACKUP_BUCKET. Default: /opt/tada/backup.env
  --staging-dir PATH      Local directory for dumps. Default: /var/backups/tada
  --log-file PATH         Log file. Default: /var/log/tada-backup.log
  --keep N                How many local dumps to retain. Default: 3
  --ignore-host-check     Proceed even when DB_HOST does not look local.
                          Only meaningful if the database really did move.
  -h, --help              This text.

Exit codes: 0 ok · 2 config · 3 dump · 4 empty dump · 5 upload · 6 verify
            7 already running
EOF
}

# ---------------------------------------------------------------------------
# Logging — every line timestamped, to stdout (journald picks it up) and to the
# log file. A log file we cannot write must not stop a backup from happening.
# ---------------------------------------------------------------------------
log_file_usable=0

log() {
    local line
    line="$(date '+%Y-%m-%d %H:%M:%S%z') [${PROGRAM_NAME}] $*"
    printf '%s\n' "$line"
    if [ "$log_file_usable" -eq 1 ]; then
        printf '%s\n' "$line" >>"$LOG_FILE"
    fi
}

# Fatal error: log loudly, then leave with a specific code. The ERR trap is
# cleared first so the failure is reported once, with the right code.
die() {
    local code="$1"
    shift
    trap - ERR
    log "FATAL: $*"
    log "backup FAILED (exit ${code})"
    exit "$code"
}

# Anything that fails without going through die() still has to be loud.
# shellcheck disable=SC2329  # invoked by the ERR trap below
on_unexpected_error() {
    local rc=$?
    trap - ERR
    log "FATAL: unexpected failure (exit ${rc})"
    log "backup FAILED (exit ${rc})"
    exit "$rc"
}
trap on_unexpected_error ERR

# ---------------------------------------------------------------------------
# Env file reading.
#
# We deliberately do NOT `source` the app env file: it is written by hand, may
# contain values with spaces, `#`, or shell metacharacters, and sourcing it
# would execute whatever is in there under our privileges. Instead we pull out
# exactly the variables we need, textually.
# ---------------------------------------------------------------------------
read_env_var() {
    local file="$1" name="$2" line value
    [ -r "$file" ] || return 0
    line="$(grep -E "^[[:space:]]*(export[[:space:]]+)?${name}=" "$file" | tail -n 1 || true)"
    [ -n "$line" ] || return 0
    value="${line#*=}"
    value="${value%$'\r'}"           # tolerate CRLF files
    case "$value" in
        \"*\") value="${value#\"}"; value="${value%\"}" ;;
        \'*\') value="${value#\'}"; value="${value%\'}" ;;
    esac
    printf '%s' "$value"
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
while [ $# -gt 0 ]; do
    case "$1" in
        --pre-deploy)          S3_PREFIX="pre-deploy" ;;
        --env-file)            ENV_FILE="${2:?--env-file needs a path}"; shift ;;
        --backup-env-file)     BACKUP_ENV_FILE="${2:?--backup-env-file needs a path}"; shift ;;
        --staging-dir)         STAGING_DIR="${2:?--staging-dir needs a path}"; shift ;;
        --log-file)            LOG_FILE="${2:?--log-file needs a path}"; shift ;;
        --keep)                KEEP_LOCAL="${2:?--keep needs a number}"; shift ;;
        --ignore-host-check)   IGNORE_HOST_CHECK=1 ;;
        -h|--help)             usage; exit 0 ;;
        *)                     usage >&2; printf '\nUnknown option: %s\n' "$1" >&2; exit 2 ;;
    esac
    shift
done

# Open the log as early as possible, but after --log-file has been read.
stderr_sink="/dev/stderr"
if { [ -f "$LOG_FILE" ] || touch "$LOG_FILE"; } 2>/dev/null && [ -w "$LOG_FILE" ]; then
    log_file_usable=1
    stderr_sink="$LOG_FILE"
else
    printf 'WARNING: cannot write %s — logging to stdout only\n' "$LOG_FILE" >&2
fi

log "=== backup start (prefix=${S3_PREFIX}) ==="

# ---------------------------------------------------------------------------
# Single-run lock. The 6-hourly timer and a pre-deploy run can collide; two
# concurrent pg_dumps would fight over the same staging directory and pruning.
# ---------------------------------------------------------------------------
if command -v flock >/dev/null 2>&1; then
    exec 9>"$LOCK_FILE" || die 2 "cannot create lock file ${LOCK_FILE}"
    flock -n 9 || die 7 "another backup is already running (lock: ${LOCK_FILE})"
fi

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
[ -r "$ENV_FILE" ] || die 2 "app env file not readable: ${ENV_FILE}"
[ -r "$BACKUP_ENV_FILE" ] || die 2 "backup env file not readable: ${BACKUP_ENV_FILE} (run the 'Install DB backup' workflow first)"

DB_NAME="$(read_env_var "$ENV_FILE" DB_NAME)"
DB_HOST="$(read_env_var "$ENV_FILE" DB_HOST)"
[ -n "$DB_NAME" ] || die 2 "DB_NAME is not set in ${ENV_FILE}"

# If the database ever moves off this host, dumping over the local socket would
# quietly back up the wrong (or an empty) database. Refuse rather than lie.
if [ -n "$DB_HOST" ] && [ "$IGNORE_HOST_CHECK" -eq 0 ]; then
    case "$LOCAL_DB_HOSTS" in
        *" ${DB_HOST} "*) : ;;
        *) die 2 "DB_HOST='${DB_HOST}' is not local, but this script dumps over the local unix socket. Move the backup to where the database lives, or pass --ignore-host-check if you are sure." ;;
    esac
fi

AWS_ACCESS_KEY_ID="$(read_env_var "$BACKUP_ENV_FILE" AWS_ACCESS_KEY_ID)"
AWS_SECRET_ACCESS_KEY="$(read_env_var "$BACKUP_ENV_FILE" AWS_SECRET_ACCESS_KEY)"
AWS_DEFAULT_REGION="$(read_env_var "$BACKUP_ENV_FILE" AWS_DEFAULT_REGION)"
BACKUP_BUCKET="$(read_env_var "$BACKUP_ENV_FILE" BACKUP_BUCKET)"
export AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_DEFAULT_REGION

[ -n "$AWS_ACCESS_KEY_ID" ]     || die 2 "AWS_ACCESS_KEY_ID missing from ${BACKUP_ENV_FILE}"
[ -n "$AWS_SECRET_ACCESS_KEY" ] || die 2 "AWS_SECRET_ACCESS_KEY missing from ${BACKUP_ENV_FILE}"
[ -n "$AWS_DEFAULT_REGION" ]    || die 2 "AWS_DEFAULT_REGION missing from ${BACKUP_ENV_FILE}"
[ -n "$BACKUP_BUCKET" ]         || die 2 "BACKUP_BUCKET missing from ${BACKUP_ENV_FILE}"

command -v aws >/dev/null 2>&1  || die 2 "aws CLI not found on PATH"
command -v gzip >/dev/null 2>&1 || die 2 "gzip not found on PATH"

mkdir -p "$STAGING_DIR" || die 2 "cannot create staging dir ${STAGING_DIR}"
[ -w "$STAGING_DIR" ] || die 2 "staging dir not writable: ${STAGING_DIR}"

log "database=${DB_NAME} staging=${STAGING_DIR} bucket=${BACKUP_BUCKET} region=${AWS_DEFAULT_REGION}"

# ---------------------------------------------------------------------------
# Dump
# ---------------------------------------------------------------------------
timestamp="$(date '+%Y%m%d_%H%M%S')"
date_path="$(date '+%Y/%m/%d')"
dump_name="${DB_NAME}_${timestamp}.dump.gz"          # e.g. tada_prod_20260812_031500.dump.gz
dump_path="${STAGING_DIR}/${dump_name}"
partial_path="${dump_path}.part"

# Never leave a `.part` behind to be mistaken for a backup.
cleanup_partial() { rm -f -- "$partial_path"; }

log "dumping ${DB_NAME} -> ${dump_path}"

# The redirection happens in THIS shell, so the file is owned by the invoking
# user (deploy), not by postgres. pipefail makes a pg_dump failure fatal even
# though gzip would exit 0 on a truncated stream.
if ! $PG_SUDO pg_dump -Fc "$DB_NAME" 2>>"$stderr_sink" | gzip -c >"$partial_path"; then
    cleanup_partial
    die 3 "pg_dump failed for database ${DB_NAME}"
fi

dump_size="$(wc -c <"$partial_path" | tr -d '[:space:]')"
if [ "$dump_size" -lt "$MIN_DUMP_BYTES" ]; then
    cleanup_partial
    die 4 "dump is only ${dump_size} bytes (minimum ${MIN_DUMP_BYTES}) — treating as empty"
fi

# Prove the archive is intact before we call it a backup.
if ! gzip -t "$partial_path" 2>/dev/null; then
    cleanup_partial
    die 4 "dump failed gzip integrity check"
fi

mv -- "$partial_path" "$dump_path"
log "dump ok: ${dump_name} (${dump_size} bytes)"

# ---------------------------------------------------------------------------
# Upload
# ---------------------------------------------------------------------------
s3_key="${S3_PREFIX}/${date_path}/${dump_name}"
s3_uri="s3://${BACKUP_BUCKET}/${s3_key}"

log "uploading -> ${s3_uri}"
if ! aws s3 cp "$dump_path" "$s3_uri" --only-show-errors; then
    die 5 "upload to ${s3_uri} failed"
fi

# ---------------------------------------------------------------------------
# Verify the object is really there.
#
# `aws s3 ls` maps to ListObjectsV2, which the write-only backup IAM user is
# allowed to call (s3:ListBucket). `head-object` would need s3:GetObject, which
# it deliberately does not have — do not "fix" this by switching to head-object.
# ---------------------------------------------------------------------------
verify_upload() {
    local listing remote_size
    listing="$(aws s3 ls "$s3_uri" 2>/dev/null || true)"
    [ -n "$listing" ] || return 1
    remote_size="$(printf '%s\n' "$listing" | awk -v name="$dump_name" '$NF == name { print $(NF-1); exit }')"
    [ -n "$remote_size" ] || return 1
    [ "$remote_size" = "$dump_size" ] || {
        log "WARNING: remote size ${remote_size} != local size ${dump_size}"
        return 1
    }
    return 0
}

if ! verify_upload; then
    die 6 "uploaded object could not be verified at ${s3_uri}"
fi
log "upload verified: ${s3_uri} (${dump_size} bytes)"

# ---------------------------------------------------------------------------
# Prune local copies — S3 lifecycle owns long-term retention (90d), the host
# only keeps the most recent few so a restore does not have to go to S3.
# Filenames sort chronologically because the timestamp is zero-padded.
# ---------------------------------------------------------------------------
pruned=0
while IFS= read -r old_dump; do
    [ -n "$old_dump" ] || continue
    rm -f -- "$old_dump"
    log "pruned old local dump: $(basename "$old_dump")"
    pruned=$((pruned + 1))
done < <(find "$STAGING_DIR" -maxdepth 1 -type f -name '*.dump.gz' | sort -r | tail -n "+$((KEEP_LOCAL + 1))")

log "local retention: kept ${KEEP_LOCAL}, pruned ${pruned}"
log "=== backup OK: ${s3_uri} ==="
exit 0
