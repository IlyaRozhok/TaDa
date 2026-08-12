#!/usr/bin/env bash
#
# TaDa database restore — deliberately paranoid.
#
#   S3 key or local .dump.gz  ->  gunzip  ->  pg_restore  ->  TARGET database
#
# This script exists for two jobs:
#
#   1. Release rehearsal — restore a prod dump onto a scratch database and diff
#      row counts, so that "we have backups" becomes "we have restored one".
#      See docs/ops/BACKUP_RUNBOOK.md and LAUNCH_PLAN items 1 and 2.
#   2. Incident recovery — restore prod from the last good dump. That path is
#      guarded: it needs --force-prod AND an interactively typed confirmation.
#
# The default target is a SCRATCH database, never production. Restoring is
# destructive (`--clean --if-exists` drops every object it is about to recreate),
# so the safe thing must be the thing that happens when you type nothing.
#
# AWS credentials — read this before wondering why S3 download fails:
#
#   The `tada-backup-uploader` IAM user used by db-backup.sh is WRITE-ONLY
#   (s3:ListBucket + s3:PutObject only). It CANNOT s3:GetObject, so it cannot
#   download anything. That is the point: a compromised app host can add
#   backups but cannot read or destroy them.
#
#   Therefore restoring from S3 uses the OWNER's own AWS credentials (an admin
#   profile configured with `aws configure --profile tada-owner`, or exported
#   AWS_* variables in the shell you run this in) — NOT /opt/tada/backup.env.
#   Pass --profile to pick one. If you point this script at a local file
#   instead, no AWS credentials are needed at all.
#
# Exit codes:
#   0  success
#   2  configuration / usage problem
#   3  download or decompression failed
#   4  refused — target is production without the required confirmation
#   5  pg_restore reported errors
#
set -euo pipefail

readonly PROGRAM_NAME="tada-db-restore"

ENV_FILE="${ENV_FILE:-/opt/tada/.env}"
TARGET_DB="${TARGET_DB:-tada_restore_check}"     # scratch by default, on purpose
WORK_DIR="${WORK_DIR:-/var/backups/tada/restore}"
AWS_PROFILE_NAME=""
FORCE_PROD=0
SOURCE=""
KEEP_WORK=0

# Same reasoning as in db-backup.sh: reach the local cluster as the postgres
# superuser over the unix socket. Overridable for local dry runs.
PG_SUDO="${PG_SUDO:-sudo -u postgres}"

usage() {
    cat <<'EOF'
Usage: db-restore.sh --source <s3-key-or-uri-or-local-file> [options]

Restores a TaDa dump into a target database and prints per-table row counts.

Required:
  --source SRC            One of:
                            s3://tada-db-backups/daily/2026/08/12/x.dump.gz
                            daily/2026/08/12/x.dump.gz   (key; bucket implied)
                            /var/backups/tada/x.dump.gz  (local file)

Options:
  --target DB             Database to restore INTO. Default: tada_restore_check
                          It is created if it does not exist.
  --bucket NAME           Bucket for bare keys. Default: tada-db-backups
  --profile NAME          AWS CLI profile to download with. Use the OWNER's
                          admin profile — the backup uploader cannot GetObject.
  --force-prod            Required (together with a typed confirmation) to
                          restore onto the production database.
  --env-file PATH         App env file, read to learn the prod DB name so we
                          can refuse to overwrite it. Default: /opt/tada/.env
  --work-dir PATH         Scratch space for downloads/decompression.
                          Default: /var/backups/tada/restore
  --keep-work             Do not delete the decompressed dump afterwards.
  -h, --help              This text.

Examples:
  # Rehearsal: last night's prod dump onto a scratch DB (LAUNCH_PLAN #1/#2)
  ./db-restore.sh --source daily/2026/08/12/tada_prod_20260812_030000.dump.gz \
                  --profile tada-owner

  # Incident: restore production from a local dump (will prompt for typed confirmation)
  ./db-restore.sh --source /var/backups/tada/tada_prod_20260812_030000.dump.gz \
                  --target tada_prod --force-prod
EOF
}

log() {
    printf '%s [%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S%z')" "$PROGRAM_NAME" "$*"
}

die() {
    local code="$1"
    shift
    trap - ERR
    log "FATAL: $*"
    exit "$code"
}

# shellcheck disable=SC2329  # invoked by the ERR trap below
on_unexpected_error() {
    local rc=$?
    trap - ERR
    log "FATAL: unexpected failure (exit ${rc})"
    exit "$rc"
}
trap on_unexpected_error ERR

