# Database backup runbook

**Scope:** the production PostgreSQL database on the app VPS (`ta-da.co`).
**Status:** implemented, not yet installed on the host — see [Installation](#3-installation).
**Related:** `docs/audit/LAUNCH_PLAN.md` items 1–3, refactoring plan step 7.6.

> **Everything here runs without root.** The production SSH user has **no
> passwordless sudo** — the first installer attempt died on
> `sudo: a password is required` (2026-08-12), cleanly, before any writes. The
> design below is a consequence of that fact, not a preference. If you ever see
> a `sudo` in this backup path, it is a bug.

---

## 1. How it works

```
user crontab (every 6h)           deploy.yml (before every prod release)
        │                                        │
        └──────────────┬─────────────────────────┘
                       ▼
        ~/.local/bin/tada-db-backup [--pre-deploy]
                       │
   pg_dump -h <probed host> -p 5432 -U tada_user -Fc tada_prod
   (TCP, password from /opt/tada/.env via PGPASSWORD — no sudo, no socket)
                       │
                     gzip
                       │
   ~/.local/var/backups/tada/tada_prod_YYYYmmdd_HHMMSS.dump.gz
                       │
        aws s3 cp  ->  s3://tada-db-backups/{daily|pre-deploy}/YYYY/MM/DD/…
                       │
        aws s3 ls  ->  verify the object exists and the size matches
                       │
        prune local copies to the newest 3
```

### Why TCP and a password, not `sudo -u postgres`

`sudo -u postgres pg_dump` over the unix socket is the tidier way to do this and
is what the first version did. It requires passwordless sudo, which this host
does not give the deploy user. So the backup authenticates as the **application
role** over TCP instead, with `DB_USER` / `DB_PASSWORD` read from
`/opt/tada/.env`. `tada_user` owns `tada_prod`, so it can dump all of it.

The password is passed through `PGPASSWORD` in the process environment — never
on a command line, never in the log. (Verified: the log contains zero
occurrences of the password after a full run.)

### Which host — do not guess this

`/opt/tada/.env` says `DB_HOST=host.docker.internal`. **That name only resolves
inside a container.** On the host it resolves to nothing, and a backup that
believed it would fail every time. What is actually true on this host:

- Postgres listens on `localhost,172.18.0.1`
- `pg_hba.conf` grants `tada_user` → `tada_prod` on `172.18.0.0/16 scram-sha-256`

So the script **probes** `172.18.0.1`, then `127.0.0.1`, then `localhost`, and a
candidate only counts if it authenticates *and* can read the database — a
liveness check like `pg_isready` would happily accept a host that `pg_hba` then
rejects. Each probe is bounded by `PGCONNECT_TIMEOUT=5` so a black-holed address
cannot hang the run.

The installer records the winner as `BACKUP_DB_HOST=` in the credentials file,
so scheduled runs connect directly with no probing. If that recorded host ever
stops answering, the script logs a warning and falls back to probing rather than
failing outright.

### Facts the design rests on

| Fact | Consequence |
|---|---|
| The SSH user has **no passwordless sudo** | Nothing needs root: state lives under `$HOME`, the AWS CLI is installed into `$HOME`, scheduling is the user's crontab. |
| Postgres is **host-native PG 16.14** on the same VPS (verified at install) | `pg_dump` 16.14 on the host matches the server major, which is required — an older client refuses to dump a newer server. |
| The database name and credentials live in `/opt/tada/.env` | The script **reads** them; nothing is hardcoded. A rename cannot silently produce empty backups. |
| Media is stored in S3 by reference, no `bytea` | The dump is small (< 10 MB), so a 6-hourly full dump is cheap. |
| Disk: 38 G total, 29 G free (verified 2026-08-12) | Three local dumps of a few MB are not a capacity concern. |

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
2. **Restoring from S3 needs the owner's own AWS credentials.** The backup user
   physically cannot download. Use an admin profile
   (`aws configure --profile tada-owner`) and pass `--profile tada-owner`.
   Restoring from a local file in `~/.local/var/backups/tada` needs no AWS
   credentials at all.

### Where everything lives

| | Path |
|---|---|
| Backup script | `~/.local/bin/tada-db-backup` |
| Restore script | `~/.local/bin/tada-db-restore` |
| AWS CLI v2 | `~/.local/aws-cli`, symlinked into `~/.local/bin` |
| Credentials + recorded DB host | `~/.config/tada/backup.env` (mode `600`) |
| Local dumps | `~/.local/var/backups/tada/` (mode `700`) |
| Log | `~/.local/var/log/tada-backup.log` (mode `600`) |
| Cron's own stdout/stderr | `~/.local/var/log/tada-backup-cron.log` |

---

## 2. Schedule and retention

| | Where | Kept for |
|---|---|---|
| Every 6 hours (00:00, 06:00, 12:00, 18:00 server time) | `s3://tada-db-backups/daily/YYYY/MM/DD/` | 90 days (bucket lifecycle) |
| Before every production deploy | `s3://tada-db-backups/pre-deploy/YYYY/MM/DD/` | 90 days (bucket lifecycle) |
| The newest 3 dumps of either kind | `~/.local/var/backups/tada/` on the host | until pruned by the next successful run |

A dump whose **upload** failed is deliberately *not* pruned — it is a good local
dump, and you may want to retry the upload by hand.

Bucket configuration (set up in the AWS console, not by this repo): private,
versioning **on**, SSE-S3, all public access blocked. Lifecycle: current objects
expire after **90 days**, non-current versions after **30 days**, incomplete
multipart uploads after **7 days**.

> **⚠ cron has no catch-up.** The earlier systemd design used
> `Persistent=true`, which re-runs a job that was missed while the host was
> down. **Plain cron has no equivalent** — a run whose moment passed while the
> machine was off is simply skipped, and the next one happens on schedule. The
> practical exposure is one 6-hour window after an outage. The pre-deploy backup
> covers the case that matters most (never migrating without a fresh dump), and
> §7 (alerting) is what would make a silently-stopped timer visible. This is a
> real trade for having no root, not an oversight.

---

## 3. Installation

One-time, and safe to re-run. **No root required.**

**Prerequisite — two GitHub repository secrets** (Settings → Secrets and
variables → Actions). These are already set:

| Secret | Value |
|---|---|
| `BACKUP_AWS_ACCESS_KEY_ID` | Access key id of the `tada-backup-uploader` IAM user |
| `BACKUP_AWS_SECRET_ACCESS_KEY` | Its secret access key |

(`VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_PORT` already exist — `deploy.yml`
uses them.) Never commit the credentials CSV from the IAM console.

**Then:** Actions → **Install DB backup** → *Run workflow* → type `install` in
the confirm field → Run.

What it does, all as the ordinary SSH user:

1. Prints the facts — `pg_dump`/`psql` versions, server version, `DB_*` from
   `/opt/tada/.env` with the password masked, whether the role has `CREATEDB`,
   and `df -h`.
2. Installs **AWS CLI v2 into `$HOME/.local`** from AWS's official zip if `aws`
   is not already on `PATH` (`./aws/install -i ~/.local/aws-cli -b ~/.local/bin`).
   It extracts with `unzip`, or with `python3 -m zipfile` if `unzip` is absent —
   neither can be apt-installed without root.
3. Probes the database host and records the winner.
4. Installs the two scripts into `~/.local/bin` (read out of the git object
   database with `git show`, so the deployed working tree is never touched).
5. Writes `~/.config/tada/backup.env`, mode `600`.
6. Installs the crontab block, idempotently.
7. Runs one backup and lists the object in S3.

It refuses to continue if `pg_dump` is older than the server, or if no candidate
host authenticates.

<details>
<summary>Manual equivalent, if the workflow is not an option</summary>

```bash
# on the host, as the deploy/SSH user — no sudo anywhere
mkdir -p ~/.local/bin ~/.config/tada ~/.local/var/backups/tada ~/.local/var/log
chmod 700 ~/.config/tada ~/.local/var/backups/tada

install -m 0755 /opt/tada/app/scripts/db-backup.sh  ~/.local/bin/tada-db-backup
install -m 0755 /opt/tada/app/scripts/db-restore.sh ~/.local/bin/tada-db-restore

# AWS CLI v2 into $HOME (skip if `aws` already works)
curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-$(uname -m).zip" -o /tmp/awscliv2.zip
unzip -q /tmp/awscliv2.zip -d /tmp && /tmp/aws/install -i ~/.local/aws-cli -b ~/.local/bin --update

cat > ~/.config/tada/backup.env <<'EOF'
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=eu-west-2
BACKUP_BUCKET=tada-db-backups
BACKUP_DB_HOST=172.18.0.1
EOF
chmod 600 ~/.config/tada/backup.env

crontab -e     # add:
# 0 */6 * * * $HOME/.local/bin/tada-db-backup >> $HOME/.local/var/log/tada-backup-cron.log 2>&1

~/.local/bin/tada-db-backup      # prove it end to end
```
</details>

---

## 4. Everyday operations

### Take a backup right now

```bash
~/.local/bin/tada-db-backup
```

### Is the schedule alive?

```bash
crontab -l                                    # the managed block must be present
tail -n 50 ~/.local/var/log/tada-backup.log   # the script's own log
tail -n 20 ~/.local/var/log/tada-backup-cron.log  # anything cron itself said
ls -lh ~/.local/var/backups/tada/             # newest dump should be < 6h old
```

A healthy run ends with:

```
=== backup OK: s3://tada-db-backups/daily/2026/08/12/tada_prod_20260812_060000.dump.gz ===
```

**The most useful single check** is the age of the newest file in the staging
directory. If it is older than ~6 hours, the schedule is not running.

### What is in the bucket?

```bash
aws --profile tada-owner s3 ls s3://tada-db-backups/daily/ --recursive | tail -20
aws --profile tada-owner s3 ls s3://tada-db-backups/pre-deploy/ --recursive | tail -20
```

### Exit codes

| Code | Meaning | First thing to check |
|---|---|---|
| 0 | Success | — |
| 2 | Configuration problem | Does `~/.config/tada/backup.env` exist with 5 keys? Are `DB_NAME`/`DB_USER`/`DB_PASSWORD` in `/opt/tada/.env`? |
| 3 | `pg_dump` failed | The stderr is appended to the log. Cluster up? Disk? |
| 4 | Dump empty or corrupt | Disk full? `df -h ~`. |
| 5 | Upload failed | Credentials, network, bucket policy. |
| 6 | Upload could not be verified | The object did not appear or its size differs — treat as a failed backup. |
| 7 | Another backup is already running | The 6-hourly run colliding with a pre-deploy one; harmless. |
| 8 | **No database host authenticated** | The most likely real failure. Did `DB_PASSWORD` change in `/opt/tada/.env`? Did `listen_addresses` or `pg_hba.conf` change? Try by hand: `PGPASSWORD=... psql -h 172.18.0.1 -U tada_user -d tada_prod -c 'select 1'`. |

**A non-zero exit from the pre-deploy step fails the deploy on purpose.** If a
release is blocked by it, fix the backup — do not skip it. The migrations are
not atomic (`migrationsTransactionMode: "each"`, and `AddPerformanceIndexes`
runs with `transaction = false`), so a fresh dump is the only floor under a
failed migration.

---

## 5. Restoring

> **Restoring is destructive.** `pg_restore --clean --if-exists` drops every
> object it is about to recreate. The default target of `db-restore.sh` is a
> scratch database precisely so a mistyped command cannot hit production.

### 5.1 Two one-time prerequisites for restoring to a SCRATCH database

**Read this before the rehearsal — neither is done yet, and both need a
superuser once.** They are consequences of the sudo-free, application-role
design, and the script checks for both *before* downloading anything and prints
the exact fix.

1. **`tada_user` needs `CREATEDB`** to create the scratch database:

   ```sql
   ALTER ROLE tada_user CREATEDB;
   ```

   (Or create the scratch database yourself once:
   `CREATE DATABASE tada_restore_check OWNER tada_user;`)

2. **`pg_hba.conf` must cover the scratch database.** Today it grants
   `tada_user` on database `tada_prod` **only**, so a brand-new scratch database
   is rejected at connect time with `no pg_hba.conf entry`. Widen that line:

   ```
   host    all    tada_user    172.18.0.0/16    scram-sha-256
   ```

   then `SELECT pg_reload_conf();` (or `systemctl reload postgresql`).

Both were reproduced deliberately in a container configured with prod's exact
`pg_hba` shape, and the script's guidance is what it printed there. Neither
affects **backups**, which only ever touch `tada_prod`, and neither affects a
restore **onto production**, which is also `tada_prod`.

### 5.2 Restore onto a scratch database (the normal case)

```bash
# from S3 — needs the OWNER's credentials (the backup user cannot GetObject)
~/.local/bin/tada-db-restore \
  --source daily/2026/08/12/tada_prod_20260812_060000.dump.gz \
  --target tada_restore_check \
  --profile tada-owner

# from a local dump — no AWS credentials needed at all
~/.local/bin/tada-db-restore \
  --source ~/.local/var/backups/tada/tada_prod_20260812_060000.dump.gz \
  --target tada_restore_check
```

It creates the target if needed, restores, then prints **exact row counts per
table** plus a total. That table is the deliverable — a restore that runs but
yields empty tables is a failed restore.

### 5.3 Restore onto production (incident only)

```bash
# 1. FIRST take a fresh dump of the broken state — you may need it to
#    reconstruct what happened, and it costs seconds.
~/.local/bin/tada-db-backup

# 2. Stop the app so nothing writes during the restore.
cd /opt/tada/app && docker compose stop backend

# 3. Restore. REQUIRES --force-prod and an interactively typed confirmation
#    ("restore tada_prod"). It cannot be satisfied from CI or a pipe.
~/.local/bin/tada-db-restore \
  --source ~/.local/var/backups/tada/<the-good-dump>.dump.gz \
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
`npm run mig:revert:prod:notx` — `DROP INDEX CONCURRENTLY` cannot run inside a
transaction. See LAUNCH_PLAN item 3.

---

## 6. Release rehearsal (LAUNCH_PLAN items 1–2)

The rehearsal is what turns "we have backups" into "we have restored one", and
it is a hard gate before the `develop → main` release.

**Do §5.1 first** — without `CREATEDB` and the widened `pg_hba` line, step 2
below stops with an instruction instead of a restore.

```bash
# 1. Fresh dump of prod.
~/.local/bin/tada-db-backup

# 2. Restore it onto a scratch database and capture the row counts.
~/.local/bin/tada-db-restore \
  --source "$(ls -1d ~/.local/var/backups/tada/*.dump.gz | tail -1)" \
  --target tada_release_rehearsal | tee ~/rehearsal-before.txt

# 3. Compare against the live database, table by table. They must match
#    (allowing for rows written between the dump and this query).
export PGPASSWORD="$(grep -E '^DB_PASSWORD=' /opt/tada/.env | cut -d= -f2-)"
PSQL="psql -h 172.18.0.1 -U tada_user -tA"
$PSQL -d tada_prod -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY 1" |
while read -r t; do
  printf '%-45s %s\n' "$t" "$($PSQL -d tada_prod -c "SELECT count(*) FROM public.\"$t\"")"
