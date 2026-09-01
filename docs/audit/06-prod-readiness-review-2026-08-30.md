# 06 — Production-readiness & product-logic review (round 4)

**Date:** 2026-08-30, first production release live at ta-da.co (prod = `develop@d729136`).
**Scope:** four parallel deep passes — backend production readiness, the tenant
journey, the operator/admin journey + public surface, frontend production
quality — focused on "is this ready for real users", not on code style.
**Method:** adversarial code reading on both sides of every flow; STATUS.md's
known follow-ups were excluded unless materially understated.

**Overall verdict:** the foundations hold. The reviewers actively hunted for
SQL injection, IDOR, mass assignment and guard gaps and found none; CAS
transitions, the notification outbox, refresh rotation and operator ownership
scoping all survived adversarial reading. What did not hold up clusters into
two themes: **the product is silent when it fails** (errors swallowed on both
sides of the API), and **admin tooling can destroy production data in one
click**.

Items marked **[G1]** are fixed by the package G1 PR that ships this document.
Items marked **[G2]**/**[H]** are scheduled in STATUS.md's roadmap.

---

## P0 — data destruction / broken core loops

1. **[G1] One admin click on "delete user" for an operator irreversibly wiped
   their catalogue and all booking history.** `properties.operator_id → users`
   and `buildings.operator_id → users` were `ON DELETE CASCADE`
   (`property.entity.ts`, `building.entity.ts`), and booking requests cascade
   from properties — so deleting an operator account destroyed every listing
   they own and every tenant's booking rows on those listings, with no
   warning and no backup installed (host action #1 still pending). *Fixed:*
   both FKs are now `RESTRICT` (migration `1788400000000`), and the shared
   deletion path returns an actionable 409.

2. **[G1] Admin-created accounts could never sign in — and permanently
   bricked their email.** Auth is Google-only and `googleAuth` resolved users
   only by `google_id`; an admin-created operator's first sign-in fell into
   the create path and died on the unique-email constraint (500 → OAuth error
   page, forever). The Add User modal collects a password that nothing reads.
   The same mechanics let any authenticated user squat a stranger's email via
   self-service `PUT /users/profile`, blocking that person's future signup.
   *Fixed:* `googleAuth` links by Google-verified email when the `google_id`
   lookup misses; `email` removed from `UpdateUserDto`; password made
   optional in `CreateUserDto`. **[G2]** the admin modal's password field.

3. **[G1] Multi-select lifestyle answers zeroed the matching engine.** The
   wizard stores occupation / family status / children as one comma-joined
   string ("student,young-professional"); the scorers compared it as a single
   value, so the tenants who answered most thoroughly scored 0 with "Unknown
   occupation type" (occupation weight 6, family 5, children 4) on every
   card. *Fixed:* the three scorers now compare any-of over the selected
   values (`scoring/preference-list.ts`).

4. **[G1 copy / follow-up UI] The viewing-proposal email pointed at a screen
   that does not exist.** The C1 email said "confirm the time in your TaDa
   account", but the frontend has no binding for the viewing endpoints and
   renders neither `proposed_viewing_at` nor a confirm action. *Fixed (copy):*
   the email now asks the tenant to reply. The real fix — a tenant-side
   viewing/status UI — stays a scheduled follow-up (package H).

5. **[G2] Mobile "Sign Out" does not sign out.**
   `TenantUniversalHeader.tsx:335` only dispatches the Redux logout and
   `router.push("/")` — it never calls `POST /auth/logout`, so the httpOnly
   cookies stay valid and the next visit restores the session (shared-phone
   hazard). Desktop `UserDropdown.tsx:92` does it correctly.

6. **[G2] Russian error screens in the Google OAuth callback.**
   `auth/callback/page.tsx` renders hardcoded Russian copy (including for the
   routine "user pressed Cancel" case) plus a developer checklist about
   Google Cloud Console and a debug config-check button — on the only sign-in
   funnel of an English-first production site.

7. **[G2] A cancelled booking locks "Request" as disabled forever.** The
   cancel email promises "you can apply again" and the backend deliberately
   reopens a cancelled request on resubmit, but
   `PropertyDetailClient.tsx:429` computes `hasBookingRequest` from *any*
   request row regardless of status — the one path the backend supports is
   unreachable from the UI.

---

## P1 — the product is silent when it fails

8. **[G2] Preferences "Finish" reports success when the save failed.**
   `usePreferences.ts` stores errors in state nothing renders and does not
   rethrow; `NewPreferencesPage.tsx` proceeds to the redirect regardless.
   Matching then runs on stale/absent data with no signal anywhere.

9. **[G2] A failed feed load renders as "No results found".**
   `units/page.tsx:119` maps `feedError` to an empty grid; an API outage
   tells tenants the inventory is empty, with no retry.

10. **[G2] No error boundary anywhere.** No `error.tsx`, `global-error.tsx`
    or `not-found.tsx` in the whole frontend — any render throw gives the
    unstyled Next.js white screen.

11. **[G2] Backend error messages never reach users — two RTK-shape bugs.**
    Both the admin booking-status handler (`panel/page.tsx:543`) and the
    tenant booking submit (`PropertyDetailClient.tsx:782`) read the axios
    shape `err.response.data.message` from RTK Query errors (whose shape is
    `err.data.message`), so the backend's precise messages ("only one step
    back", "not available for booking", CAS conflicts) collapse into generic
    failures. Related: `apiErrorMessage` (`panel/page.tsx:115`) drops
    class-validator's `string[]` messages entirely.

12. **[G2] Preferences autosave silently drops fields.** One shared timeout +
    one pending-field slot in `usePreferences.ts:506` — editing two fields
    within 500 ms loses the first; duplicate first-time POSTs can 409 against
    the UNIQUE constraint and are swallowed.

13. **[G1] No timeouts on the SES and S3 clients.** SDK default request
    timeout is infinite; the notification retry worker awaits deliveries
    sequentially under a `running` flag, so one hung SES connection silently
    stopped ALL email delivery until a container restart. *Fixed:* explicit
    `NodeHttpHandler` timeouts on both clients.

14. **[G2] A transient `/auth/me` failure boots a logged-in user to the
    landing.** `SessionManager.tsx:63` treats any non-401 failure as
    signed-out; guarded pages `router.replace("/")` with no retry.

15. **[G2] Hydration mismatch for every non-English visitor.**
    `I18nContext.tsx` resolves the saved locale inside the `useState`
    initializer, so server HTML (en) and first client render disagree on all
    text → React 19 hydration failure and a full client re-render on the
    deliberately-static landing. `<html lang="en">` is also hardcoded.

16. **[G2] Stale match scores after editing preferences.** Preference
    mutations invalidate only `Preferences:ME`; the matched list, match
    scores and per-property breakdowns live under `Property` tags and are
    served from cache for up to 5 minutes after a budget change.

17. **[H] Property lifecycle is invisible in the admin panel.** No status
    badge/filter/column anywhere; the frontend `Property` type has no
    `status` at all; the admin list DTO cannot filter by it. "Where did my
    listing go" (auto `under_offer`) is undiagnosable, re-listing after a
    fallen-through deal impossible from the UI.

18. **[G1 partially / H] Hand-set property status bypasses the pipeline.**
    Operators (and admins) can PATCH `status` freely — e.g. `let → listed`
    with a live `rented` booking — sidestepping every rule
    `applyPropertyLifecycle` enforces. G1 guards deletion; validating
    hand-set status transitions against active bookings is package H.
    Related **[G1]**: property deletion now refuses when bookings at
    contract-or-later stages (or `rented`) exist — archive instead.

19. **[H] CV contact unmasking gates on "any signed-in viewer", not on
    relationship.** `tenant-cv.controller.ts:99` unmasks email/phone/address
    for any authenticated account: a leaked share link + a 30-second Google
    signup = full tenant PII. Should unmask only for admins and operators
    holding a booking from that tenant at `contacting`+.

20. **[H] Call requests have no "handled" state.** Read-only table, no
    PATCH, no status chip, phone not a `tel:` link — with no visitor email
    collected by design, the admin callback IS the funnel and two admins
    cannot see who was already called.

21. **[G1] The migration chain grew more duplicate timestamps.** Beyond the
    recorded `1767000000000` pair there is a second pair at `1787400000000`
    (landing-listing + google-id-index). New G-era migrations continue the
    monotonic `17884…` sequence; the one-off renumbering repair remains a
    recorded follow-up. *(Note: real epoch time is currently ~1788.0e9 ms —
    below the already-used 1788.3e9 — so `Date.now()` numbering only becomes
    safe again once wall-clock time passes the sequence.)*

22. **[H] Tenants with no preferences see "0% Match" on every card**
    (reachable by skipping every wizard step). Should render "Set
    preferences" instead of a percentage when no categories scored.

23. **[H] The 11-stage booking pipeline is invisible to tenants.** The whole
    booking surface is one disabled "Requested" button; no "my requests"
    view exists although `GET /booking-requests/me` returns everything
    needed, including the plain-language status explanations.

24. **[H] Booking modal over-gates the single conversion point.** The submit
    button demands name AND email AND phone AND a date while the backend
    needs email OR phone and treats dates as optional; the helpful per-field
    validation is unreachable.

---

## P2 — recorded, scheduled with their packages

- Full-entity `save()` on booking resubmit/viewing paths can overwrite a
  concurrent admin transition (same class CAS was added for) — H.
- Admin `GET /users` uncapped `limit`; `GET /buildings` unpaginated and
  re-presigns everything — fold into the recorded pagination follow-up.
- Shortlist read paths swallow all errors including DB outages
  (`shortlist.service.ts:139`) — H.
- Avatar-delete fallback can compute a garbage S3 key
  (`users.service.ts:146`) — H.
- Operators see a shortlist heart that silently does nothing — G2.
- Past `available_from` renders as a stale date; null renders as "Available
  now" (the exact case scored as *unknown*) — G2.
- Admin modals defined inside render (`ViewModal` with `useState`) — remount
  on every keystroke; will crash if hook order shifts — H, with the known
  rules-of-hooks fix.
- Zero treated as empty in admin property forms: floor 0 / studio values
  dropped on every save — H.
- `available_from` can never be cleared (`null → undefined` skips the
  update) — H.
- Russian strings in `EditPropertyModal` errors — G2/H.
- Viewing columns absent from the admin requests table; `?status=` filter
  exists but is never sent — H.
- Operator marketing landing has no URL (component state only) — not
  linkable, not crawlable — H.
- Homepage SEO thin vs. strong listing SEO (no Organization/WebSite JSON-LD,
  no OG image); sitemap silently caps at 1,000 — H.
- Smoking question can only lower scores (no property-side data; wizard
  lacks the "either is fine" options) — H.
- Collected-but-unused preference fields (`preferred_address`,
  `move_out_date`, `flexible_budget`, step-5 `tenant_types`); `house` listable
  but not selectable by tenants — H / product decision.
- Operator's new-booking email carries no CV share link and no link back
  into TaDa; operators cannot read even their own buildings
  (`GET /buildings*` admin-only) — package D.
- Upload RAM hazard in STATUS.md is overstated (nginx caps requests at
  50 MB); the real residual is upload *rate* (S3 spend) — F stays as
  recorded.

---

## What checked out clean

Guard mounting (default-deny, every `@Public` legitimately public), operator
ownership scoping on properties/media, refresh-rotation CAS, cookie flags,
mass-assignment surfaces, notification dedupe keys and DB-resolved
recipients, call-request dedupe/throttle, the matched-feed read path
(ranking cache, ceiling, PII stripping), health check, cookie-redacting
logging, graceful shutdown, wizard↔vocabulary round-trip after B3, no
tenant-facing kyc/referencing inputs (C2's DTO lock creates no silent no-op),
server-side sort/pagination of the full inventory, and the auth-refresh
coordinator on the frontend (single-flight, safe replay).
