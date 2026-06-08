# HKRndMDM API

NestJS backend API for the HKRndMDM monorepo.

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
```

Supported Oracle connection styles:

- `DB_HOST` + `DB_PORT` + `DB_SERVICE_NAME`
- `DB_HOST` + `DB_PORT` + `DB_SID`
- `DB_CONNECT_STRING`

The current default configuration uses node-oracledb Thin mode, so an Oracle Client installation is not required for the normal Oracle 19c connection path.

## Database Safety

TypeORM is configured with:

```ts
synchronize: false
```

Do not enable automatic schema synchronization for shared or production Oracle databases. Use migrations for schema changes.

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
pnpm --filter @hkrndmdm/api run test
```

## Runtime Endpoints

Default port:

```text
4000
```

Endpoints:

```text
GET /         # default Nest sample endpoint
GET /health  # Terminus health check, includes database ping
GET /docs    # Swagger UI
```

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