done | tee ~/live-counts.txt

# 4. Run the release migrations against the rehearsal database — LAUNCH_PLAN
#    item 2. Copy /opt/tada/.env, set DB_NAME=tada_release_rehearsal in the
#    COPY, and point the migration runner at it. Do NOT edit /opt/tada/.env.
#    Record which migrations apply and how long each takes.

# 5. Re-run the row counts on the rehearsal DB and diff against step 2 — a
#    migration that silently drops rows shows up here and nowhere else.

# 6. Drop the rehearsal database when done.
$PSQL -d tada_prod -c "DROP DATABASE tada_release_rehearsal"
unset PGPASSWORD
```

Stage cannot substitute: stage and prod have different migration histories (step
0.3 found prod at 48/48 and stage at 51 records / 50 files with a ghost entry),
and the specific landmine — `1785250907864-DropDuplicateProfileIdentityColumns`
— produced a live 500 on `/api/auth/me` locally when schema and entities
disagreed.

---

## 7. Deferred: backup-failure alerting

**Not yet implemented. Add post-launch.** This matters *more* under cron than it
did under systemd, because cron has no catch-up and no `systemctl status` to
ask.

Today a failed backup is loud in three places — a non-zero exit, a `FATAL` line
in the log, and a failed pre-deploy step that blocks the release. But **nobody is
told**, and a schedule that stops firing (host down, credentials rotated, disk
full, crontab wiped) is silent until somebody looks.

The intended fix is a dead-man's-switch: the backup pings a
[healthchecks.io](https://healthchecks.io) check URL on success, and the service
emails when a ping does not arrive in the expected window. Roughly:

1. Create a check with a 6-hour period and a 1-hour grace.
2. Add `HEALTHCHECK_URL=` to `~/.config/tada/backup.env`.
3. At the end of `db-backup.sh`, on success only:
   `curl -fsS -m 10 --retry 3 "$HEALTHCHECK_URL" >/dev/null || true`
   — and in `die()`, ping `"$HEALTHCHECK_URL/fail"` so failures alert
   immediately rather than at the end of the grace window.

Deliberately deferred: it adds an outbound dependency and an account to manage,
and it protects against *silence*, which is a week-two problem. The launch bar
is that the backup exists and has been restored (LAUNCH_PLAN items 1–2).

---

## 8. Known limits

- **No off-site copy outside AWS.** A compromise or closure of the AWS account
  takes the backups with it. Versioning plus a write-only uploader covers the
  realistic host-compromise case, not that one.
- **No point-in-time recovery.** WAL archiving is not configured, so the worst
  case is losing up to 6 hours of writes (less around a deploy). PITR needs
  configuration changes that require root, which is exactly what this host does
  not give us.
- **No catch-up for missed runs** — see the note in §2.
- **The database password is on disk in `/opt/tada/.env`** and is read by the
  backup. That is pre-existing (the app reads the same file); the backup adds no
  new exposure, and never logs or transmits the value.
- **Restore is manual by design.** There is no automatic failover, and there
  should not be one at this size.
- **The bucket lifecycle is configured in the AWS console, not in this repo.**
  If it is changed there, update §2 to match; nothing here enforces it.
- **The systemd unit + timer were removed** (they were in the first version).
  They needed `/etc/systemd/system`, i.e. root. If the host ever grants the
  deploy user sudo — or if `loginctl enable-linger` is set up for user units —
  a systemd timer with `Persistent=true` is strictly better than cron and worth
  revisiting.
