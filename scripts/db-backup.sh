#!/usr/bin/env bash
#
# TaDa production database backup.
#
#   pg_dump -Fc (TCP + password)  ->  gzip  ->  ~/.local/var/backups/tada  ->  S3
#
# Runs on the app VPS as the deploy/SSH user, driven by that user's crontab
# (every 6h) and by the pre-deploy step of .github/workflows/deploy.yml.
#
# ZERO SUDO. This script — and everything it touches — works with the ordinary
# privileges of the SSH user. That is not a stylistic preference: the production
# host does NOT grant that user passwordless sudo (`sudo: a password is
# required`, confirmed 2026-08-12), so anything needing root cannot be automated
# here at all. Consequences, all deliberate:
#
#   * The dump connects over TCP as the application role with a password read
#     from /opt/tada/.env — not `sudo -u postgres` over the unix socket.
#   * State lives under $HOME (creds, staging, log, the script itself), not in
#     /etc, /var or /usr/local.
#   * Scheduling is the user's crontab, not a system systemd timer.
#   * The AWS CLI is installed into $HOME, not by apt.
#
# Which host to connect to is not obvious and must not be guessed:
# /opt/tada/.env carries DB_HOST=host.docker.internal, which is a name that only
# resolves INSIDE a container — on the host it does not resolve at all. Postgres
# listens on `localhost,172.18.0.1` and pg_hba grants tada_user -> tada_prod on
# 172.18.0.0/16. So the script probes real candidates and authenticates before
# choosing one, and the installer records the winner as BACKUP_DB_HOST so that
# scheduled runs are deterministic rather than re-probing every time.
#
# The AWS credentials live in a SEPARATE file ($HOME/.config/tada/backup.env)
# and belong to the `tada-backup-uploader` IAM user, which can ONLY ListBucket +
# PutObject. It cannot read or delete an object. That is why upload verification
# uses `aws s3 ls` (ListObjectsV2) rather than `head-object` (GetObject) — do
# not "fix" that. It is also why restores need the OWNER's credentials; see
# db-restore.sh.
#
# Any failure is fatal and loud. A silent half-backup is worse than none,
# because the deploy pipeline reads a zero exit as "there is a floor under the
# migration".
#
# Exit codes (referenced by docs/ops/BACKUP_RUNBOOK.md):
#   0  success
#   2  configuration / environment problem
#   3  pg_dump failed
#   4  dump produced but empty or implausibly small
#   5  upload to S3 failed
#   6  upload could not be verified afterwards
#   7  another backup is already running
#   8  no database host could be reached and authenticated
#
set -euo pipefail

readonly PROGRAM_NAME="tada-db-backup"

# cron gives us a minimal PATH, and the AWS CLI lives in the user's home.
export PATH="${HOME}/.local/bin:${PATH}"

# ---------------------------------------------------------------------------
# Defaults — all under $HOME, all overridable by flag or environment.
# ---------------------------------------------------------------------------
ENV_FILE="${ENV_FILE:-/opt/tada/.env}"
BACKUP_ENV_FILE="${BACKUP_ENV_FILE:-${HOME}/.config/tada/backup.env}"
STAGING_DIR="${STAGING_DIR:-${HOME}/.local/var/backups/tada}"
LOG_FILE="${LOG_FILE:-${HOME}/.local/var/log/tada-backup.log}"
LOCK_FILE="${LOCK_FILE:-${HOME}/.local/var/tada-db-backup.lock}"
KEEP_LOCAL="${KEEP_LOCAL:-3}"

# A gzip of a -Fc dump of an empty database is still a few hundred bytes, so a
# file below this threshold means the dump did not really happen.
MIN_DUMP_BYTES="${MIN_DUMP_BYTES:-1024}"

# S3 prefix. `--pre-deploy` switches it; see usage.
S3_PREFIX="daily"

