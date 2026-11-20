import type { DemoNft, MintPass } from '../types';

/**
 * Mint & event pass previews — TWO demo passes.
 * Design demos of the pass-preview feature, clearly labelled "Demo"
 * in the UI: no live contract, no real mint, no personal data.
 * The "Mint (Simulasi)" button only increments a local counter.
 * Public visitors check any real NFT via "Cek NFT" (contract + token ID).
 */
export const MINT_PASSES: readonly MintPass[] = [
  {
    id: 'web3hub-genesis-demo',
    title: 'TrashGod Vault Genesis Pass (Demo)',
    event: 'Contoh tampilan mint pass — early access + event pass',
    date: 'Contoh — belum ada jadwal live',
    price: 'Contoh',
    supply: 1000,
    minted: 342,
    status: 'live',
  },
  {
    id: 'nexus-summit-2026-demo',
    title: 'Nexus Summit 2026 — VIP Ticket (Demo)',
    event: 'Contoh tiket event — akses VIP + merchandise',
    date: 'Contoh — belum ada jadwal live',
    price: 'Contoh',
    supply: 500,
    minted: 128,
    status: 'live',
  },
] as const;

/**
 * Demo collection for the public "My Collection" grid.
 * Invented collections with generative SVG artwork — NOT real
 * on-chain assets, NOT anyone's personal NFTs. Floor prices are
 * demo figures. Visitors check their own real NFTs via "Cek NFT".
 */
export const DEMO_NFTS: readonly DemoNft[] = [
  {
    id: 'nexa-pixel-042',
    title: 'Nexa Pixel #042',
    collection: 'Nexa Pixels',
    floorEth: 0.42,
    tokenId: '42',
    rarityRank: 12,
    rarityTotal: 1000,
    traits: [
      { trait: 'Background', value: 'Aurora' },
      { trait: 'Body', value: 'Pixel Chrome' },
      { trait: 'Eyes', value: 'Laser Cyan' },
      { trait: 'Accessory', value: 'Holo Visor' },
    ],
  },
  {
    id: 'nexa-pixel-117',
    title: 'Nexa Pixel #117',
    collection: 'Nexa Pixels',
    floorEth: 0.38,
    tokenId: '117',
    rarityRank: 87,
    rarityTotal: 1000,
    traits: [
      { trait: 'Background', value: 'Void' },
      { trait: 'Body', value: 'Pixel Gold' },
      { trait: 'Eyes', value: 'Mono' },
      { trait: 'Accessory', value: 'None' },
    ],
  },
  {
    id: 'prisma-blob-008',
    title: 'Prisma Blob #008',
    collection: 'Prisma Blobs',
    floorEth: 0.65,
    tokenId: '8',
    rarityRank: 5,
    rarityTotal: 500,
    traits: [
      { trait: 'Background', value: 'Prism' },
      { trait: 'Shape', value: 'Blob Prime' },
      { trait: 'Glow', value: 'Rainbow' },
      { trait: 'Mouth', value: 'Smirk' },
    ],
  },
  {
    id: 'prisma-blob-231',
    title: 'Prisma Blob #231',
    collection: 'Prisma Blobs',
    floorEth: 0.21,
    tokenId: '231',
    rarityRank: 203,
    rarityTotal: 500,
    traits: [
      { trait: 'Background', value: 'Dusk' },
      { trait: 'Shape', value: 'Blob Round' },
      { trait: 'Glow', value: 'Soft Blue' },
      { trait: 'Mouth', value: 'Flat' },
    ],
  },
  {
    id: 'void-orb-003',
    title: 'Void Orb #003',
    collection: 'Void Orbs',
    floorEth: 1.2,
    tokenId: '3',
    rarityRank: 2,
    rarityTotal: 250,
    traits: [
      { trait: 'Background', value: 'Nebula' },
      { trait: 'Core', value: 'Singularity' },
      { trait: 'Ring', value: 'Twin Halo' },
      { trait: 'Spark', value: 'Gold Dust' },
    ],
  },
  {
    id: 'void-orb-190',
    title: 'Void Orb #190',
    collection: 'Void Orbs',
    floorEth: 0.55,
    tokenId: '190',
    rarityRank: 141,
    rarityTotal: 250,
    traits: [
      { trait: 'Background', value: 'Deep Space' },
      { trait: 'Core', value: 'Ember' },
      { trait: 'Ring', value: 'Single' },
      { trait: 'Spark', value: 'None' },
    ],
  },
  {
    id: 'hexa-fauna-077',
    title: 'Hexa Fauna #077',
    collection: 'Hexa Fauna',
    floorEth: 0.33,
    tokenId: '77',
    rarityRank: 64,
    rarityTotal: 800,
    traits: [
      { trait: 'Background', value: 'Jungle' },
      { trait: 'Species', value: 'Hexa Fox' },
      { trait: 'Pattern', value: 'Circuit' },
      { trait: 'Eyes', value: 'Amber' },
    ],
  },
  {
    id: 'hexa-fauna-512',
    title: 'Hexa Fauna #512',
    collection: 'Hexa Fauna',
    floorEth: 0.18,
    tokenId: '512',
    rarityRank: 410,
    rarityTotal: 800,
    traits: [
      { trait: 'Background', value: 'Meadow' },
      { trait: 'Species', value: 'Hexa Deer' },
      { trait: 'Pattern', value: 'Plain' },
      { trait: 'Eyes', value: 'Green' },
    ],
  },
] as const;
