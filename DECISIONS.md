# DECISIONS.md

- Movement sign convention: quantities are signed in `stock_movements` (receipts positive, issues negative, adjustments either sign). Validation enforces receipt>0, issue<0. This matches the schema's "negative for issues" rule and keeps the audit trail unambiguous.
- AI tool whitelist: only 5 read-only tools; any model-requested unknown tool is refused and re-asked once, then fails gracefully.
- AI rate limiting: in-memory per-user bucket (20/5min) plus express-rate-limit per IP. Documented; not distributed (single instance assumed).
- Seed profile: inserts a profile row with a fixed UUID without a corresponding auth.users row because creating auth users from a script is not straightforward. For real auth flows, Supabase Auth creates the user and the DB trigger creates the profile. Documented in README.
- Soft delete: medicines with movements are deactivated (is_active=false) instead of hard-deleted; others are hard-deleted.
- RLS: enabled on all tables with read policies for authenticated; writes only via service role (backend). Authorization primarily at API layer.
- Env validation: zod on env; falls back gracefully in test mode to allow DATABASE_URL_TEST.
- No ORM: raw pg with parameterized queries only.
- Conversation state: conversation_id is echoed/generated but not persisted (no conversations table) to keep scope minimal.
- Expired batches: excluded from usable stock and low-stock calculations; expired with remaining stock flagged in alerts.
- Low-stock filter uses HAVING on computed usable stock.

## Temporarily removed lint devDependencies — reinstall when network allows

The following devDependencies were temporarily removed from package.json because
`npm install` hangs fetching `@typescript-eslint/parser` metadata from the npm
registry (large-payload network stall). They are lint-only tooling and are NOT
required for build (`tsc`), test (`vitest`), or runtime. `.eslintrc.json` and
`.prettierrc` are left in place but unused until these are reinstalled.

Removed:
- eslint ^8.57.0
- prettier ^3.3.3
- eslint-config-prettier ^9.1.0
- @typescript-eslint/eslint-plugin ^7.18.0
- @typescript-eslint/parser ^7.18.0

Kept (required for build/test):
- typescript ^5.5.4
- vitest ^2.0.5
- supertest ^7.0.0
- tsx ^4.19.0
- @types/* (all)

To restore: re-add the removed entries to package.json devDependencies and run
`npm install` once the network/registry issue is resolved.
