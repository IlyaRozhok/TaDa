# Database backup runbook

**Scope:** the production PostgreSQL database on the app VPS (`ta-da.co`).
**Status:** implemented, not yet installed on the host — see [Installation](#installation).
**Related:** `docs/audit/LAUNCH_PLAN.md` items 1–3, refactoring plan step 7.6.

---

## 1. How it works

```
systemd timer (every 6h)          deploy.yml (before every prod release)
        │                                        │
        └──────────────┬─────────────────────────┘
                       ▼
        /usr/local/bin/tada-db-backup [--pre-deploy]
                       │
   sudo -u postgres pg_dump -Fc "$DB_NAME"   (unix socket, no password)
                       │
                     gzip
                       │
        /var/backups/tada/tada_prod_YYYYmmdd_HHMMSS.dump.gz
                       │
        aws s3 cp  ->  s3://tada-db-backups/{daily|pre-deploy}/YYYY/MM/DD/…
                       │
        aws s3 ls  ->  verify the object exists and the size matches
                       │
        prune local copies to the newest 3
```

Facts the design rests on:

| Fact | Consequence |
|---|---|
| Postgres is **host-native PG 16 on the app VPS**, not a managed service | The dump goes over the local unix socket as the `postgres` superuser. No password and no network are involved, so no database credentials appear anywhere in the backup path. |
| The VPS is **Hetzner, not AWS** | There are no instance roles. A static IAM access key is unavoidable; it is confined to a write-only user and lives only in `/opt/tada/backup.env` (mode `600`). |
| The database name lives in `/opt/tada/.env` | The script **reads `DB_NAME`**; it is never hardcoded. A renamed database cannot silently produce empty backups. |
| Media is stored in S3 by reference, no `bytea` | The dump is small (< 10 MB), so a 6-hourly full dump is cheap and incremental strategies are unnecessary. |

### The write-only IAM user, and why restores are different

`tada-backup-uploader` has an inline policy allowing exactly two actions:
`s3:ListBucket` on the bucket and `s3:PutObject` on `bucket/*`.
It **cannot** `GetObject` and **cannot** `DeleteObject`.

That is deliberate — if the app host is compromised, the attacker can add
objects but cannot read or destroy the backup history (bucket versioning is on
as a second layer).

Two consequences that will otherwise waste your time:

1. Upload verification uses `aws s3 ls` (`ListObjectsV2`), **not**
   `aws s3api head-object` — `head-object` requires `GetObject` and would fail.
   Do not "fix" the script by switching to it.
2. **Restoring from S3 needs the owner's own AWS credentials.** The backup
   user physically cannot download. Use an admin profile:
   `aws configure --profile tada-owner`, then pass `--profile tada-owner` to
   `db-restore.sh`. If you restore from a local file in `/var/backups/tada`, no
   AWS credentials are needed at all.

---

## 2. Schedule and retention

| | Where | Kept for |
|---|---|---|
| Every 6 hours (00:00, 06:00, 12:00, 18:00 server time, ±5 min jitter) | `s3://tada-db-backups/daily/YYYY/MM/DD/` | 90 days (bucket lifecycle) |
| Before every production deploy | `s3://tada-db-backups/pre-deploy/YYYY/MM/DD/` | 90 days (bucket lifecycle) |
| The newest 3 dumps of either kind | `/var/backups/tada/` on the host | until pruned by the next run |

Bucket configuration (set up in the AWS console, not by this repo):
private, versioning **on**, SSE-S3 encryption, all public access blocked.
Lifecycle: current objects expire after **90 days**, non-current versions after
**30 days**, incomplete multipart uploads after **7 days**.

`Persistent=true` on the timer means a run missed while the host was down is
taken as soon as it comes back, rather than being skipped silently.

---

## 3. Installation

One-time, and safe to re-run.

**Prerequisite — add these two GitHub repository secrets** (Settings → Secrets
and variables → Actions):

| Secret | Value |
|---|---|
| `BACKUP_AWS_ACCESS_KEY_ID` | Access key id of the `tada-backup-uploader` IAM user |
| `BACKUP_AWS_SECRET_ACCESS_KEY` | Its secret access key |

(`VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_PORT` already exist — `deploy.yml`
uses them.)

Never commit the credentials CSV downloaded from the IAM console, and delete it
once the secrets are entered.

**Then:** Actions → **Install DB backup** → *Run workflow* → type `install` in
the confirm field → Run.

The workflow prints the facts it finds (`psql -V`, server version, `DB_NAME`
with the password masked, `df -h`), installs `awscli` and a matching
`postgresql-client` if either is missing, installs the scripts and units,
writes `/opt/tada/backup.env` (mode `600`, owner `deploy`), enables the timer,
then **takes one backup and lists the object in S3** so the whole path is proven
before you walk away.

It refuses to continue if `pg_dump` is older than the server — a PG 14 client
cannot dump a PG 16 database.

<details>
<summary>Manual equivalent, if the workflow is not an option</summary>

```bash
# on the host, as deploy
sudo install -m 0755 /opt/tada/app/scripts/db-backup.sh  /usr/local/bin/tada-db-backup
sudo install -m 0755 /opt/tada/app/scripts/db-restore.sh /usr/local/bin/tada-db-restore
sudo install -m 0644 /opt/tada/app/deploy/systemd/tada-db-backup.service /etc/systemd/system/
sudo install -m 0644 /opt/tada/app/deploy/systemd/tada-db-backup.timer   /etc/systemd/system/

sudo mkdir -p /var/backups/tada && sudo chown deploy:deploy /var/backups/tada
sudo touch /var/log/tada-backup.log && sudo chown deploy:deploy /var/log/tada-backup.log

sudo -e /opt/tada/backup.env    # AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,
                                # AWS_DEFAULT_REGION=eu-west-2,
                                # BACKUP_BUCKET=tada-db-backups
sudo chmod 600 /opt/tada/backup.env && sudo chown deploy:deploy /opt/tada/backup.env

sudo systemctl daemon-reload
sudo systemctl enable --now tada-db-backup.timer
/usr/local/bin/tada-db-backup          # prove it end to end
```

If `apt` has no usable `awscli`, install AWS CLI v2 from AWS's own installer as
documented at `https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html`.
</details>

---

## 4. Everyday operations

### Take a backup right now

```bash
sudo systemctl start tada-db-backup.service    # via systemd, logged to the journal
# or directly, with output on your terminal:
/usr/local/bin/tada-db-backup
```

### Is the timer alive?

```bash
systemctl status tada-db-backup.timer          # should say "active (waiting)"
systemctl list-timers tada-db-backup.timer     # NEXT / LEFT / LAST / PASSED
journalctl -u tada-db-backup.service -n 50 --no-pager
tail -n 50 /var/log/tada-backup.log
```

A healthy run ends with a line like:

```
=== backup OK: s3://tada-db-backups/daily/2026/08/12/tada_prod_20260812_060000.dump.gz ===
```

### What is in the bucket?

Needs the **owner's** credentials (`ListBucket` alone is enough for this, so the
backup user could also do it, but keep the habit):

