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
├── types/index.ts           # shared strict models: chains, gas,
│                            # yield pools, mint passes, approvals, View
├── lib/
│   ├── format.ts            # USD / compact / pct / address / time helpers
│   └── router.ts            # the 5 views: Overview, Crypto & DeFi,
│                            # NFT Hub, Security Scanner, Activity
├── data/                    # public reference datasets (no personal data)
│   ├── tokens.ts            # chains + gas snapshot rows
│   ├── defi.ts              # yield pools (fallback seed)
│   └── nfts.ts              # mint/event pass demo (1 pass)
├── components/
│   ├── layout/              # Sidebar, Topbar, DetailDrawer, Toast
│   └── ui/                  # SkeletonCard, Tooltip, Badge, CopyAddressButton
└── features/
    ├── crypto/              # PortfolioTable, GasTracker, YieldGrid
    ├── nft/                 # NftLookup, MintPassCard
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
- **Public tool, no personal data.** The app has no default wallet and
  no seeded holdings, gallery, approvals, or activity. Every visitor
  enters their own address; wallet-scoped reads (balances, approvals)
  only run for that address. Seed data in `src/data/` is public
  reference data only (chains, gas snapshot, yield fallback, 1 demo
  mint pass).
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
- `src/lib/live.ts`: CoinGecko harga + perubahan 24j; gas `eth_gasPrice` (transfer 21k / swap 150k gas → USD); DefiLlama yields (top 12, risiko/kategori diturunkan dari APY, dilabeli); `fetchNftMetadata` via tokenURI on-chain → metadata → image (untuk "Cek NFT" — kontrak + token ID apa pun yang dimasukkan pengunjung); `fetchNativeBalances` — saldo native per chain untuk alamat pengunjung; `fetchLiveApprovals` — allowance on-chain untuk watchlist token × spender (kosong = wallet benar-benar bersih); `scanContractLive` — eth_getCode + Sourcify v2 (v1 hanya verifikasi & bytecode, bukan simulasi honeypot); `prepareRevokeTx` — **preview saja, tidak ada yang sign/broadcast**.
- `src/hooks/useLiveData.ts`: polling harga 30 dtk · gas 15 s · yield 5 mnt · approval 60 dtk · saldo native 60 dtk. Pembacaan berbasis wallet (approval, saldo) hanya jalan kalau pengunjung sudah memasukkan alamat. Gagal fetch = nilai lama/seed dipertahankan, app tidak pernah blank.
- `TxPreviewModal`: chain, from, to, fungsi, value, estimasi gas, fee, calldata + tombol "Salin ringkasan" — preview saja, eksekusi dari wallet pengunjung sendiri.
- **Wallet pengunjung (2026-11-19):** pill wallet di Topbar membuka modal "Connect Wallet" — ketik alamat EVM apa pun, saldo native (BSC/ETH/Base/Arbitrum/Polygon) dicek on-chain sebagai konfirmasi, alamat tersimpan di localStorage browser pengunjung saja. Tidak ada wallet default, tidak ada koneksi wallet / tanda tangan.
- **Anti-clutter layout shell (2026-11-19 ~17:10 WIB, commit 22e7f19):** sidebar 240px (w-60) dengan 5 link saja + Docs/Settings di footer kompak (toast "segera hadir"); topbar gas pill ETH/Base/Arbitrum; `tabular-nums` global di `body`; `<SkeletonRow />` baru + skeleton saat approval pertama dibaca & saat scanner memindai; nilai KPI responsif (text-base → xl:text-2xl) supaya tidak terpotong di 375px. Verifikasi headless: 1440px & 375px OK — sidebar jadi drawer di mobile, gas pill tersembunyi di layar kecil, tidak ada overflow horizontal.
- **Pembersihan untuk publik (2026-11-19 ~17:21 WIB, commit b960f56):** Web3 Hub adalah web publik, bukan alat pribadi — semua data pribadi dihapus dari kode dan dari situs live: AUGENT (status pool + claim), alamat wallet default, snapshot portofolio, galeri NFT pribadi, daftar approval contoh, audit kontrak contoh, dan riwayat aktivitas. Diganti: tidak ada wallet default (pengunjung memasukkan alamatnya sendiri), "Cek NFT" publik (kontrak + token ID apa pun), saldo native dibaca live untuk alamat pengunjung, Activity menjadi tautan explorer, dan mint pass hanya 1 demo yang jelas berlabel demo.
- Verifikasi: build 0 error; render lokal di path `/web3-hub/` terverifikasi headless — status LIVE muncul begitu satu sumber live menjawab; di sandbox, CoinGecko/DefiLlama/gas RPC terblokir sehingga tampil snapshot, tapi approval RPC lolos dan status jadi LIVE. URL live dicek via curl: HTTP 200, judul + asset benar, JS live berisi string CoinGecko/DefiLlama/eth_gasPrice/Sourcify. Screenshot URL live dari sandbox tidak bisa (proxy blokir headless shell), render lokal adalah buktinya.

## Phase 3 — Overview & Crypto workspace (2026-11-19)

- **Overview KPI row (4 kartu):** Total Net Worth (jumlah saldo pengunjung × harga live), 24h Portfolio Change (perubahan tertimbang portofolio), Estimated Annual Yield / APY (pool terbaik saat ini), Security Health Score (100 dikurangi penalti approval berisiko dari watchlist live). Tanpa wallet, kartu portofolio menampilkan "—" + ajakan memasukkan wallet.
- **Tabbed workspace di Crypto & DeFi (tanpa scroll vertikal panjang):** Tab 1 Token Portfolio — tabel Asset, Chain Badge, Price, Balance, Value, 24h %; toggle "Hide small balances (<$10)" + filter instan dari search Topbar; baris = saldo native (5 chain EVM) + saldo ERC-20 watchlist (USDT BSC, USDC ETH, WETH ETH, via `balanceOf`). Tab 2 DeFi Yield & Risk Comparator — grid 3 kolom; tiap kartu: protokol, pasangan aset, APY, TVL, badge audit (`Audited • Low Risk` hijau / `Unaudited • Medium Risk` amber — gabungan daftar protokol utama beraudit + risiko turunan APY, dijelaskan di footnote) + kalkulator deposit interaktif (estimasi hasil/tahun & /bulan).
- **Progressive disclosure:** klik baris token atau kartu pool membuka `<DetailDrawer />` — alamat kontrak lengkap (salin), ringkasan audit, dan kontrol simulasi swap/stake (bukan transaksi).
- **Tooltip `?` (hover + klik, untuk sentuh):** APY (di KPI), TVL (di header comparator), Gas Fee (di header Gas Tracker) — penjelasan bahasa sederhana, maks. 2 kalimat.
- **Transisi skeleton 800ms** saat ganti tab atau klik "Segarkan" di Topbar; semua angka `tabular-nums`.
- Catatan jujur: chain badge Solana ada di data referensi, tapi tabel portofolio hanya menampilkan chain EVM — alamat Solana berformat base58, tidak bisa dibaca dari alamat EVM pengunjung.

## Deploy (GitHub Pages) — done

```bash
npm run build
npx -y gh-pages -d dist   # push dist/ ke branch gh-pages
gh api -X POST repos/Jacktt55/web3-hub/pages -f source[branch]=gh-pages -f source[path]=/
# base sudah '/web3-hub/' di vite.config.ts
# Live: https://jacktt55.github.io/web3-hub/
```
