# Tunborzy Academy — Engineering Report

Scope of this pass: security remediation + production cleanup, working from your
uploaded codebase as the single source of truth. Architecture, routing, UI, and
existing working features were preserved and extended, not rewritten.

**Verification limitation, read this first:** this environment has no network
access and no `node_modules`, so I could not run `npm install`, `tsc --noEmit`,
or `vite build`. Every change below was written and reviewed by hand (imports
traced, brace/paren balance checked, call sites cross-referenced), but you
should run `npm install && npm run lint && npm run build` yourself before
deploying, as the final verification step.

---

## 1. Critical security fix — Admin/Lecturer account provisioning

**What was wrong:** `SignUp.tsx` hardcoded the Admin access code
(`Dadaemmanuelenioluwafe127@`) directly in client-side source, shipped to
every visitor's browser. Anyone could read it in devtools and self-register
an Admin account. Lecturer self-signup was worse — it collected an access
code but never validated it against anything at all. Separately, the
client-side `profiles.upsert({ role: ... })` calls meant that even without
the code check, someone could open devtools and write `role: 'Admin'`
directly, since nothing on the server enforced it.

**What was fixed:**
- Added `supabase/functions/admin-provision-user/index.ts`, a Supabase Edge
  Function that runs with the service-role key. It handles three actions:
  - `admin-signup` — public Admin signup, gated by a secret
    (`ADMIN_ACCESS_CODE`) that lives only in the function's environment.
  - `lecturer-signup` — public Lecturer signup, gated by `LECTURER_ACCESS_CODE`
    (previously unvalidated entirely).
  - `add-lecturer` — used by the Admin dashboard's "Add Lecturer" flow.
    Verifies the caller already holds a valid Admin session before creating
    anything.
  - `delete-own-account` — lets a user delete their own account (needed
    because deleting an `auth.users` row requires the service role; see
    Settings fix below).
- `SignUp.tsx` no longer contains any hardcoded secret and no longer performs
  privileged role assignment client-side.
- Added `supabase/migrations/0001_secure_profile_role_escalation.sql`, a
  defense-in-depth DB trigger: any write to `profiles` from a normal client
  session that tries to set `role = 'Admin'` or `'Lecturer'` is rejected at
  the database level, regardless of which UI path it comes from.

**Bug fixed along the way:** `LecturerManagement.tsx`'s "Add Lecturer" form
called client-side `supabase.auth.signUp()`, which replaces the *current*
session — meaning creating a lecturer silently logged the admin out and
signed them in as the new lecturer. This is now routed through the Edge
Function and no longer touches the admin's session at all.

**Manual steps required (you must do these):**
1. Deploy the function: `supabase functions deploy admin-provision-user`
2. Set its secrets:
   ```
   supabase secrets set ADMIN_ACCESS_CODE=<pick a new value>
   supabase secrets set LECTURER_ACCESS_CODE=<pick a new value>
   ```
   **Rotate these — do not reuse `Dadaemmanuelenioluwafe127@`.** It was
   exposed in your source and must be treated as compromised.
3. Apply the migration: `supabase db push` (or run the SQL file directly
   against your project).
4. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-provided to Edge
   Functions by Supabase — no action needed there.

---

## 2. Cleanup

- Removed ~38 dead debug/patch scripts from the repo root (`fix_*.cjs`,
  `check_*.cjs`, `parse_*.cjs`, `test-*.js/.mjs`, `patch_useProfile.js`,
  `update_premium.js`, `update_tunborzy.sh`, `update_app.patch`, etc.) —
  confirmed none were referenced by `package.json`, build config, or `src/`.
- Removed stray scratch files: `signup_handle.txt` (contained the exposed
  admin code — see §1), `fix-summary.txt`, `test-plan.md`.
- Removed the orphaned duplicate `src/ErrorBoundary.tsx` (unstyled; only
  `src/components/ErrorBoundary.tsx` was ever imported).
- Removed `bun.lock` — the project's scripts and tooling are npm/tsx/vite
  based; having two lockfiles (`bun.lock` + `package-lock.json`) invites
  dependency drift. Kept `package-lock.json`.
- Removed all debug `console.log`/`console.debug` calls from `SignUp.tsx`,
  `Login.tsx`, `CourseChatSystem.tsx`, `VoiceRecorder.tsx`,
  `CBTExamTaker.tsx`, and `supabaseClient.js` — the last of which was
  logging your Supabase URL and publishable key to the browser console on
  every page load. Legitimate `console.error`/`console.warn` calls in real
  catch blocks (upload fallbacks, error boundaries) were left in place —
  that's standard production error logging, not debug noise. The one
  remaining `console.log` in the whole project is the server startup message
  in `server.ts` (`Server running on http://...`), which is normal Express
  practice, not a debug leftover.

