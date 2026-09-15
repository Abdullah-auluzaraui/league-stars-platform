# League Stars

An Arabic football tournament platform with a public match centre and an authenticated administration CMS. A full-stack portfolio project using Next.js, React, TypeScript, Prisma, and PostgreSQL.

## Features

- Group stages, knockout rounds, fixtures, results, qualification, and tournament archiving.
- Teams, players, goals, cards, and scorer statistics.
- Public matches and standings; goal voting with configurable rounds and result visibility.
- Admin CMS for content, sponsors, settings, and image uploads.
- Signed JWT sessions in HTTP-only cookies, bcrypt password hashing, and server-side admin checks.
- Optional isolated demo with one-click access to a dedicated demo account and data reset.

## Architecture

```text
src/app/                  App Router pages, Server Actions, voting API
src/app/admin/            CMS and tournament operations
src/core/lib/             Authentication, Prisma, validation, demo controls
prisma/schema.prisma      PostgreSQL data model
prisma/migrations/        Versioned migrations
prisma/seed.ts            Destructive demo dataset generator
prisma/admin.ts           Explicit admin provisioning/password rotation
```

Pages and mutations access PostgreSQL through server-side Prisma. The database may be hosted on Supabase; authentication uses application JWTs rather than Supabase Auth. Upload handlers currently store files locally, so hosted deployments need persistent storage or a remote upload implementation.

## Local setup

Use Node.js 22.18+ or 24 and PostgreSQL.

```bash
npm ci
cp .env.example .env
# Fill DATABASE_URL and DIRECT_URL, then generate JWT_SECRET:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npx prisma generate
npx prisma migrate deploy
npm run dev
```

For standard mode, keep `DEMO_MODE`, `DEMO_DATABASE`, and `NEXT_PUBLIC_DEMO_MODE` set to `false`. Set private `ADMIN_USERNAME` and `ADMIN_PASSWORD` values (at least 16 characters), then run `npm run admin:bootstrap`. This provisions or rotates only that selected account and deletes no content. Remove the provisioning password from the environment afterwards.

## Demo and data

Seeded teams, players, tournaments, scores, votes, and sponsors are synthetic examples. Similarity to real names is coincidental; no real sponsorship or affiliation is claimed. Remote sample images, avatars, and videos are illustrative third-party assets with their own rights.

Use a **separate database or Supabase project containing only demo data**. Set all three flags to `true`: `DEMO_MODE`, `DEMO_DATABASE`, and `NEXT_PUBLIC_DEMO_MODE`. `DEMO_DATABASE=true` explicitly confirms database isolation; the application cannot verify that claim.

```bash
npm run seed
npm run build
npm start
```

The seed deletes tournament/content records and requires both server flags. One-click login selects only `demo-admin`, with demonstration password `demo123456`. Reset recreates the same demo account and is blocked outside demo mode. Public flags control presentation only; private server flags control authorization.

Rotate previously published passwords if ever used outside a demo. Rotate JWT secrets to invalidate old sessions. Never commit `.env`, participant identity documents, production exports, or real photos without appropriate permission. An accidentally committed private document must also be removed from Git history before making the repository public; deletion from the current tree is insufficient.

## Supabase security

Prisma migrations alone do not protect Supabase's separate Data API. If enabled, verify grants and RLS on every exposed table, especially `User`. This server-only application does not need anonymous database API access. JWT cookies do not secure direct Data API calls.

## Showcase and verification

Run the isolated demo locally to explore the public match centre and admin CMS. The demo configuration and seed commands above create synthetic content for screenshots and portfolio presentations.

```bash
npm run test:security
npx tsc --noEmit
npm run build
```

## Rights

Copyright © 2026 Abdullah (Abdullah-auluzaraui). No additional open-source license is granted. Public visibility permits viewing and forking under GitHub's terms; it does not itself grant general commercial reuse or redistribution rights. Dependencies and third-party assets retain their licenses.
