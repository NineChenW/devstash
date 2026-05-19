-- One-off: reset and re-seed ~1/3 of demo user items/collections as favorite.
-- Run: npx prisma db execute --file scripts/seed-demo-favorites.sql --schema prisma/schema.prisma
-- Safe to delete after running.

UPDATE "Item"       SET "isFavorite" = false WHERE "userId" = 'cmo2fm2s30007eakz6qgqj2zk';
UPDATE "Collection" SET "isFavorite" = false WHERE "userId" = 'cmo2fm2s30007eakz6qgqj2zk';

UPDATE "Item" SET "isFavorite" = true WHERE id IN (
  'cmo2fmjwv000veakzvfytlna7',
  'cmo2fmk8k000xeakz7bn4gvs0',
  'cmo2fmkq50010eakzelr1vqc9',
  'cmo2fmkka000zeakzvc543ut4',
  'cmo2fmldi0014eakzu2sr0ctv',
  'cmo2fmm110018eakz5it416uq',
  'cmo2fmkw10011eakzdyfa7ubb'
);

UPDATE "Collection" SET "isFavorite" = true WHERE id IN (
  'cmo2fn5x8001deakzxha1kx75',
  'cmo2fn546001ceakznlcl3gsw'
);
