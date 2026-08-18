#!/usr/bin/env bash
#
# TaDa database restore — deliberately paranoid, and sudo-free.
#
#   S3 key or local .dump.gz  ->  gunzip  ->  pg_restore (TCP + password)
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
# destructive (`--clean --if-exists` drops every object it is about to
# recreate), so the safe thing must be what happens when you type nothing.
#
# NO SUDO ANYWHERE. Like db-backup.sh, this connects over TCP as the application
# role using the password from /opt/tada/.env, because the production SSH user
# has no passwordless sudo. Two things follow that you will meet in practice:
#
#   * Creating a scratch database needs the CREATEDB attribute on the role.
#   * Connecting to a scratch database needs a pg_hba.conf line covering it.
#     Production's pg_hba currently grants tada_user on database `tada_prod`
#     only, so a scratch restore will be REJECTED until that line is widened.
#     This script detects both cases up front and prints the exact fix rather
#     than failing halfway through a restore. Applying the fix needs root on
#     the host (console), one time — see §5 of the runbook.
#
# AWS credentials — read this before wondering why an S3 download fails:
#
#   The `tada-backup-uploader` IAM user used by db-backup.sh is WRITE-ONLY
#   (s3:ListBucket + s3:PutObject only). It CANNOT s3:GetObject, so it cannot
#   download anything. That is the point: a compromised app host can add
#   backups but cannot read or destroy them.
#
#   Restoring from S3 therefore uses the OWNER's own AWS credentials — an admin
#   profile (`aws configure --profile tada-owner`) or exported AWS_* variables
#   in your shell — NOT ~/.config/tada/backup.env. Pass --profile to pick one.
#   Restoring from a local file needs no AWS credentials at all.
#
# Exit codes:
#   0  success
#   2  configuration / usage / prerequisites not met
#   3  download or decompression failed
#   4  refused — target is production without the required confirmation
#   5  pg_restore reported errors
#   8  no database host could be reached and authenticated
#
set -euo pipefail

readonly PROGRAM_NAME="tada-db-restore"

export PATH="${HOME}/.local/bin:${PATH}"

ENV_FILE="${ENV_FILE:-/opt/tada/.env}"
BACKUP_ENV_FILE="${BACKUP_ENV_FILE:-${HOME}/.config/tada/backup.env}"
TARGET_DB="${TARGET_DB:-tada_restore_check}"     # scratch by default, on purpose
WORK_DIR="${WORK_DIR:-${HOME}/.local/var/backups/tada/restore}"
AWS_PROFILE_NAME=""
FORCE_PROD=0
SOURCE=""
KEEP_WORK=0
FORCED_DB_HOST=""
DB_HOST_CANDIDATES="${DB_HOST_CANDIDATES:-172.18.0.1 127.0.0.1 localhost}"

usage() {
    cat <<'EOF'
Usage: db-restore.sh --source <s3-key-or-uri-or-local-file> [options]

Restores a TaDa dump into a target database and prints per-table row counts.
Connects over TCP with a password; needs no root and no sudo.

Required:
  --source SRC            One of:
                            s3://tada-db-backups/daily/2026/08/12/x.dump.gz
                            daily/2026/08/12/x.dump.gz   (key; bucket implied)
                            ~/.local/var/backups/tada/x.dump.gz  (local file)

Options:
  --target DB             Database to restore INTO. Default: tada_restore_check
                          Created if it does not exist (needs CREATEDB).
  --bucket NAME           Bucket for bare keys. Default: tada-db-backups
  --profile NAME          AWS CLI profile to download with. Use the OWNER's
                          admin profile — the backup uploader cannot GetObject.
  --db-host HOST          Skip probing and use this host.
  --force-prod            Required (together with a typed confirmation) to
                          restore onto the production database.
  --env-file PATH         App env file. Default: /opt/tada/.env
  --backup-env-file PATH  Backup env file; only BACKUP_DB_HOST is read from it.
                          Default: $HOME/.config/tada/backup.env
  --work-dir PATH         Scratch space for downloads/decompression.
                          Default: $HOME/.local/var/backups/tada/restore
  --keep-work             Do not delete the decompressed dump afterwards.
  -h, --help              This text.

Examples:
  # Rehearsal: a prod dump onto a scratch DB (LAUNCH_PLAN #1/#2)
  ./db-restore.sh --source daily/2026/08/12/tada_prod_20260812_030000.dump.gz \
                  --profile tada-owner

  # Incident: restore production from a local dump (prompts for confirmation)
  ./db-restore.sh --source ~/.local/var/backups/tada/tada_prod_20260812_030000.dump.gz \
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
        --db-host)    FORCED_DB_HOST="${2:?--db-host needs a value}"; shift ;;
        --env-file)   ENV_FILE="${2:?--env-file needs a path}"; shift ;;
        --backup-env-file) BACKUP_ENV_FILE="${2:?--backup-env-file needs a path}"; shift ;;
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
# Connection settings
# ---------------------------------------------------------------------------
[ -r "$ENV_FILE" ] || die 2 "app env file not readable: ${ENV_FILE}"

