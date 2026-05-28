import "server-only";

import db from "@/lib/db";
import { createdAtRangeWhere, type ExportDateRange } from "@/lib/admin/export-range";
import { isCoreAdminEmail } from "@/lib/rbac";
import type { AdminLogEntry, AdminStatsSnapshot } from "@/lib/admin/types";

export type AdminStats = AdminStatsSnapshot;

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  ordersCount: number;
  paidTotal: number;
  rbacAdmin: boolean;
  rbacSupport: boolean;
  telegramUserId: string | null;
};

export type AdminPaymentRow = {
  id: string;
  status: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  buyerEmail: string;
  yookassaId: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export async function getAdminStats(): Promise<AdminStatsSnapshot> {
  const [
    usersCount,
    ordersCount,
    paidOrdersCount,
    pendingOrdersCount,
    canceledOrdersCount,
    activePlansCount,
    paidSum,
  ] = await db.$transaction([
    db.user.count(),
    db.order.count(),
    db.order.count({ where: { status: "PAID" } }),
    db.order.count({ where: { status: "PENDING" } }),
    db.order.count({ where: { status: "CANCELED" } }),
    db.plan.count({ where: { active: true } }),
    db.order.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true },
    }),
  ]);

  return {
    usersCount,
    ordersCount,
    paidOrdersCount,
    pendingOrdersCount,
    canceledOrdersCount,
    activePlansCount,
    revenueTotal: paidSum._sum.amount ?? 0,
  };
}

export async function getAdminActivityLog(limit = 20): Promise<AdminLogEntry[]> {
  const [users, orders] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: limit * 2,
      select: {
        id: true,
        status: true,
        planName: true,
        amount: true,
        currency: true,
        createdAt: true,
        buyerEmail: true,
        user: { select: { email: true } },
      },
    }),
  ]);

  const entries: AdminLogEntry[] = [];

  for (const user of users) {
    entries.push({
      id: `user-${user.id}`,
      type: "user_registered",
      message: `Регистрация: ${user.name}`,
      detail: user.email,
      createdAt: user.createdAt.toISOString(),
    });
  }

  for (const order of orders) {
    const type =
      order.status === "PAID"
        ? "order_paid"
        : order.status === "CANCELED"
          ? "order_canceled"
          : "order_created";

    const statusLabel =
      order.status === "PAID"
        ? "Оплачен"
        : order.status === "CANCELED"
          ? "Отменён"
          : "Создан";

    entries.push({
      id: `order-${order.id}-${order.status}`,
      type,
      message: `Заказ ${statusLabel.toLowerCase()}: ${order.planName}`,
      detail: `${order.user?.email ?? order.buyerEmail} · ${order.amount} ${order.currency}`,
      createdAt: order.createdAt.toISOString(),
    });
  }

  return entries
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export async function getAdminUsers(
  range?: ExportDateRange,
): Promise<AdminUserRow[]> {
  const users = await db.user.findMany({
    where: range ? createdAtRangeWhere(range) : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      orders: {
        select: { status: true, amount: true },
      },
    },
  });

  return users.map((user) => {
    const paidOrders = user.orders.filter((o) => o.status === "PAID");
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      ordersCount: user.orders.length,
      paidTotal: paidOrders.reduce((sum, o) => sum + o.amount, 0),
      rbacAdmin: user.rbacAdmin,
      rbacSupport: user.rbacSupport,
      telegramUserId: user.telegramUserId,
    };
  });
}

export async function getAdminUserById(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      orders: {
        select: { status: true, amount: true },
      },
    },
  });

  if (!user) return null;

  const paidOrders = user.orders.filter((o) => o.status === "PAID");
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    ordersCount: user.orders.length,
    paidTotal: paidOrders.reduce((sum, o) => sum + o.amount, 0),
    rbacAdmin: user.rbacAdmin,
    rbacSupport: user.rbacSupport,
    telegramUserId: user.telegramUserId,
    isCoreAdmin: isCoreAdminEmail(user.email),
    telegramLinked: Boolean(user.telegramUserId),
  };
}

export async function getAdminPayments(
  range?: ExportDateRange,
): Promise<AdminPaymentRow[]> {
  const orders = await db.order.findMany({
    where: range ? createdAtRangeWhere(range) : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return orders.map((order) => ({
    id: order.id,
    status: order.status,
    planId: order.planId,
    planName: order.planName,
    amount: order.amount,
    currency: order.currency,
    buyerEmail: order.buyerEmail,
    yookassaId: order.yookassaId,
    createdAt: order.createdAt,
    user: order.user,
  }));
}

export async function getAdminUserPayments(userId: string): Promise<AdminPaymentRow[]> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user) return [];

  const orders = await db.order.findMany({
    where: {
      OR: [{ userId }, { buyerEmail: user.email.trim().toLowerCase() }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return orders.map((order) => ({
    id: order.id,
    status: order.status,
    planId: order.planId,
    planName: order.planName,
    amount: order.amount,
    currency: order.currency,
    buyerEmail: order.buyerEmail,
    yookassaId: order.yookassaId,
    createdAt: order.createdAt,
    user: order.user,
  }));
}
