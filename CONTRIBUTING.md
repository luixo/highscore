# Prisma + tRPC

## Local setup

### Prerequisite

- Node.js (run `nvm use`)
- Docker

```bash
pnpm install
```

### Running

Run local DB:

```bash
pnpm db-dev
```

Run local server:

```bash
pnpm dx
# Or without studio
pnpm dx:next
# Or with production DATABASE_URL (in `.env.production.local` file)
dotenv -c production.local -- pnpm dx
```

### Reset local DB

```bash
pnpm db-reset
```

## Creating a migration

Change the `schema.prisma` file to accomodate changes.
Run local deployment first:

```bash
pnpm migrate-dev && pnpm generate
```

Given everything works fine, run production deployment:

```bash
dotenv -c production.local -- pnpm migrate
```

## Deployment

### Build an app

```bash
pnpm build
```