# Textual read of an env file — we do not source it. See db-backup.sh.
read_env_var() {
    local file="$1" name="$2" line value
    [ -r "$file" ] || return 0
    line="$(grep -E "^[[:space:]]*(export[[:space:]]+)?${name}=" "$file" | tail -n 1 || true)"
    [ -n "$line" ] || return 0
    value="${line#*=}"
    value="${value%$'\r'}"
    case "$value" in
        \"*\") value="${value#\"}"; value="${value%\"}" ;;
        \'*\') value="${value#\'}"; value="${value%\'}" ;;
    esac
    printf '%s' "$value"
}

BUCKET="${BACKUP_BUCKET:-tada-db-backups}"

# Wrapper rather than an argument array: `"${arr[@]}"` on an EMPTY array is an
# unbound-variable error under `set -u` in bash 3.2 (which is what macOS ships),
# and this script has to be runnable from a laptop during an incident.
aws_cli() {
    if [ -n "$AWS_PROFILE_NAME" ]; then
        aws --profile "$AWS_PROFILE_NAME" "$@"
    else
        aws "$@"
    fi
}

while [ $# -gt 0 ]; do
    case "$1" in
        --source)     SOURCE="${2:?--source needs a value}"; shift ;;
        --target)     TARGET_DB="${2:?--target needs a value}"; shift ;;
        --bucket)     BUCKET="${2:?--bucket needs a value}"; shift ;;
        --profile)    AWS_PROFILE_NAME="${2:?--profile needs a value}"; shift ;;
        --env-file)   ENV_FILE="${2:?--env-file needs a path}"; shift ;;
        --work-dir)   WORK_DIR="${2:?--work-dir needs a path}"; shift ;;
        --force-prod) FORCE_PROD=1 ;;
        --keep-work)  KEEP_WORK=1 ;;
        -h|--help)    usage; exit 0 ;;
        *)            usage >&2; printf '\nUnknown option: %s\n' "$1" >&2; exit 2 ;;
    esac
    shift
done

[ -n "$SOURCE" ] || { usage >&2; die 2 "--source is required"; }
command -v pg_restore >/dev/null 2>&1 || die 2 "pg_restore not found on PATH"
command -v psql >/dev/null 2>&1 || die 2 "psql not found on PATH"

# ---------------------------------------------------------------------------
# Guard: never overwrite production by accident.
#
# "Production" is whatever DB_NAME the app is configured with, not a hardcoded
# string — a renamed prod database must stay protected.
# ---------------------------------------------------------------------------
PROD_DB="$(read_env_var "$ENV_FILE" DB_NAME)"

if [ -n "$PROD_DB" ] && [ "$TARGET_DB" = "$PROD_DB" ]; then
    log "TARGET IS THE PRODUCTION DATABASE: ${TARGET_DB}"

    [ "$FORCE_PROD" -eq 1 ] || die 4 "refusing to restore onto production without --force-prod"

    # An interactive human must type it out. Read from the terminal directly so
    # this cannot be satisfied by a pipe, a heredoc or a CI runner.
    [ -t 0 ] || die 4 "refusing: production restore requires an interactive terminal"

    printf '\n'
    printf '  This will DROP AND REPLACE every object in "%s" on this host.\n' "$TARGET_DB"
    printf '  Source: %s\n' "$SOURCE"
    printf '  There is no undo. Take a fresh backup first if you have not.\n\n'
    printf '  Type exactly: restore %s\n  > ' "$TARGET_DB"

    typed=""
    IFS= read -r typed </dev/tty || true
    [ "$typed" = "restore ${TARGET_DB}" ] || die 4 "confirmation did not match — nothing was changed"

    log "production restore confirmed by operator"
fi

mkdir -p "$WORK_DIR" || die 2 "cannot create work dir ${WORK_DIR}"

# ---------------------------------------------------------------------------
# Obtain the dump
# ---------------------------------------------------------------------------
gz_path=""