# Candidate hosts, in probe order. 172.18.0.1 is the docker bridge address the
# cluster listens on and the one pg_hba actually grants; the loopbacks are there
# because a future pg_hba/listen_addresses change would most likely go there.
DB_HOST_CANDIDATES="${DB_HOST_CANDIDATES:-172.18.0.1 127.0.0.1 localhost}"

usage() {
    cat <<'EOF'
Usage: db-backup.sh [options]

Dumps the TaDa production database over TCP, gzips it into a staging directory
under $HOME, and uploads it to S3. Needs no root and no sudo.

Options:
  --pre-deploy            Upload under the s3 "pre-deploy/" prefix instead of
                          "daily/". Use for the dump taken immediately before a
                          release runs migrations.
  --env-file PATH         App env file to read DB_* from.
                          Default: /opt/tada/.env
  --backup-env-file PATH  Env file holding AWS_ACCESS_KEY_ID,
                          AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION,
                          BACKUP_BUCKET and (optionally) BACKUP_DB_HOST.
                          Default: $HOME/.config/tada/backup.env
  --db-host HOST          Skip probing and use this host.
  --staging-dir PATH      Local directory for dumps.
                          Default: $HOME/.local/var/backups/tada
  --log-file PATH         Default: $HOME/.local/var/log/tada-backup.log
  --keep N                How many local dumps to retain. Default: 3
  -h, --help              This text.

Exit codes: 0 ok · 2 config · 3 dump · 4 empty dump · 5 upload · 6 verify
            7 already running · 8 no reachable database host
EOF
}

# ---------------------------------------------------------------------------
# Logging — every line timestamped, to stdout (cron captures it) and to the log
# file. A log file we cannot write must not stop a backup from happening.
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

die() {
    local code="$1"
    shift
    trap - ERR
    log "FATAL: $*"
    log "backup FAILED (exit ${code})"
    exit "$code"
}

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
# would execute whatever is in there under our privileges.
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
FORCED_DB_HOST=""

while [ $# -gt 0 ]; do
    case "$1" in
        --pre-deploy)          S3_PREFIX="pre-deploy" ;;
        --env-file)            ENV_FILE="${2:?--env-file needs a path}"; shift ;;
        --backup-env-file)     BACKUP_ENV_FILE="${2:?--backup-env-file needs a path}"; shift ;;
        --db-host)             FORCED_DB_HOST="${2:?--db-host needs a value}"; shift ;;
        --staging-dir)         STAGING_DIR="${2:?--staging-dir needs a path}"; shift ;;
        --log-file)            LOG_FILE="${2:?--log-file needs a path}"; shift ;;
        --keep)                KEEP_LOCAL="${2:?--keep needs a number}"; shift ;;
        -h|--help)             usage; exit 0 ;;
        *)                     usage >&2; printf '\nUnknown option: %s\n' "$1" >&2; exit 2 ;;
    esac
    shift
done

mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || true
stderr_sink="/dev/stderr"
if { [ -f "$LOG_FILE" ] || touch "$LOG_FILE"; } 2>/dev/null && [ -w "$LOG_FILE" ]; then
    log_file_usable=1
    stderr_sink="$LOG_FILE"
    chmod 0600 "$LOG_FILE" 2>/dev/null || true
else
    printf 'WARNING: cannot write %s — logging to stdout only\n' "$LOG_FILE" >&2
fi

log "=== backup start (prefix=${S3_PREFIX}) ==="

# ---------------------------------------------------------------------------
# Single-run lock. The 6-hourly cron entry and a pre-deploy run can collide.
# ---------------------------------------------------------------------------
if command -v flock >/dev/null 2>&1; then
    mkdir -p "$(dirname "$LOCK_FILE")" 2>/dev/null || true
    exec 9>"$LOCK_FILE" || die 2 "cannot create lock file ${LOCK_FILE}"
    flock -n 9 || die 7 "another backup is already running (lock: ${LOCK_FILE})"
fi

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
[ -r "$ENV_FILE" ] || die 2 "app env file not readable: ${ENV_FILE}"
[ -r "$BACKUP_ENV_FILE" ] || die 2 "backup env file not readable: ${BACKUP_ENV_FILE} (run the 'Install DB backup' workflow first)"