PROD_DB="$(read_env_var "$ENV_FILE" DB_NAME)"
DB_USER="$(read_env_var "$ENV_FILE" DB_USER)"
DB_PORT="$(read_env_var "$ENV_FILE" DB_PORT)"
DB_PASSWORD="$(read_env_var "$ENV_FILE" DB_PASSWORD)"
DB_PORT="${DB_PORT:-5432}"

[ -n "$PROD_DB" ]     || die 2 "DB_NAME is not set in ${ENV_FILE}"
[ -n "$DB_USER" ]     || die 2 "DB_USER is not set in ${ENV_FILE}"
[ -n "$DB_PASSWORD" ] || die 2 "DB_PASSWORD is not set in ${ENV_FILE}"

# DB_HOST from the app env file is `host.docker.internal` and resolves only
# inside a container — never use it here. See db-backup.sh.
export PGPASSWORD="$DB_PASSWORD"

RECORDED_DB_HOST="$(read_env_var "$BACKUP_ENV_FILE" BACKUP_DB_HOST)"

can_connect_db() {
    # Bounded, so a black-holed candidate address cannot hang an incident.
    PGCONNECT_TIMEOUT="${PGCONNECT_TIMEOUT:-5}" \
    psql -h "$1" -p "$DB_PORT" -U "$DB_USER" -d "$2" \
         -v ON_ERROR_STOP=1 -tAc 'SELECT 1' >/dev/null 2>&1
}

# --db-host wins outright; otherwise try the host the installer recorded first,
# then the standard candidates. Same order as db-backup.sh.
if [ -n "$FORCED_DB_HOST" ]; then
    host_candidates="$FORCED_DB_HOST"
else
    host_candidates="${RECORDED_DB_HOST} ${DB_HOST_CANDIDATES}"
fi

DB_HOST_USED=""
for candidate in $host_candidates; do
    if can_connect_db "$candidate" "$PROD_DB"; then
        DB_HOST_USED="$candidate"
        break
    fi
done
[ -n "$DB_HOST_USED" ] || die 8 "no candidate host accepted a connection for ${DB_USER}@${PROD_DB} (tried:${host_candidates})"
log "connected to ${DB_HOST_USED}:${DB_PORT} as ${DB_USER}"

psql_t() { psql -h "$DB_HOST_USED" -p "$DB_PORT" -U "$DB_USER" -v ON_ERROR_STOP=1 -tA "$@"; }