```bash
aws --profile tada-owner s3 ls s3://tada-db-backups/daily/ --recursive | tail -20
aws --profile tada-owner s3 ls s3://tada-db-backups/pre-deploy/ --recursive | tail -20
```

### Exit codes

| Code | Meaning | First thing to check |
|---|---|---|
| 0 | Success | — |
| 2 | Configuration problem | Does `/opt/tada/backup.env` exist and hold 4 keys? Is `DB_NAME` in `/opt/tada/.env`? |
| 3 | `pg_dump` failed | `sudo -u postgres psql -l` — is the cluster up, does the database exist? |
| 4 | Dump empty or corrupt | Disk full? `df -h`. Check the log for the pg_dump stderr. |
| 5 | Upload failed | Credentials, network, or the bucket policy. Try `aws s3 ls s3://tada-db-backups/`. |
| 6 | Upload could not be verified | The object did not appear or its size differs — treat as a failed backup. |
| 7 | Another backup is already running | Usually the timer colliding with a pre-deploy run; harmless, it will run again. |

**A non-zero exit from the pre-deploy step fails the deploy on purpose.** If a
release is blocked by it, fix the backup — do not skip it. The migrations are
not atomic (`migrationsTransactionMode: "each"`, and
`AddPerformanceIndexes` runs with `transaction = false`), so a fresh dump is the
only floor under a failed migration.

---

## 5. Restoring

> **Restoring is destructive.** `pg_restore --clean --if-exists` drops every
> object it is about to recreate. The default target of `db-restore.sh` is a
> scratch database precisely so that a mistyped command cannot hit production.

### 5.1 Restore onto a scratch database (the normal case)

Use this for rehearsals, for inspecting last week's data, and as the first step
of any incident — you want to know the dump is good *before* you touch prod.

```bash
# from S3 — needs the OWNER's credentials (the backup user cannot GetObject)
/usr/local/bin/tada-db-restore \
  --source daily/2026/08/12/tada_prod_20260812_060000.dump.gz \
  --target tada_restore_check \
  --profile tada-owner

# from a local dump — no AWS credentials needed at all
/usr/local/bin/tada-db-restore \
  --source /var/backups/tada/tada_prod_20260812_060000.dump.gz \
  --target tada_restore_check
```

It creates the target database if needed, restores, and then prints **exact row
counts per table** plus a total. That table is the deliverable — a restore that
runs but yields empty tables is a failed restore.

### 5.2 Restore onto production (incident only)