DB_NAME="$(read_env_var "$ENV_FILE" DB_NAME)"
DB_USER="$(read_env_var "$ENV_FILE" DB_USER)"
DB_PORT="$(read_env_var "$ENV_FILE" DB_PORT)"
DB_PASSWORD="$(read_env_var "$ENV_FILE" DB_PASSWORD)"
DB_PORT="${DB_PORT:-5432}"

[ -n "$DB_NAME" ]     || die 2 "DB_NAME is not set in ${ENV_FILE}"
[ -n "$DB_USER" ]     || die 2 "DB_USER is not set in ${ENV_FILE}"
[ -n "$DB_PASSWORD" ] || die 2 "DB_PASSWORD is not set in ${ENV_FILE}"

# NOTE: DB_HOST from the app env file is deliberately NOT used. It reads
# `host.docker.internal`, which resolves only inside a container.
export PGPASSWORD="$DB_PASSWORD"

AWS_ACCESS_KEY_ID="$(read_env_var "$BACKUP_ENV_FILE" AWS_ACCESS_KEY_ID)"
AWS_SECRET_ACCESS_KEY="$(read_env_var "$BACKUP_ENV_FILE" AWS_SECRET_ACCESS_KEY)"
AWS_DEFAULT_REGION="$(read_env_var "$BACKUP_ENV_FILE" AWS_DEFAULT_REGION)"
BACKUP_BUCKET="$(read_env_var "$BACKUP_ENV_FILE" BACKUP_BUCKET)"
RECORDED_DB_HOST="$(read_env_var "$BACKUP_ENV_FILE" BACKUP_DB_HOST)"
export AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_DEFAULT_REGION

[ -n "$AWS_ACCESS_KEY_ID" ]     || die 2 "AWS_ACCESS_KEY_ID missing from ${BACKUP_ENV_FILE}"
[ -n "$AWS_SECRET_ACCESS_KEY" ] || die 2 "AWS_SECRET_ACCESS_KEY missing from ${BACKUP_ENV_FILE}"
[ -n "$AWS_DEFAULT_REGION" ]    || die 2 "AWS_DEFAULT_REGION missing from ${BACKUP_ENV_FILE}"
[ -n "$BACKUP_BUCKET" ]         || die 2 "BACKUP_BUCKET missing from ${BACKUP_ENV_FILE}"

command -v aws >/dev/null 2>&1     || die 2 "aws CLI not found on PATH (expected ${HOME}/.local/bin/aws — run the installer workflow)"
command -v pg_dump >/dev/null 2>&1 || die 2 "pg_dump not found on PATH"
command -v psql >/dev/null 2>&1    || die 2 "psql not found on PATH"
command -v gzip >/dev/null 2>&1    || die 2 "gzip not found on PATH"

mkdir -p "$STAGING_DIR" || die 2 "cannot create staging dir ${STAGING_DIR}"
[ -w "$STAGING_DIR" ] || die 2 "staging dir not writable: ${STAGING_DIR}"
chmod 0700 "$STAGING_DIR" 2>/dev/null || true

# ---------------------------------------------------------------------------
# Choose the database host.
#
# A candidate only counts if it AUTHENTICATES and can read the database —
# pg_isready would answer "accepting connections" for a host that pg_hba then
# rejects, which is exactly the failure we are trying not to discover at 3am.
# ---------------------------------------------------------------------------
can_connect() {
    # PGCONNECT_TIMEOUT bounds each probe: a candidate address that silently
    # drops packets would otherwise hang the whole backup on the TCP default.
    PGCONNECT_TIMEOUT="${PGCONNECT_TIMEOUT:-5}" \
    psql -h "$1" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
         -v ON_ERROR_STOP=1 -tAc 'SELECT 1' >/dev/null 2>>"$stderr_sink"
}