# ---------------------------------------------------------------------------
# Guard: never overwrite production by accident.
#
# "Production" is whatever DB_NAME the app is configured with, not a hardcoded
# string — a renamed prod database must stay protected.
# ---------------------------------------------------------------------------
if [ "$TARGET_DB" = "$PROD_DB" ]; then
    log "TARGET IS THE PRODUCTION DATABASE: ${TARGET_DB}"

    [ "$FORCE_PROD" -eq 1 ] || die 4 "refusing to restore onto production without --force-prod"

    # An interactive human must type it out. Read from the terminal directly so
    # this cannot be satisfied by a pipe, a heredoc or a CI runner.
    [ -t 0 ] || die 4 "refusing: production restore requires an interactive terminal"

    printf '\n'
    printf '  This will DROP AND REPLACE every object in "%s" on %s.\n' "$TARGET_DB" "$DB_HOST_USED"
    printf '  Source: %s\n' "$SOURCE"
    printf '  There is no undo. Take a fresh backup first if you have not.\n\n'
    printf '  Type exactly: restore %s\n  > ' "$TARGET_DB"

    typed=""
    IFS= read -r typed </dev/tty || true
    [ "$typed" = "restore ${TARGET_DB}" ] || die 4 "confirmation did not match — nothing was changed"

    log "production restore confirmed by operator"
fi

# ---------------------------------------------------------------------------
# Prerequisites for a NON-production target, checked before we download
# anything. Both failures below need a one-time change by someone with root on
# the host, and both are far cheaper to learn about here than mid-restore.
# ---------------------------------------------------------------------------
if [ "$TARGET_DB" != "$PROD_DB" ]; then
    target_exists="$(psql_t -d "$PROD_DB" -c "SELECT 1 FROM pg_database WHERE datname = '${TARGET_DB}'" || true)"

    if [ "$target_exists" != "1" ]; then
        can_create="$(psql_t -d "$PROD_DB" -c "SELECT rolcreatedb FROM pg_roles WHERE rolname = current_user" || true)"
        if [ "$can_create" != "t" ]; then
            log "role ${DB_USER} does not have CREATEDB, so ${TARGET_DB} cannot be created over this connection."
            log "One-time fix, as a superuser on the host console:"
            log "    ALTER ROLE ${DB_USER} CREATEDB;"
            log "Alternatively create the database yourself and re-run:"
            log "    CREATE DATABASE ${TARGET_DB} OWNER ${DB_USER};"
            die 2 "cannot create target database ${TARGET_DB}"
        fi
        log "creating database ${TARGET_DB}"
        psql_t -d "$PROD_DB" -c "CREATE DATABASE \"${TARGET_DB}\"" >/dev/null
    else
        log "database ${TARGET_DB} already exists — its contents will be replaced"
    fi

    # pg_hba is per-database. Production grants tada_user on tada_prod only, so
    # a brand new scratch database is unreachable until a line covers it.
    if ! can_connect_db "$DB_HOST_USED" "$TARGET_DB"; then
        log "the database exists but this role cannot CONNECT to it over TCP — almost certainly pg_hba.conf."
        log "One-time fix, as root on the host, in pg_hba.conf:"
        log "    host    all    ${DB_USER}    172.18.0.0/16    scram-sha-256"
        log "(i.e. widen the existing '${PROD_DB}'-only line to 'all'), then:"
        log "    psql -c 'SELECT pg_reload_conf();'   # or: systemctl reload postgresql"
        die 2 "cannot connect to target database ${TARGET_DB}"
    fi
fi

mkdir -p "$WORK_DIR" || die 2 "cannot create work dir ${WORK_DIR}"
chmod 0700 "$WORK_DIR" 2>/dev/null || true

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

# ---------------------------------------------------------------------------
# Restore
#
#   --clean --if-exists  drop objects before recreating them, tolerating absence
#   --no-owner           do not try to reassign ownership; over a non-superuser
#                        connection those commands would fail anyway
# ---------------------------------------------------------------------------
log "restoring into ${TARGET_DB} on ${DB_HOST_USED} (this drops and recreates every object)"
restore_log="${WORK_DIR}/restore_$(date '+%Y%m%d_%H%M%S').log"

if pg_restore -h "$DB_HOST_USED" -p "$DB_PORT" -U "$DB_USER" \
              --clean --if-exists --no-owner \
              --dbname "$TARGET_DB" "$dump_path" >"$restore_log" 2>&1; then
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

tables="$(psql_t -d "$TARGET_DB" -c \
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
    count="$(psql_t -d "$TARGET_DB" -c "SELECT count(*) FROM public.\"${table}\"")"
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
