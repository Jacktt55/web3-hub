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

## Phase 2 — done (2026-11-19)

**Live di https://jacktt55.github.io/web3-hub/** — repo `Jacktt55/web3-hub`, commit `f1c4157`, branch `gh-pages` (base `/web3-hub/`).

- `src/lib/rpc.ts`: JSON-RPC client tanpa dependensi (rotasi endpoint per chain, eth_call/getBalance/getCode/gasPrice/estimateGas, encode/decode ABI minimal, selector hardcode).
- `src/lib/live.ts`: CoinGecko harga + perubahan 24j; gas `eth_gasPrice` (transfer 21k / swap 150k gas → USD); DefiLlama yields (top 12, risiko/kategori diturunkan dari APY, dilabeli); `resolveNftImage` via tokenURI on-chain → metadata → image (fallback placeholder); `fetchLiveApprovals` — allowance on-chain untuk watchlist 4 token × spender (kosong = wallet benar-benar bersih); `scanContractLive` — eth_getCode + Sourcify v2 (v1 hanya verifikasi & bytecode, bukan simulasi honeypot); `fetchAugentStatus` — phase() + claimableOf(); `prepareRevokeTx` / `prepareAugentClaimTx` / `preparePresschainPreview` — **preview saja, tidak ada yang sign/broadcast**.
- `src/hooks/useLiveData.ts`: polling harga 30 dtk · gas 15 dtk · yield 5 mnt · approval 60 dtk · AUGENT 60 dtk · artwork NFT sekali saat mount. Gagal fetch = nilai lama/seed dipertahankan, app tidak pernah blank.
- `TxPreviewModal`: chain, from, to, fungsi, value, estimasi gas, fee, calldata + tombol "Salin ringkasan" — eksekusi tetap di chat dengan Guts setelah konfirmasi eksplisit user (sesuai safety rails).
- **Presschain TIDAK dikerjakan dulu (instruksi user 16:39 WIB)** — tidak ada live read Presschain di app; kartu edisi 9 hanya preview statis (jawaban + gas diverifikasi di chat). Cek edisi 9 terjadwal besok 07:05 WIB tetap jalan.
- Verifikasi: build 0 error; render lokal di path `/web3-hub/` terverifikasi headless — status LIVE muncul begitu satu sumber live menjawab; di sandbox, CoinGecko/DefiLlama/gas RPC terblokir sehingga tampil snapshot, tapi approval RPC lolos dan status jadi LIVE. URL live dicek via curl: HTTP 200, judul + asset benar, JS live berisi string CoinGecko/DefiLlama/eth_gasPrice/Sourcify. Screenshot URL live dari sandbox tidak bisa (proxy blokir headless shell), render lokal adalah buktinya.

## Deploy (GitHub Pages) — done

```bash
npm run build
npx -y gh-pages -d dist   # push dist/ ke branch gh-pages
gh api -X POST repos/Jacktt55/web3-hub/pages -f source[branch]=gh-pages -f source[path]=/
# base sudah '/web3-hub/' di vite.config.ts
# Live: https://jacktt55.github.io/web3-hub/
```
