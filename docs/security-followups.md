\# Security Follow-ups



Snapshot taken after the criticals + H1–H4 security pass. Each item is a

known gap left out of that pass for explicit reasons. Re-evaluate before

exposing the app to external traffic or adopting it for paid use.



\## From the C1–C4 + H1–H4 pass



\### C1.1 — cross-workspace task move target validation

`task.service.move(taskId, columnId, order)` only validates the caller's

membership in the source task's workspace (via `TaskWorkspaceGuard`). The

target `columnId` in the request body is not validated to belong to the

same workspace, so a member of workspace A can move a task they own into

a column in workspace B. Fix: in `task.service.move`, load the target

column's workspaceId and assert it matches the source task's workspaceId

before the update. \*\*When fixing, write at least one e2e test that

demonstrates the cross-workspace move attack and confirms the fix blocks

it.\*\* Highest-risk endpoint to leave without regression coverage.



\### C3-followup — seed cannot reach prod DB (snapshot verification)

Verified at the time of the C3 fix that:

\- Root `package.json`: only `db:migrate` / `db:generate` / `db:studio`.

\- `apps/api/package.json`: `db:seed` is local-only, no callers.

\- `.github/workflows/ci.yml`: runs `prisma migrate deploy`, never seed; e2e

&#x20; job uses `NODE\_ENV=test`.

\- `apps/api/Dockerfile` CMD: `npx prisma migrate deploy \&\& node dist/main.js`,

&#x20; no seed call.

\- `apps/api/railway.toml`: builds via Dockerfile, no separate hooks.



If any of those change (CI step added, Dockerfile entrypoint changed,

Railway pre-deploy hook introduced, hosted seed script added), the C3

gate alone is insufficient. The demo user's seeded credential becomes

attackable through the regular `/auth/login` route.



\### C4-followup-a — email verification on registration

C4's defense (only the invited email can accept an invite) assumes that

email at registration is verified. Without verification, an attacker who

knows the invited email can register that email and pass C4. C4 is still

correct as a layer; it is not sufficient alone. Add an email verification

flow on registration.



\### C4-followup-b — pre-fill + lock invite email on registration

When arriving at the registration form via an invite token, pre-fill the

email field from the invitation and disable editing. UX improvement that

also closes a footgun where users register with a different email and

then can't accept the invite.



\### H1-followup — audit log for workspace membership changes

Add (member added / removed / role-changed) to an audit log table.

Defense against admin abuse and useful for compliance/debugging.



\### H2-followup — in-app notification renderer audit

`notificationCenter.create()` calls embed `taskTitle`, `commenterName`,

`memberName`, `workspaceName` into the `notification.message` plain-text

field stored in the DB. Same input vector as H2. Audit the frontend

rendering of `notification.message`, `attachment.filename`, and similar

fields stored as plain text. React's default text rendering auto-escapes,

so the default case is safe; the risk is any `dangerouslySetInnerHTML`

or HTML-as-text rendering. If unsafe rendering exists, escape at write

time or render time.



\### H3-followup-a — antivirus / malware scanning on uploads

The H3 whitelisted MIME types (PDF, DOCX, XLSX, ZIP) can all carry macros

or payloads. A production-grade deployment needs ClamAV, VirusTotal API,

or similar AV integration on the upload pipeline. Out of scope for the

security-pass round.



\### H3-followup-b — frontend renders attachment.filename as text

Confirm the frontend renders `attachment.filename` (the user-controlled

display name preserved as DB metadata) via React text nodes only, not

`dangerouslySetInnerHTML`. Same input vector as the disk-filename fix

in H3.



\### H3-followup-c — magic-number sniffing on uploads

H3 validates header MIME + extension. Stronger defense uses content-based

sniffing (`file-type` package + Nest's `FileTypeValidator`). Currently

deferred because `file-type` would have to be added as a direct

dependency of `apps/api`.



\### H4-question — gate `GET /workspaces/:id/subscription` to OWNER-only?

The endpoint returns `stripeCustomerId` and `stripeSubscriptionId` to any

workspace member. These aren't credentials, but they're billing

identifiers. SaaS convention varies. Decision pending.



\## Carried over from the original audit (still open)



\- \*\*H5\*\* — dependency advisories (6 high + 9 moderate, including

&#x20; `@nestjs/core ≤11.1.17` GHSA-36xv-jgw5-4q75). Run `pnpm up -L`.

\- \*\*M1\*\* — login/forgot-password rate limits permit credential stuffing.

\- \*\*M2\*\* — password-reset tokens logged to stdout in dev; not invalidated

&#x20; when a new request is made.

\- \*\*M3\*\* — controllers accept untyped `@Body()` interfaces; global

&#x20; ValidationPipe `forbidNonWhitelisted` is a no-op for non-DTOs.

\- \*\*M4\*\* — SSE stream keeps delivering events to a removed member until

&#x20; the connection drops.

\- \*\*M5\*\* — CORS pinned to single FRONTEND\_URL; preview deploys can't

&#x20; authenticate.

\- \*\*Low\*\* — `invitation.service.ts:48` `userId: email` bug (existing-member

&#x20; check never matches).

\- \*\*Low\*\* — `bcryptjs` vs native `bcrypt` (availability under load).

\- \*\*Low\*\* — `console.log` of password reset and invite links not gated

&#x20; by NODE\_ENV.

\- \*\*Low\*\* — no CSP / HSTS / X-Frame-Options headers.

\- \*\*Low\*\* — no e2e/integration test coverage for any API endpoint;

- **Low** — E2E Playwright tests have been failing on main since at least
  April 4 2026 (CI run #21+). Web server fails to start in CI workflow;
  Playwright cannot reach localhost:3000. Pre-existing issue, not caused
  by the security pass. Likely candidates: missing env var, port conflict,
  or production build runtime error. Investigate as a separate CI fix.

&#x20; guards work in dev but unverified in CI.



\## What's clean (audit-confirmed, no action needed)



No SQL injection (Prisma only). No `child\_process` / `exec`. No SSRF in

URL-fetching code. No `dangerouslySetInnerHTML` on user content. No NoSQL.

No JWT secret default fallback. Stripe webhook signature verification is

correct. Notification-center subscribe authorization is properly

workspace-scoped. NextAuth uses httpOnly SameSite=Lax cookies.

WorkspaceGuard logic is correct when fed the right param.