DB_HOST_USED=""
if [ -n "$FORCED_DB_HOST" ]; then
    can_connect "$FORCED_DB_HOST" || die 8 "cannot connect to ${FORCED_DB_HOST}:${DB_PORT} as ${DB_USER}/${DB_NAME} (from --db-host)"
    DB_HOST_USED="$FORCED_DB_HOST"
    log "using database host ${DB_HOST_USED} (from --db-host)"
elif [ -n "$RECORDED_DB_HOST" ]; then
    # The recorded host is the normal path: deterministic, no probing.
    if can_connect "$RECORDED_DB_HOST"; then
        DB_HOST_USED="$RECORDED_DB_HOST"
        log "using database host ${DB_HOST_USED} (recorded as BACKUP_DB_HOST)"
    else
        log "WARNING: recorded BACKUP_DB_HOST=${RECORDED_DB_HOST} did not answer — falling back to probing"
    fi
fi

if [ -z "$DB_HOST_USED" ]; then
    for candidate in $DB_HOST_CANDIDATES; do
        log "probing ${candidate}:${DB_PORT} ..."
        if can_connect "$candidate"; then
            DB_HOST_USED="$candidate"
            log "connected to ${DB_HOST_USED}:${DB_PORT} as ${DB_USER}"
            if [ "$RECORDED_DB_HOST" != "$DB_HOST_USED" ]; then
                log "NOTE: record BACKUP_DB_HOST=${DB_HOST_USED} in ${BACKUP_ENV_FILE} to skip probing on future runs"
            fi
            break
        fi
    done
fi

[ -n "$DB_HOST_USED" ] || die 8 "no candidate host accepted a connection for ${DB_USER}@${DB_NAME} (tried: ${DB_HOST_CANDIDATES}). Check that Postgres is listening and that pg_hba grants this role over TCP."

log "database=${DB_NAME} user=${DB_USER} host=${DB_HOST_USED}:${DB_PORT}"
log "staging=${STAGING_DIR} bucket=${BACKUP_BUCKET} region=${AWS_DEFAULT_REGION}"

# ---------------------------------------------------------------------------
# Dump
# ---------------------------------------------------------------------------
timestamp="$(date '+%Y%m%d_%H%M%S')"
date_path="$(date '+%Y/%m/%d')"
dump_name="${DB_NAME}_${timestamp}.dump.gz"          # e.g. tada_prod_20260812_031500.dump.gz
dump_path="${STAGING_DIR}/${dump_name}"
partial_path="${dump_path}.part"

cleanup_partial() { rm -f -- "$partial_path"; }

log "dumping ${DB_NAME} -> ${dump_path}"

# pipefail makes a pg_dump failure fatal even though gzip would exit 0 on a
# truncated stream. The password reaches pg_dump through PGPASSWORD in the
# environment and never appears on a command line or in the log.
if ! pg_dump -h "$DB_HOST_USED" -p "$DB_PORT" -U "$DB_USER" -Fc "$DB_NAME" 2>>"$stderr_sink" | gzip -c >"$partial_path"; then
    cleanup_partial
    die 3 "pg_dump failed for ${DB_USER}@${DB_HOST_USED}:${DB_PORT}/${DB_NAME} (stderr in ${LOG_FILE})"
fi

dump_size="$(wc -c <"$partial_path" | tr -d '[:space:]')"
if [ "$dump_size" -lt "$MIN_DUMP_BYTES" ]; then
    cleanup_partial
    die 4 "dump is only ${dump_size} bytes (minimum ${MIN_DUMP_BYTES}) — treating as empty"
fi

if ! gzip -t "$partial_path" 2>/dev/null; then
    cleanup_partial
    die 4 "dump failed gzip integrity check"
fi

mv -- "$partial_path" "$dump_path"
chmod 0600 "$dump_path" 2>/dev/null || true
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

# `aws s3 ls` maps to ListObjectsV2, which the write-only backup IAM user is
# allowed to call. head-object would need GetObject, which it does not have.
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
# only keeps the most recent few. Filenames sort chronologically because the
# timestamp is zero-padded.
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
