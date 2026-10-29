import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { weightedAverageCost } from "../src/domain/cost.js";
import { calcTotal, calcTotalHpp } from "../src/domain/sale.js";
import { calcLossValue } from "../src/domain/adjustment.js";
import { addDays, todayInTz } from "../src/domain/period.js";

if (!process.argv.includes("--reset")) {
  console.error(
    "Script ini MENGHAPUS semua product, transaksi, adjustment, dan riwayat stok.\n" +
      "Jalankan dengan: npx tsx prisma/seed-demo.js --reset"
  );
  process.exit(1);
}
const dbHost = new URL(process.env.DATABASE_URL).hostname;
if (
  (process.env.NODE_ENV === "production" || !["localhost", "127.0.0.1"].includes(dbHost)) &&
  !process.argv.includes("--allow-remote")
) {
  console.error(`Dibatalkan: database ada di "${dbHost}" (bukan lokal) atau mode production.`);
  console.error("Kalau memang disengaja, tambahkan --allow-remote.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261024);
const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

function weightedPick(list) {
  const total = list.reduce((sum, p) => sum + p.weight, 0);
  let r = rand() * total;
  for (const p of list) {
    r -= p.weight;
    if (r < 0) return p;
  }
  return list[list.length - 1];
}
const driftCost = (base) => Math.round((base * (1 + (rand() - 0.5) * 0.08)) / 100) * 100;
const CATALOG = [
  { sku: "BRS-001", name: "Beras Premium 25kg", category: "Beras", unit: "karung", price: 330000, cost: 305000, minStock: 10, sellQty: [1, 4], weight: 3, initialQty: 40, restockQty: 30 },
  { sku: "BRS-002", name: "Beras Medium 25kg", category: "Beras", unit: "karung", price: 290000, cost: 268000, minStock: 10, sellQty: [1, 5], weight: 3, initialQty: 40, restockQty: 30 },
  { sku: "GLA-001", name: "Gula Pasir 1kg", category: "Gula", unit: "pcs", price: 18500, cost: 16800, minStock: 50, sellQty: [10, 40], weight: 4, initialQty: 300, restockQty: 250 },
  { sku: "MNY-001", name: "Minyak Goreng 2L", category: "Minyak", unit: "pcs", price: 40000, cost: 36500, minStock: 40, sellQty: [6, 24], weight: 3, initialQty: 200, restockQty: 150 },
  { sku: "MNY-002", name: "Minyak Goreng 5L", category: "Minyak", unit: "pcs", price: 98000, cost: 90000, minStock: 20, sellQty: [2, 10], weight: 2, initialQty: 80, restockQty: 60 },
  { sku: "TPG-001", name: "Tepung Terigu 1kg", category: "Tepung", unit: "pcs", price: 14000, cost: 12300, minStock: 60, sellQty: [10, 40], weight: 2, initialQty: 300, restockQty: 200 },
  { sku: "TLR-001", name: "Telur Ayam", category: "Telur", unit: "kg", price: 31000, cost: 28500, minStock: 30, sellQty: [5, 25], weight: 3, initialQty: 150, restockQty: 120 },
  { sku: "MIE-001", name: "Mi Instan Goreng (dus isi 40)", category: "Mi Instan", unit: "dus", price: 118000, cost: 109000, minStock: 15, sellQty: [1, 6], weight: 3, initialQty: 60, restockQty: 50 },
  { sku: "MIE-002", name: "Mi Instan Kuah (dus isi 40)", category: "Mi Instan", unit: "dus", price: 112000, cost: 103000, minStock: 15, sellQty: [1, 6], weight: 3, initialQty: 60, restockQty: 50 },
  { sku: "KOP-001", name: "Kopi Bubuk 200g", category: "Minuman", unit: "pcs", price: 14500, cost: 12800, minStock: 40, sellQty: [6, 24], weight: 2, initialQty: 200, restockQty: 150 },
  { sku: "TEH-001", name: "Teh Celup 25 Kantong", category: "Minuman", unit: "pcs", price: 7500, cost: 6600, minStock: 60, sellQty: [10, 40], weight: 2, initialQty: 300, restockQty: 200 },
  { sku: "SUS-001", name: "Susu Kental Manis 370g", category: "Susu", unit: "pcs", price: 13500, cost: 11900, minStock: 40, sellQty: [6, 24], weight: 2, initialQty: 200, restockQty: 150 },
  { sku: "GRM-001", name: "Garam Halus 250g", category: "Bumbu", unit: "pcs", price: 3500, cost: 2900, minStock: 80, sellQty: [10, 50], weight: 1, initialQty: 400, restockQty: 300 },
  { sku: "KCP-001", name: "Kecap Manis 600ml", category: "Bumbu", unit: "pcs", price: 21000, cost: 18500, minStock: 30, sellQty: [4, 18], weight: 2, initialQty: 120, restockQty: 90 },
  { sku: "SAR-001", name: "Sarden Kaleng 155g", category: "Makanan Kaleng", unit: "pcs", price: 11500, cost: 10000, minStock: 40, sellQty: [6, 24], weight: 2, initialQty: 150, restockQty: 100 },
  // Tanpa restok: stoknya akan menipis sampai habis (demo "stok habis").
  { sku: "DET-001", name: "Deterjen Bubuk 800g", category: "Kebutuhan Rumah", unit: "pcs", price: 19000, cost: 16800, minStock: 30, sellQty: [1, 3], weight: 2, initialQty: 20, restockQty: 0, noRestock: true },
];

const CANCEL_REASONS = ["Customer batal", "Salah input jumlah barang", "Barang dikembalikan customer"];

const NOW = new Date();
const today = todayInTz(NOW);
const start = addDays(today, -29);
const days = [];
for (let d = start; d <= today; d = addDays(d, 1)) days.push(d);

const wib = (day, hh, mm) =>
  new Date(`${day}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00+07:00`);
const addMinutes = (date, n) => new Date(date.getTime() + n * 60000);

const reduceTo = (below) => (st) => Math.min(0, st.minStock - below - st.stock);
function buildEvents() {
  const events = [];

  events.push({ at: wib(start, 7, 0), kind: "initial" });
  for (const day of days) events.push({ at: wib(day, 7, 30), kind: "restock" });

  let saleCounter = 0;
  for (const day of days) {
    const dow = new Date(`${day}T00:00:00Z`).getUTCDay(); // 0 = Minggu
    const count = dow === 0 ? randInt(1, 3) : randInt(3, 7);
    for (let i = 0; i < count; i++) {
      const at = wib(day, randInt(8, 17), randInt(0, 59));
      const used = new Set();
      const items = [];
      for (let k = 0, lines = randInt(1, 4); k < lines; k++) {
        const p = weightedPick(CATALOG);
        if (used.has(p.sku)) continue;
        used.add(p.sku);
        items.push({ sku: p.sku, qty: randInt(p.sellQty[0], p.sellQty[1]) });
      }
      const key = `sale-${saleCounter++}`;
      events.push({ at, kind: "sale", key, items });
      if (day !== today && rand() < 0.06) {
        events.push({ at: addMinutes(at, randInt(40, 200)), kind: "cancel", key, reason: pick(CANCEL_REASONS) });
      }
    }
  }

  const adj = (daysAgo, sku, type, qty, reason, by, status) => ({
    at: wib(addDays(today, -daysAgo), 10, 0), kind: "adjust", sku, type, qty, reason, by, status,
  });
  events.push(
    adj(24, "TLR-001", "DAMAGED", -6, "Telur pecah saat bongkar muat", "manager", "APPROVED"),
    adj(17, "MIE-001", "DAMAGED", -2, "Dus basah terkena bocor atap", "owner", "APPROVED"),
    adj(11, "BRS-002", "CORRECTION", 3, "Hitung fisik lebih banyak dari sistem", "manager", "APPROVED"),
    adj(9, "GLA-001", "DAMAGED", -8, "Kemasan sobek", "manager", "APPROVED"),
    adj(6, "SUS-001", "CORRECTION", -4, "Selisih hitung fisik", "manager", "REJECTED")
  );
  events.push(
    { at: addMinutes(NOW, -60), kind: "pendingProduct" },
    { at: addMinutes(NOW, -5), kind: "adjust", sku: "TLR-001", type: "DAMAGED", qty: reduceTo(5), reason: "Telur pecah saat pengiriman supplier", by: "manager", status: "APPROVED" },
    { at: addMinutes(NOW, -4), kind: "adjust", sku: "MNY-002", type: "CORRECTION", qty: reduceTo(2), reason: "Selisih hitung fisik gudang", by: "manager", status: "APPROVED" },
    { at: addMinutes(NOW, -3), kind: "adjust", sku: "KCP-001", type: "DAMAGED", qty: -3, reason: "Botol retak, menunggu persetujuan owner", by: "manager", status: "PENDING" },
    { at: addMinutes(NOW, -2), kind: "pendingSale", items: [{ sku: "BRS-001", qty: 2 }, { sku: "MNY-001", qty: 12 }] }
  );

  return events.sort((a, b) => a.at - b.at);
}

async function main() {
  const owner = await prisma.user.findUnique({ where: { email: "owner@demo.com" } });
  const manager = await prisma.user.findUnique({ where: { email: "manager@demo.com" } });
  if (!owner || !manager) {
    throw new Error("User demo belum ada. Jalankan dulu: npx tsx prisma/seed.js");
  }
  const who = () => (rand() < 0.5 ? owner : manager);

  console.log("Menghapus data lama...");
  await prisma.$executeRaw`TRUNCATE TABLE stock_movements, stock_adjustments, sale_items, sales, stock_ins, products RESTART IDENTITY CASCADE`;
  const state = new Map();
  for (const c of CATALOG) {
    const p = await prisma.product.create({
      data: {
        sku: c.sku, name: c.name, category: c.category, unit: c.unit,
        price: c.price, minStock: c.minStock, status: "ACTIVE",
        createdById: owner.id, createdAt: wib(start, 6, 0),
      },
    });
    state.set(c.sku, { id: p.id, price: c.price, minStock: c.minStock, stock: 0, avgCost: 0 });
  }

  const created = new Map();   async function stockIn(sku, qty, unitCost, user, at) {
    const st = state.get(sku);
    const newAvg = weightedAverageCost(st.stock, st.avgCost, qty, unitCost);
    const row = await prisma.stockIn.create({
      data: { productId: st.id, qty, unitCost, createdById: user.id, createdAt: at },
    });
    await prisma.stockMovement.create({
      data: { productId: st.id, activityType: "STOCK_IN", quantityChange: qty, referenceId: row.id, createdById: user.id, createdAt: at },
    });
    st.stock += qty;
    st.avgCost = newAvg;
  }

  const handlers = {
    async initial(ev) {
      for (const c of CATALOG) await stockIn(c.sku, c.initialQty, c.cost, owner, ev.at);
    },

    async restock(ev) {
      for (const c of CATALOG) {
        if (c.noRestock || state.get(c.sku).stock >= c.minStock * 2) continue;
        await stockIn(c.sku, c.restockQty, driftCost(c.cost), who(), ev.at);
      }
    },

    async sale(ev) {
      const lines = [];
      for (const want of ev.items) {
        const st = state.get(want.sku);
        const qty = Math.min(want.qty, st.stock); 
          if (qty > 0) lines.push({ st, qty, price: st.price, hpp: st.avgCost });
      }
      if (lines.length === 0) return; 

      const confirmedAt = addMinutes(ev.at, randInt(1, 10));
      const sale = await prisma.sale.create({
        data: {
          status: "SUCCESS",
          total: calcTotal(lines),
          totalHpp: calcTotalHpp(lines),
          createdById: manager.id,
          createdAt: ev.at,
          confirmedAt,
          items: {
            create: lines.map((l) => ({ productId: l.st.id, qty: l.qty, price: l.price, hppSnapshot: l.hpp })),
          },
        },
      });
      for (const l of lines) {
        l.st.stock -= l.qty;
        await prisma.stockMovement.create({
          data: { productId: l.st.id, activityType: "SALE", quantityChange: -l.qty, referenceId: sale.id, createdById: manager.id, createdAt: confirmedAt },
        });
      }
      created.set(ev.key, { id: sale.id, lines });
    },

    async cancel(ev) {
      const rec = created.get(ev.key);
      if (!rec) return; 
      const user = who();
      await prisma.sale.update({
        where: { id: rec.id },
        data: { status: "CANCELLED", cancelledById: user.id, cancelledAt: ev.at, cancelReason: ev.reason },
      });
      for (const l of rec.lines) {
        l.st.stock += l.qty;
        await prisma.stockMovement.create({
          data: { productId: l.st.id, activityType: "CANCEL_SALE", quantityChange: l.qty, referenceId: rec.id, reason: ev.reason, createdById: user.id, createdAt: ev.at },
        });
      }
    },

    async adjust(ev) {
      const st = state.get(ev.sku);
      const qtyChange = typeof ev.qty === "function" ? ev.qty(st) : ev.qty;
      if (!qtyChange) return; 
      if (ev.status === "APPROVED" && st.stock + qtyChange < 0) return;

      const requestedById = ev.by === "owner" ? owner.id : manager.id;
      const base = { productId: st.id, type: ev.type, qtyChange, reason: ev.reason, requestedById, createdAt: ev.at };

      if (ev.status === "PENDING") {
        await prisma.stockAdjustment.create({ data: { ...base, status: "PENDING" } });
        return;
      }

      const decidedAt = new Date(Math.min(addMinutes(ev.at, 25).getTime(), NOW.getTime()));
      if (ev.status === "REJECTED") {
        await prisma.stockAdjustment.create({ data: { ...base, status: "REJECTED", decidedById: owner.id, decidedAt } });
        return;
      }

      const adjustment = await prisma.stockAdjustment.create({
        data: {
          ...base,
          status: "APPROVED",
          lossValue: calcLossValue(ev.type, qtyChange, st.avgCost),
          decidedById: owner.id,
          decidedAt,
        },
      });
      st.stock += qtyChange;
      await prisma.stockMovement.create({
        data: {
          productId: st.id,
          activityType: ev.type === "DAMAGED" ? "DAMAGED" : "ADJUSTMENT",
          quantityChange: qtyChange,
          referenceId: adjustment.id,
          reason: ev.reason,
          createdById: owner.id,
          createdAt: decidedAt,
        },
      });
    },

    async pendingSale(ev) {
      const lines = ev.items.map((w) => {
        const st = state.get(w.sku);
        return { st, qty: w.qty, price: st.price, hpp: st.avgCost };
      });
      await prisma.sale.create({
        data: {
          status: "PENDING",
          total: calcTotal(lines),
          createdById: manager.id,
          createdAt: ev.at,
          items: { create: lines.map((l) => ({ productId: l.st.id, qty: l.qty, price: l.price, hppSnapshot: l.hpp })) },
        },
      });
    },

    async pendingProduct(ev) {
      await prisma.product.create({
        data: {
          sku: "SNT-001", name: "Santan Instan 65ml", category: "Bumbu", unit: "pcs",
          price: 3500, minStock: 50, status: "PENDING_APPROVAL",
          createdById: manager.id, createdAt: ev.at,
        },
      });
    },
  };

  const events = buildEvents().filter((ev) => ev.at <= NOW);
  console.log(`Memproses ${events.length} kejadian...`);
  for (const ev of events) await handlers[ev.kind](ev);

  for (const st of state.values()) {
    await prisma.product.update({ where: { id: st.id }, data: { stock: st.stock, avgCost: st.avgCost } });
  }

  const mismatch = await prisma.$queryRaw`
    SELECT p.sku, p.stock, COALESCE(SUM(m.quantity_change), 0)::int AS history
    FROM products p LEFT JOIN stock_movements m ON m.product_id = p.id
    GROUP BY p.id, p.sku, p.stock
    HAVING p.stock <> COALESCE(SUM(m.quantity_change), 0)
  `;
  if (mismatch.length > 0) {
    console.error("STOK TIDAK COCOK DENGAN RIWAYAT:", mismatch);
    process.exit(1);
  }

  const bySaleStatus = await prisma.sale.groupBy({ by: ["status"], _count: { _all: true } });
  const byAdjStatus = await prisma.stockAdjustment.groupBy({ by: ["status"], _count: { _all: true } });
  console.log("Product      :", await prisma.product.count());
  console.log("Barang masuk :", await prisma.stockIn.count());
  console.log("Penjualan    :", bySaleStatus.map((r) => `${r.status}=${r._count._all}`).join(", "));
  console.log("Adjustment   :", byAdjStatus.map((r) => `${r.status}=${r._count._all}`).join(", "));
  console.log("Riwayat stok :", await prisma.stockMovement.count());
  console.log("Seed demo selesai, stok sesuai riwayat.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());