```bash
# 1. FIRST take a fresh dump of the broken state — you may need it to
#    reconstruct what happened, and it costs 10 seconds.
/usr/local/bin/tada-db-backup

# 2. Stop the app so nothing writes during the restore.
cd /opt/tada/app && docker compose stop backend

# 3. Restore. This REQUIRES --force-prod and an interactively typed
#    confirmation ("restore tada_prod"). It cannot be run from CI or a pipe.
/usr/local/bin/tada-db-restore \
  --source /var/backups/tada/<the-good-dump>.dump.gz \
  --target tada_prod \
  --force-prod

# 4. Read the row counts it prints. Compare with what you expect.

# 5. Bring the app back and smoke it.
docker compose up -d backend
curl -sS https://ta-da.co/api/health
```

If the restore is being done because a **migration** failed, remember that
`git revert` does not undo a migration, and that
`1785801600000-AddPerformanceIndexes` must be reverted with
`npm run mig:revert:prod:notx` (the `notx` variant) — `DROP INDEX CONCURRENTLY`
cannot run inside a transaction. See LAUNCH_PLAN item 3.

---

## 6. Release rehearsal (LAUNCH_PLAN items 1–2)

The rehearsal is what turns "we have backups" into "we have restored one", and
it is a hard gate before the `develop → main` release. Run it on the prod host
(or on stage, against a prod dump).

```bash
# 1. Fresh dump of prod.
/usr/local/bin/tada-db-backup

# 2. Restore it onto a scratch database and capture the row counts.
/usr/local/bin/tada-db-restore \
  --source /var/backups/tada/$(ls -1 /var/backups/tada | tail -1) \
  --target tada_release_rehearsal | tee ~/rehearsal-before.txt

# 3. Compare against the live database, table by table. They must match
#    (allowing for rows written between the dump and this query).
sudo -u postgres psql -tA -d tada_prod -c "
  SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY 1" |
while read -r t; do
  printf '%-45s %s\n' "$t" "$(sudo -u postgres psql -tA -d tada_prod -c "SELECT count(*) FROM public.\"$t\"")"
done | tee ~/live-counts.txt

# 4. Point the app's migration runner at the rehearsal database and run the
#    release migrations against it — this is LAUNCH_PLAN item 2. Record which
#    migrations apply and how long each takes.
#    (Set DB_NAME=tada_release_rehearsal in a COPY of the env file; do not edit
#     /opt/tada/.env.)

# 5. Re-run the row counts on the rehearsal DB afterwards and diff against
#    step 2 — a migration that silently drops rows shows up here and nowhere else.

# 6. Drop the rehearsal database when done.
sudo -u postgres dropdb tada_release_rehearsal
```

Stage cannot substitute for this: stage and prod have different migration
histories (step 0.3 found prod at 48/48 and stage at 51 records / 50 files with
a ghost entry), and the specific landmine —
`1785250907864-DropDuplicateProfileIdentityColumns` — produced a live 500 on
`/api/auth/me` locally when schema and entities disagreed.

---

## 7. Deferred: backup-failure alerting

**Not yet implemented. Add post-launch.**

Today a failed backup is loud in three places — a non-zero exit, a `FATAL` line
in `/var/log/tada-backup.log`, and a failed unit in `journalctl` — and the
pre-deploy failure blocks a release outright. But **nobody is told**. A timer
that stops firing (host down, credentials rotated, disk full) is silent until
somebody looks.

The intended fix is a dead-man's-switch: the backup pings a
[healthchecks.io](https://healthchecks.io) check URL on success, and the service
emails when a ping does not arrive in the expected window. Roughly:

1. Create a check with a 6-hour period and a 1-hour grace.
2. Add `HEALTHCHECK_URL=` to `/opt/tada/backup.env`.
3. At the end of `db-backup.sh`, on success only:
   `curl -fsS -m 10 --retry 3 "$HEALTHCHECK_URL" >/dev/null || true`
   — and, in `die()`, ping `"$HEALTHCHECK_URL/fail"` so failures alert
   immediately rather than at the end of the grace window.
4. Optionally add `OnFailure=` to the systemd unit for a local mail.

Deliberately deferred: it adds an outbound dependency and an account to manage,
and it protects against *silence*, which is a week-two problem. The launch bar
is that the backup exists and has been restored (LAUNCH_PLAN items 1–2).

---

## 8. Known limits

- **No off-site copy outside AWS.** A compromise of the AWS account, or its
  closure, takes the backups with it. Versioning plus a write-only uploader
  covers the realistic host-compromise case, not that one.
- **No point-in-time recovery.** WAL archiving is not configured, so the worst
  case is losing up to 6 hours of writes (less around a deploy, thanks to the
  pre-deploy dump). PITR is a bigger change and is not on the launch bar.
- **Restore is manual by design.** There is no automatic failover, and there
  should not be one at this size — an automatic restore is a way to lose data
  twice.
- **The bucket lifecycle is configured in the AWS console, not in this repo.**
  If it is ever changed there, update §2 to match; nothing here enforces it.
