# PerUse AI

A marketplace where creators publish AI-powered tools and users pay per use, deployed on Locus .

## Overview

PerUse AI lets anyone build and monetize AI tools — from GPT-powered writing assistants to web research workflows — without managing infrastructure or billing. Users browse the marketplace, pay per run, and creators earn automatically via Locus payments.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.3 (App Router, TypeScript) |
| Styling | Tailwind CSS |
| Auth | Privy (`@privy-io/react-auth` + `@privy-io/server-auth`) |
| Database | PostgreSQL via Prisma 7 + `@prisma/adapter-pg` |
| Payments | Locus Pay (`paywithlocus.com`) |
| Deployment | Build with Locus (`buildwithlocus.com`) |

## Features

- **Browse & Search** — discover AI tools by category, sort by newest or popularity
- **Creator Dashboard** — publish tools, track runs and earnings
- **Multi-provider AI** — OpenAI, Anthropic, Google, Mistral, Groq
- **Per-use billing** — users pay per run; creators earn minus platform fee
- **Admin panel** — review and approve tools before they go live
- **Wallet auth** — Privy handles email, social, and embedded wallet login

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL (local or remote)
- A [Privy](https://dashboard.privy.io) app
- A [Locus](https://paywithlocus.com) API key

### Local setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Fill in DATABASE_URL, Privy keys, Locus key

# 3. Run migrations and seed
npx prisma migrate dev
npm run seed

# 4. Start dev server
npm run dev
```

App runs at `http://localhost:3000`.

### Environment variables

See [.env.example](.env.example) for all required variables. Key ones:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy app ID (public) |
| `PRIVY_APP_SECRET` | Privy app secret (server-only) |
| `LOCUS_API_KEY` | Locus `claw_` API key |
| `LOCUS_WEBHOOK_SECRET` | Locus webhook signature secret |
| `PAYMENT_MOCK_MODE` | Set `true` to skip real payments in dev |

## Deployment

The project deploys to [Build with Locus](https://docs.paywithlocus.com/build). A `.locusbuild` file at the repo root defines the service and a managed Postgres addon.

```bash
# Exchange your Locus API key for a deploy token
TOKEN=$(curl -s -X POST https://api.buildwithlocus.com/v1/auth/exchange \
  -H "Content-Type: application/json" \
  -d '{"apiKey":"YOUR_CLAW_KEY"}' | jq -r '.token')

# Deploy from GitHub (one call creates project + postgres + triggers build)
curl -s -X POST https://api.buildwithlocus.com/v1/projects/from-repo \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "peruseai", "repo": "your-org/peruseai", "branch": "main"}'
```

After the first deploy, set your production secrets via the Locus dashboard or `PATCH /v1/variables/service/$SERVICE_ID`.

## Project Structure

```
src/
├── app/
│   ├── (admin)/          # Admin panel — review tools, view runs
│   ├── (creator)/        # Creator dashboard — publish & manage tools
│   ├── (public)/         # Browse page, tool detail, tool runner
│   ├── api/              # API routes (tools, runs, payments, auth)
│   └── globals.css
├── components/
│   ├── landing/          # Homepage (LandingPage.tsx)
│   ├── layout/           # Navbar, Providers
│   └── ui/               # Shared UI components (Select, etc.)
└── lib/
    ├── auth/             # Privy session helpers
    ├── db/               # Prisma client
    ├── execution/        # AI tool execution engine
    ├── payments/         # Locus payment integration
    └── validators/       # Zod schemas
prisma/
├── schema.prisma
└── migrations/
```

## Revenue Model

| Party | Share |
|---|---|
| Creator | Sale price − provider cost − platform fee |
| Platform | 20% of sale price (min $0.10) |
| Provider | Actual API cost |

## License

Private — all rights reserved.