---

## 3. Incomplete features finished / broken workflows fixed

- **Admin Analytics** (`admin/Analytics.tsx`): the growth chart and the
  "Most Active Chats / Most Viewed Notes / Most Attempted CBT" panels were
  a static "Placeholder" div and `Math.random()` fake numbers respectively.
  Replaced with a real recharts area chart and real aggregation queries
  against `profiles`, `chat_messages`/`chat_rooms`, `material_downloads`/
  `materials`, and `cbt_attempts`/`cbt_exams`.
- **Student Activation** (`admin/StudentActivation.tsx`): the "search" was
  entirely fake — any input over 2 characters returned the same hardcoded
  student, and the Activate/Extend/Deactivate buttons' confirmation dialog
  didn't actually do anything (`onConfirm` just closed the modal). Rewired
  to a real debounced search against `profiles` and real
  `premium_status` updates, with the confirm action wired to actually run.
- **Settings → Delete Account**: the confirmation input wasn't connected to
  any state, and the Delete button was permanently disabled
  (`cursor-not-allowed`, no real handler). Now requires typing "DELETE",
  calls the new `delete-own-account` Edge Function, and signs the user out
  on success.
- **Premium Activation Code Management**: the Copy/Print/View buttons on a
  generated code had no `onClick` handlers at all. Copy now writes to the
  clipboard; Print opens a print dialog; the non-functional View button was
  removed rather than left as dead UI.
- **System Settings → "Create Manual Backup Now"**: had `onClick={() => {}}`
  — did nothing. Wired to the page's existing confirmation-modal pattern
  with an honest message (manual backups aren't connected to a backend job
  yet; automatic daily backups remain active). I deliberately did not fake a
  "Backup created!" success message — that would misrepresent what actually
  happened.
- **TunborzyAI lecturer suggestions**: `TunborzyAI.tsx` already supported a
  `role` prop to show lecturer-specific AI suggestions instead of student
  ones, but `App.tsx` never passed it, so lecturers always saw the student
  suggestion set. Fixed the prop wiring in `App.tsx`.

---

## 4. Remaining known issues (not fixed — need a product/schema decision)

I did not fabricate functionality for these. Faking them would look
"complete" in a demo but would ship broken/misleading behavior:

- **`PremiumManagement.tsx` and most of `PremiumActivationCodeManagement.tsx`**
  are UI-only mockups with zero Supabase wiring — no `premium_codes` or
  `transactions` table exists anywhere in your schema files. This is an
  entire missing subsystem (code generation, redemption, expiry, payment
  provider integration), not a small placeholder. Needs a schema design
  decision before it can be built for real.
- **Revenue analytics** (`admin/Analytics.tsx`): honestly labeled as
  unavailable rather than shown with invented numbers, because there is no
  payments/transactions table in your database to compute it from.
- **`admin/SystemSettings.tsx`, `admin/AIManagement.tsx`,
  `admin/WebsiteManagement.tsx`, `admin/AcademicManagement.tsx`**: these
  pages render configuration UI (SMTP settings, website name/logo, AI model
  config, academic calendar, etc.) with no corresponding database table and
  no Supabase calls anywhere in the files. They're back-end-less by design
  currently. I fixed the one clearly no-op button I found
  (`SystemSettings`'s backup button) but did not invent a settings-storage
  schema for the rest, since that's a real architecture decision.
- **`metadata.json` and `firebase-applet-config.json`**: not referenced
  anywhere in the build (`vite.config.ts`, `package.json`), and the
  `firebase` npm dependency is unused in `src/`. I left them in place rather
  than guessing — if these aren't required by whatever platform originally
  generated this app, they (and the `firebase` dependency) are safe to
  remove.
- **Language settings (French/Spanish "Coming Soon")**: left as-is — this is
  an honestly-labeled, correctly-disabled future feature, not a bug.
- No automated test suite exists in the project, so none of the above was
  verified by tests — only by manual code review, given this environment's
  lack of network/build access.

---

## 5. Files changed

```
supabase/functions/admin-provision-user/index.ts        (new)
supabase/migrations/0001_secure_profile_role_escalation.sql (new)
src/components/SignUp.tsx
src/components/Login.tsx
src/components/CourseChatSystem.tsx
src/components/chat/VoiceRecorder.tsx
src/components/cbt/CBTExamTaker.tsx
src/components/SettingsPage.tsx
src/components/admin/LecturerManagement.tsx
src/components/admin/Analytics.tsx
src/components/admin/StudentActivation.tsx
src/components/admin/SystemSettings.tsx
src/components/admin/PremiumActivationCodeManagement.tsx
src/supabaseClient.js
src/App.tsx
(+ ~40 dead files removed from repo root; see §2)
```