case "$SOURCE" in
    s3://*|daily/*|pre-deploy/*)
        command -v aws >/dev/null 2>&1 || die 2 "aws CLI not found on PATH"
        case "$SOURCE" in
            s3://*) s3_uri="$SOURCE" ;;
            *)      s3_uri="s3://${BUCKET}/${SOURCE}" ;;
        esac
        gz_path="${WORK_DIR}/$(basename "$s3_uri")"
        log "downloading ${s3_uri}"
        log "note: this needs s3:GetObject — use the owner's AWS profile, not the backup uploader"
        if ! aws_cli s3 cp "$s3_uri" "$gz_path" --only-show-errors; then
            die 3 "download failed. If this was AccessDenied, you are using the write-only backup credentials; re-run with --profile <owner-profile>."
        fi
        ;;
    *)
        [ -r "$SOURCE" ] || die 2 "local source not readable: ${SOURCE}"
        gz_path="$SOURCE"
        log "using local dump ${gz_path}"
        ;;
esac

# ---------------------------------------------------------------------------
# Decompress. pg_restore needs a real file (it seeks), so we do not stream.
# ---------------------------------------------------------------------------
dump_path="${WORK_DIR}/$(basename "${gz_path%.gz}")"
log "decompressing -> ${dump_path}"
if ! gunzip -c "$gz_path" >"$dump_path"; then
    rm -f -- "$dump_path"
    die 3 "gunzip failed for ${gz_path}"
fi
[ -s "$dump_path" ] || die 3 "decompressed dump is empty"

# shellcheck disable=SC2329  # invoked by the EXIT trap below
cleanup() {
    if [ "$KEEP_WORK" -eq 0 ]; then
        rm -f -- "$dump_path"
    fi
}
trap cleanup EXIT

# The dump has to be readable by the postgres user, which is a different user
# than the one running this script.
chmod 0644 "$dump_path"

# ---------------------------------------------------------------------------
# Create the target database if needed
# ---------------------------------------------------------------------------
db_exists="$($PG_SUDO psql -tAc "SELECT 1 FROM pg_database WHERE datname = '${TARGET_DB}'" postgres || true)"
if [ "$db_exists" != "1" ]; then
    log "creating database ${TARGET_DB}"
    $PG_SUDO createdb "$TARGET_DB" || die 2 "could not create database ${TARGET_DB}"
else
    log "database ${TARGET_DB} already exists — its contents will be replaced"
fi

# ---------------------------------------------------------------------------
# Restore
#
#   --clean --if-exists  drop objects before recreating them, tolerating absence
#   --no-owner           the scratch DB is owned by whoever ran this, not by
#                        tada_user, and we do not want ownership errors
#
# pg_restore exits non-zero on errors but also emits warnings that are normal
# for --clean on a fresh database ("does not exist, skipping"). We surface the
# full output and treat a non-zero exit as a failure — with the exception that
# is called out in the runbook.
# ---------------------------------------------------------------------------
log "restoring into ${TARGET_DB} (this drops and recreates every object)"
restore_log="${WORK_DIR}/restore_$(date '+%Y%m%d_%H%M%S').log"

if $PG_SUDO pg_restore --clean --if-exists --no-owner --dbname "$TARGET_DB" "$dump_path" >"$restore_log" 2>&1; then
    log "pg_restore completed cleanly"
else
    log "pg_restore reported errors — full output in ${restore_log}:"
    tail -n 40 "$restore_log" || true
    die 5 "restore into ${TARGET_DB} failed"
fi

# ---------------------------------------------------------------------------
# Row counts — the actual proof that the restore carried data.
#
# Exact counts, not reltuples estimates: the database is small, and an estimate
# is exactly the kind of "looks fine" that a rehearsal is supposed to rule out.
# ---------------------------------------------------------------------------
log "row counts in ${TARGET_DB}:"

tables="$($PG_SUDO psql -tA -d "$TARGET_DB" -c \
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename")"

if [ -z "$tables" ]; then
    log "WARNING: no tables in schema public — the restore produced nothing"
    exit 5
fi

total_rows=0
table_count=0
printf '\n%-45s %12s\n' "TABLE" "ROWS"
printf '%-45s %12s\n' "---------------------------------------------" "------------"
while IFS= read -r table; do
    [ -n "$table" ] || continue
    count="$($PG_SUDO psql -tA -d "$TARGET_DB" -c "SELECT count(*) FROM public.\"${table}\"")"
    printf '%-45s %12s\n' "$table" "$count"
    total_rows=$((total_rows + count))
    table_count=$((table_count + 1))
done <<EOF
$tables
EOF
printf '%-45s %12s\n' "---------------------------------------------" "------------"
printf '%-45s %12s\n\n' "TOTAL" "$total_rows"

log "restore OK: ${TARGET_DB} — ${table_count} tables, ${total_rows} rows"
log "compare these counts against the source database before calling the rehearsal green"
exit 0
