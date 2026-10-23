import { prisma } from "@/lib/prisma";
import { calcGrossProfit } from "@/domain/sale";
import { calcMarginPercent, calcProfitAfterLoss, fillDailySeries } from "@/domain/dashboard";

// Prisma Decimal | null -> number. Untuk SUM, "tidak ada baris" memang berarti 0,
// jadi null boleh jadi 0. (Beda dengan lossValue per adjustment, di mana null
// berarti "tidak berlaku" dan TIDAK boleh berubah jadi 0.)
const num = (v) => Number(v ?? 0);

export async function getSummary({ period, start, end }) {
  const inRange = { gte: start, lt: end };

  // Empat query berjalan bersamaan, lalu semuanya ditunggu.
  const [salesAgg, cancelledCount, damagedAgg, inventoryRows] = await Promise.all([
    prisma.sale.aggregate({
      where: { status: "SUCCESS", confirmedAt: inRange },
      _sum: { total: true, totalHpp: true },
      _count: { _all: true },
    }),
    prisma.sale.count({ where: { status: "CANCELLED", cancelledAt: inRange } }),
    prisma.stockAdjustment.aggregate({
      where: { type: "DAMAGED", status: "APPROVED", decidedAt: inRange },
      _sum: { qtyChange: true, lossValue: true },
      _count: { _all: true },
    }),
    // Prisma tidak bisa menjumlahkan stock x avg_cost, jadi pakai SQL.
    // ::int dan ::float8 supaya hasilnya berupa number biasa. Tanpa cast,
    // COUNT dan SUM menjadi BigInt di JavaScript, yang tidak bisa di-JSON-kan.
    prisma.$queryRaw`
      SELECT
        COUNT(*)::int AS "productCount",
        COALESCE(SUM(stock), 0)::int AS "totalUnits",
        ROUND(COALESCE(SUM(stock * avg_cost), 0), 2)::float8 AS "totalValue",
        (COUNT(*) FILTER (WHERE stock <= min_stock))::int AS "lowStockCount",
        (COUNT(*) FILTER (WHERE stock = 0))::int AS "outOfStockCount"
      FROM products
      WHERE status = 'ACTIVE'
    `,
  ]);

  const omzet = num(salesAgg._sum.total);
  const hpp = num(salesAgg._sum.totalHpp);
  const grossProfit = calcGrossProfit(omzet, hpp);
  const lossValue = num(damagedAgg._sum.lossValue);
  const inv = inventoryRows[0];

  return {
    period,
    sales: {
      count: salesAgg._count._all,
      omzet,
      hpp,
      grossProfit,
      grossMarginPercent: calcMarginPercent(omzet, grossProfit),
      cancelledCount,
    },
    damaged: {
      count: damagedAgg._count._all,
      units: Math.abs(num(damagedAgg._sum.qtyChange)), // qtyChange negatif, tampilkan positif
      lossValue,
    },
    profitAfterLoss: calcProfitAfterLoss(grossProfit, lossValue),
    inventory: {
      productCount: inv.productCount,
      totalUnits: inv.totalUnits,
      totalValue: inv.totalValue,
      lowStockCount: inv.lowStockCount,
      outOfStockCount: inv.outOfStockCount,
    },
  };
}

export async function getSalesTrend({ period, start, end }) {
  // confirmed_at tersimpan sebagai UTC tanpa label zona. Langkah pertama
  // (AT TIME ZONE 'UTC') memberi label UTC, langkah kedua mengubahnya ke jam
  // dinding Jakarta. 'Asia/Jakarta' harus sama dengan TZ_NAME di period.js.
  const rows = await prisma.$queryRaw`
    SELECT
      to_char((confirmed_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD') AS "day",
      COUNT(*)::int AS "count",
      ROUND(COALESCE(SUM(total), 0), 2)::float8 AS "omzet",
      ROUND(COALESCE(SUM(total_hpp), 0), 2)::float8 AS "hpp"
    FROM sales
    WHERE status = 'SUCCESS'
      AND (confirmed_at AT TIME ZONE 'UTC') >= ${start.toISOString()}::timestamptz
      AND (confirmed_at AT TIME ZONE 'UTC') < ${end.toISOString()}::timestamptz
    GROUP BY 1
    ORDER BY 1
  `;

  return { period, series: fillDailySeries(rows, period.from, period.to) };
}

export async function getLowStock({ skip, take }) {
  const [rows, countRows] = await Promise.all([
    prisma.$queryRaw`
      SELECT id, sku, name, category, unit, stock, min_stock AS "minStock"
      FROM products
      WHERE status = 'ACTIVE' AND stock <= min_stock
      ORDER BY stock ASC, name ASC
      LIMIT ${take} OFFSET ${skip}
    `,
    prisma.$queryRaw`
      SELECT COUNT(*)::int AS "total"
      FROM products
      WHERE status = 'ACTIVE' AND stock <= min_stock
    `,
  ]);

  return {
    items: rows.map((r) => ({
      id: r.id,
      sku: r.sku,
      name: r.name,
      category: r.category,
      unit: r.unit,
      stock: r.stock,
      minStock: r.minStock,
      shortage: r.minStock - r.stock, // kekurangan dari batas minimum
      isOutOfStock: r.stock === 0,
    })),
    total: countRows[0].total,
  };
}