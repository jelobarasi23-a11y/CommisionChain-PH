# CommissionChain PH

On-chain referral commission escrow for Philippine SME businesses and
freelance sales agents, built on Stellar and Soroban.

> **Status:** hackathon/testnet prototype. The smart contract is
> functionally tested (see [Testing](#testing) below) but has **not** been
> professionally audited, and must not be pointed at mainnet funds without
> one first.

## The problem

Insurance agencies, real-estate brokerages, recruitment firms, solar
installers, and marketing agencies across the Philippines run on
freelance referral agents — people paid a commission whenever a referral
they bring in closes. Today that commission is tracked in a spreadsheet
or a notebook, approved informally, and paid out whenever the business
gets around to it. The agent has no record they can point to, no
visibility into approval status, and no way to know a payout is actually
coming until it shows up.

## The solution

CommissionChain PH puts the whole referral-to-payout lifecycle on Stellar:

1. An **agent** connects their Freighter wallet and submits a referral —
   client name, business, commission amount.
2. The **business** reviews it and either **approves** it (which escrows
   the commission on-chain immediately, transferred from the business's
   own balance into the contract) or **rejects** it.
3. Once approved, the **agent claims** the commission, releasing the
   escrowed funds straight to their wallet.

Every step is a real Soroban transaction signed by whichever party is
acting — the app never holds funds or private keys for anyone.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full system
diagram and a step-by-step breakdown of each transaction,
[`docs/WALKTHROUGH.md`](docs/WALKTHROUGH.md) for a complete, copy-pasteable
setup-to-demo walkthrough, [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for
running the app locally and deploying it to Vercel, and
[`docs/PITCH.md`](docs/PITCH.md) / [`docs/HACKATHON.md`](docs/HACKATHON.md)
for the pitch materials and Stellar-fit rationale.

## Architecture at a glance

```
Agent / Business (Freighter)
        │  sign transactions
        ▼
Next.js 15 frontend  ──fetch──▶  Next.js API routes  ──build/submit──▶  Soroban RPC (testnet)
        │                              │                                       │
        │                              ▼                                      ▼
        │                        Supabase (Postgres)         Referral contract ──▶ USDC SAC
        ▼
   Dashboard / Referrals / New Referral / Commissions
```

- **`contracts/referral`** — the Soroban smart contract (Rust): the
  on-chain source of truth for a referral's state and the escrowed funds.
- **`web`** — the Next.js 15 + TypeScript app: frontend pages, the wallet
  integration, and the API routes that build/submit Soroban transactions
  and keep Supabase in sync with on-chain results.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| Wallet | Freighter (`@stellar/freighter-api`) |
| Backend | Next.js API routes, `@stellar/stellar-sdk` |
| Blockchain | Stellar Testnet, Soroban smart contracts |
| Database | PostgreSQL via Supabase (`@supabase/supabase-js`, no ORM) |
| Smart contract | Rust + `soroban-sdk` |

## Repository layout

```
commissionchain-ph/
├── contracts/referral/      Soroban contract (Rust)
│   ├── src/lib.rs           Contract logic
│   ├── src/test.rs          5 required tests
│   └── Cargo.toml
├── web/                     Next.js application
│   ├── supabase/schema.sql  Database schema (run once in Supabase's SQL editor)
│   └── src/
│       ├── app/             Pages + API routes
│       ├── components/      UI components
│       └── lib/              Wallet, Stellar RPC, Supabase, formatting
├── docs/
│   ├── ARCHITECTURE.md      Diagram + transaction flow
│   ├── WALKTHROUGH.md       Full setup-to-demo walkthrough
│   ├── DEPLOYMENT.md        Run locally + deploy to Vercel
│   ├── PITCH.md             Elevator pitch, demo script, judge Q&A
│   └── HACKATHON.md         Why this fits Stellar
└── README.md
```

## Prerequisites

- Node.js 20+ and npm
- A Rust toolchain (1.84+) with the `wasm32v1-none` target (`rustup
  target add wasm32v1-none`) and the [Soroban / Stellar
  CLI](https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup)
  for deploying the contract
- PostgreSQL via [Supabase](https://supabase.com) (a free project — no
  local Postgres install needed)
- The [Freighter](https://www.freighter.app/) browser extension, set to
  Testnet

## Setup

### 1. Install dependencies

```bash
cd web
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Create a free [Supabase](https://supabase.com) project, then run
`web/supabase/schema.sql` once in its SQL Editor (Supabase dashboard ->
SQL Editor -> New query -> paste -> Run) to create the tables this app
needs. Get your project's URL and secret key from Settings -> API Keys
and put them in `.env` as `SUPABASE_URL` / `SUPABASE_SECRET_KEY`. The
Stellar testnet values in `.env.example` already work as-is; you'll fill
in `NEXT_PUBLIC_REFERRAL_CONTRACT_ID` after deploying the contract in
step 3.

### 3. Build and deploy the smart contract

```bash
cd contracts/referral
rustup target add wasm32v1-none   # one-time; needs Rust 1.84+ (rustup update if older)
cargo test                         # run the 5 required tests
stellar contract build             # builds + optimizes target/wasm32v1-none/release/referral_contract.wasm

stellar contract deploy \
  --wasm target/wasm32v1-none/release/referral_contract.wasm \
  --source-account <your-funded-testnet-identity> \
  --network testnet
```

Note the contract id printed by `deploy` and put it in
`NEXT_PUBLIC_REFERRAL_CONTRACT_ID` in `web/.env`.

Then initialize it once, pointing it at the token it should escrow
commissions in (testnet USDC, or your own test asset's Stellar Asset
Contract wrapper):

```bash
stellar contract invoke \
  --id <your-contract-id> \
  --source-account <your-admin-identity> \
  --network testnet \
  -- initialize --admin <your-admin-public-key> --token <usdc-sac-contract-id>
```

Put that same token contract id in `NEXT_PUBLIC_COMMISSION_TOKEN_ID`.

**For the full version of this — including how to get a test USDC token
onto testnet and set up Freighter for a live demo — see
[`docs/WALKTHROUGH.md`](docs/WALKTHROUGH.md).**

### 4. (Optional) Generate official shadcn/ui components

The project ships with small, hand-written UI primitives in
`src/components/ui/` so it runs immediately with zero extra setup. A
`components.json` is already in place if you'd rather swap in the
official shadcn components:

```bash
npx shadcn@latest add button card badge input label
```

### 5. Run it

```bash
npm run dev
```

Open two browser profiles (or two browsers) with Freighter installed —
one funded testnet account acting as the agent, another as the business
— and walk through the flow in [`docs/PITCH.md`](docs/PITCH.md)'s demo
script. Use [Friendbot](https://friendbot.stellar.org/) to fund each
testnet account, and make sure the business account holds enough of the
commission token to cover the referrals you'll approve.

## Testing

The contract ships with the 5 required tests, run with:

```bash
cd contracts/referral
cargo test
```

They cover: the full happy path (create → approve → claim, including
checking the agent's and business's token balances actually move by the
right amount), an unauthorized-approval attempt from a stranger address,
a duplicate claim attempt, on-chain storage matching exactly what was
submitted, and approval status flipping correctly (including a rejected
double-approve attempt).

> **A note on how this was verified:** this contract was actually
> compiled and tested against a real `soroban-sdk` toolchain rather than
> only written from memory — all 5 tests pass. The
> `wasm32v1-none` build step and the Next.js app's live
> interaction with Soroban RPC/Horizon and a real Supabase project were
> not end-to-end tested in the environment this was built in (no network
> path to Stellar's testnet infrastructure or to Supabase's API from
> there), so budget time for that pass when you first wire up a real
> deployment. The web app's TypeScript did type-check cleanly against the
> real, fully-installed `@supabase/supabase-js` package, though — that
> part isn't a stand-in.

## Deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the full guide — using
one Supabase project for both local and Vercel, and a troubleshooting
section for the most common issues. Short version: run
`web/supabase/schema.sql` once in Supabase's SQL Editor, deploy `web/` to
Vercel with **Root Directory** set to `web`, and copy `SUPABASE_URL` /
`SUPABASE_SECRET_KEY` and the other variables from `.env` into the
project's environment variables — no build command changes needed, since
there's no ORM client to regenerate or migration step to run.

## Hackathon demo flow

See [`docs/PITCH.md`](docs/PITCH.md) for the full 30-second pitch, 2-minute
demo script, and anticipated judge questions with answers.

## License

MIT. This is a hackathon prototype — see the status note at the top of
this file and the security note in `contracts/referral/src/lib.rs` before
considering any production use.
