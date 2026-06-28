# T:MDM API

NestJS backend API for the T:MDM monorepo.

## Stack

- NestJS 11
- TypeScript
- TypeORM
- Oracle Database 19c
- `oracledb` Node.js driver
- `@nestjs/config` for environment configuration
- `class-validator` / `class-transformer` for validation
- Swagger/OpenAPI via `@nestjs/swagger`
- Health checks via `@nestjs/terminus`

## Location

```text
apps/api
```

The workspace package name is:

```json
"@hkrndmdm/api"
```

## Environment

Create a local environment file from the example:

```bash
cp apps/api/.env.example apps/api/.env
```

`apps/api/.env` is ignored by Git and must contain real local credentials. Do not commit real DB passwords or tokens.

Oracle 19c configuration uses the `DB_*` prefix:

```env
NODE_ENV=development
API_PORT=4000

DB_HOST=localhost
DB_PORT=1521
DB_SERVICE_NAME=xepdb1
DB_USERNAME=app_user
DB_PASSWORD=change_me

DB_POOL_SIZE=10
DB_LOGGING=false

# Auth (JWT) — see "Auth & Access Control" below
# JWT_SECRET must be at least 32 characters (validated at boot).
JWT_SECRET=change_me_to_a_long_random_secret
JWT_EXPIRES_IN=8h
AUTH_PROVIDER=local
# ADMIN_PASSWORD is only read by scripts/seed-auth.cjs when creating the initial admin.
# ADMIN_PASSWORD=change_me_strong_password
```

Supported Oracle connection styles:

- `DB_HOST` + `DB_PORT` + `DB_SERVICE_NAME`
- `DB_HOST` + `DB_PORT` + `DB_SID`
- `DB_CONNECT_STRING`

The current default configuration uses node-oracledb Thin mode, so an Oracle Client installation is not required for the normal Oracle 19c connection path.

Runtime (`config/database.config.ts`) and the migration CLI (`database/data-source.ts`) share a single connection builder in `config/oracle-options.ts` (`resolveOracleConnection` / `baseOracleOptions`), so both resolve `DB_SERVICE_NAME` vs `DB_SID` identically. Keep new connection logic in that builder rather than duplicating it.

## Database Safety

TypeORM is configured with:

```ts
synchronize: false
```

Do not enable automatic schema synchronization for shared or production Oracle databases. Use migrations for schema changes.

## Auth & Access Control (RBAC)

Authentication is JWT-based. Access is controlled per **menu × action** via roles.

**Env variables**

| Variable | Purpose |
| --- | --- |
| `JWT_SECRET` | JWT signing secret — **min 32 characters, validated at boot**; use a long random value in production |
| `JWT_EXPIRES_IN` | Token lifetime (default `8h`) |
| `AUTH_PROVIDER` | Auth source: `local` (TMDM_USER + bcrypt). Abstracted for future `sso`. |
| `ADMIN_PASSWORD` | Initial admin password — **only** used by the seed script when first creating `admin`. |

**Tables** (prefix `TMDM_`): `TMDM_ROLE`, `TMDM_USER`, `TMDM_MENU`, `TMDM_ROLE_MENU_PERM`.

**Permission model**: each role gets `view / create / update / delete` flags per menu
(module or tab). A menu with no `view` is hidden from that role; mutating endpoints are
guarded by `@RequirePermission(menuId, action)`. Default roles: `ADMIN` (full), `EDITOR`
(data CRUD, no admin), `VIEWER` (read-only).

**Initial setup** — create tables + seed roles/menus/permissions + the first admin
(idempotent; re-running is safe). `ADMIN_PASSWORD` may be passed on the command line
(takes precedence) or set in `.env`:

```bash
cd apps/api
ADMIN_PASSWORD='strong_password' node scripts/seed-auth.cjs
```

After first login, change the admin password via the in-app **Access Control → Users**
screen. Do not commit real passwords; the seed script has no default password.

## Commands

From the repository root:

```bash
pnpm api:dev    # start API in watch mode
pnpm api:build  # build API
pnpm api:lint   # lint API
pnpm api:test   # run API unit tests
```

Direct workspace commands:

```bash
pnpm --filter @hkrndmdm/api run start
pnpm --filter @hkrndmdm/api run start:dev
pnpm --filter @hkrndmdm/api run build
pnpm --filter @hkrndmdm/api run test       # unit (*.spec.ts)
pnpm --filter @hkrndmdm/api run test:e2e   # e2e (test/*.e2e-spec.ts), DB-free
```

## Testing strategy

Hybrid: **mock-first, with an opt-in test DB for core Oracle queries.**

**1. Unit (`*.spec.ts`, `pnpm api:test`)** — services with `DataSource`/repos mocked.
Pure logic and SQL-string construction are covered here (no DB).

**2. e2e (`test/*.e2e-spec.ts`, `pnpm api:test:e2e`) — DB-free by default.** Boot only
the controllers/providers under test (not the full `AppModule`, which would require an
Oracle connection) and mock the data layer. The HTTP glue is exercised with the **real**
global guards/pipes:
- `auth.e2e-spec.ts` — JWT auth gate (401), permission gate (403/allow via mocked
  `PermissionsService`), DTO validation (400), and the `@Public` signin contract
  (`ok:false` instead of a global 401). Uses a real `JwtStrategy` with a test secret.

**3. Core-query tests against a test DB — opt-in (planned).** Some queries can't be
validated by mocks because they rely on **Oracle-only SQL** that no in-memory engine
(sqlite/H2) supports — e.g. `KEEP (DENSE_RANK FIRST ORDER BY …)`, `REGEXP_LIKE`,
EZConnect/`ROWNUM`. The highest-value targets:
- `test-match` `ATTR_SQL` (mcode → tire attributes; LEFT JOINs + `KEEP DENSE_RANK` for
  `SIZE_SMPL`) and the market-resolution path.
- `template` filter/sort SQL and the upload diff `SELECT … FOR UPDATE` path.

Approach when introduced: spin up **Oracle XE via Testcontainers (or a Docker Compose
service)**, run the migrations, seed minimal fixtures, and gate these specs behind an env
flag (e.g. `TEST_DB=1`) so the default `pnpm test` stays DB-free and fast. CI runs them in
a dedicated job that provisions the container.

## Runtime Endpoints

Default port:

```text
4000
```

Endpoints:

```text
GET  /                # default Nest sample endpoint (public)
GET  /health          # Terminus health check, includes database ping (public)
GET  /docs            # Swagger UI
POST /auth/signin     # login → JWT + profile + permitted menus (public)
GET  /auth/me         # current profile + permitted menus (JWT)
*    /admin/*         # roles / menus / permissions / users (admin permission)
```

All other endpoints require a valid JWT (global guard); routes marked `(public)` are exempt via `@Public()`.

## Verification Status

The backend was configured and verified against an Oracle 19c-compatible service using local environment variables.

Confirmed:

- API build succeeds.
- Nest application starts.
- TypeORM initializes and runs Oracle metadata queries.
- `GET /health` returns:

```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    }
  }
}
```

- `GET /docs` returns Swagger UI with HTTP 200.

The local API process used during verification was stopped afterward.

## Notes

If Nest CLI dependency resolution fails with an error similar to `chalk.blue is not a function`, ensure the repository `.npmrc` keeps:

```text
node-linker=isolated
```
