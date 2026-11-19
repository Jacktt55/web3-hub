# Web3 Hub

A unified Web3 web application — **Crypto & DeFi**, **NFT Utility & Showcase**,
and **Web3 Security Tools** — in one clean interface, without UI clutter.

Built with **React 19 + TypeScript (strict) + Vite + Tailwind CSS v4 +
Lucide React**.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc + vite build → dist/
npm run preview  # serve the production build locally
```

## Architecture

```
src/
├── main.tsx                 # entry — StrictMode + App
├── App.tsx                  # view-state router + layout shell + toasts
├── index.css                # Tailwind v4 theme (Inter / JetBrains Mono,
│                            # NexaVault dark palette #0B0E14 / #151A23)
├── types/index.ts           # shared strict models: chains, holdings, gas,
│                            # yield pools, NFTs, mint passes, audits,
│                            # approvals, activity, View
├── lib/
│   ├── format.ts            # USD / compact / pct / address / time helpers
│   └── router.ts            # the 5 views: Overview, Crypto & DeFi,
│                            # NFT Hub, Security Scanner, Activity
├── data/                    # typed seed datasets (snapshot 19 Nov 2026)
│   ├── tokens.ts            # chains, wallet, holdings, gas fees
│   ├── defi.ts              # yield pools
│   ├── nfts.ts              # NFT gallery + mint/event passes
│   ├── security.ts          # contract audits + token approvals
│   └── activity.ts          # activity feed
├── components/
│   ├── layout/              # Sidebar, Topbar, DetailDrawer, Toast
│   └── ui/                  # SkeletonCard, Tooltip, Badge, CopyAddressButton
└── features/
    ├── crypto/              # PortfolioTable, GasTracker, YieldComparator
    ├── nft/                 # NftGrid, NftDetailModal, MintPassCard
    └── security/            # ContractScanner, ApprovalList
```

### Design decisions

- **No external router.** Views are typed state (`View` union) with a single
  source of truth in `src/lib/router.ts` — simpler than react-router for a
  5-view app, and fully type-checked.
- **Strict TypeScript everywhere.** `strict: true`, `noUnusedLocals`,
  `noUnusedParameters`, `verbatimModuleSyntax` (use `import type`),
  `erasableSyntaxOnly` (union types instead of enums).
- **Pillars are isolated.** Each feature module only imports from
  `src/types`, `src/data`, `src/lib`, and `src/components/ui` — never from
  another feature.
- **Seed data is labelled.** Files in `src/data/` say where values came
  from; contract addresses are included only when verified on record
  (`NftItem.contract` is optional by design, never fabricated).
- **Dark-only NexaVault theme.** Background `#0B0E14`, surface `#151A23`,
  border `#232A3B`, accent blue `#3B82F6` → cyan `#06B6D4`, Inter for UI,
  JetBrains Mono for numbers/addresses.

## Phase 1 — done

- Project scaffold, Tailwind v4 config, strict TS, typed data schemas.
- Layout shell + 5 views wired to real (seed) data; `npm run build`
  compiles with zero errors.

## Phase 2 — next

- Live data layer: CoinGecko prices (30s), public-RPC `eth_gasPrice`
  (15s), Blockchair whale feed, DefiLlama yields.
- Real wallet reads: on-chain holdings, NFT media, live approvals
  (revoke = real on-chain tx with preview + confirmation).
- Contract scanner: live source verification + bytecode analysis.
- Mint pass flow: no-code mint preview → on-chain execution.

## Deploy (GitHub Pages)

```bash
npm run build
# push dist/ to the gh-pages branch, or use an Actions workflow.
# If the site lives under a subpath (e.g. /web3-hub/), set
# `base: '/web3-hub/'` in vite.config.ts before building.
```
