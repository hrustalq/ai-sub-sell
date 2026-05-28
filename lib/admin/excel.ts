import "server-only";

import { format } from "date-fns";
import * as XLSX from "xlsx";
import { ORDER_STATUS_LABELS } from "@/lib/orders/constants";
import type { AdminPaymentRow, AdminUserRow } from "@/lib/admin/queries";
import type { AdminCounterpartyExportRow, AdminPlanExportRow } from "@/lib/admin/types";

function toWorkbookBuffer(sheetName: string, rows: Record<string, unknown>[]): ArrayBuffer {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

export function buildUsersWorkbook(users: AdminUserRow[]): ArrayBuffer {
  const rows = users.map((user) => ({
    ID: user.id,
    Имя: user.name,
    Email: user.email,
    "Email подтверждён": user.emailVerified ? "Да" : "Нет",
    Заказов: user.ordersCount,
    "Оплачено (₽)": user.paidTotal,
    "Дата регистрации": format(user.createdAt, "dd.MM.yyyy HH:mm"),
  }));

  return toWorkbookBuffer("Пользователи", rows);
}

export function buildPlansWorkbook(plans: AdminPlanExportRow[]): ArrayBuffer {
  const rows = plans.map((plan) => ({
    "ID тарифа": plan.id,
    Название: plan.name,
    "ID провайдера": plan.provider,
    Провайдер: plan.providerLabel,
    "Описание провайдера": plan.providerDescription,
    "Провайдер активен": plan.providerActive ? "Да" : "Нет",
    Тир: plan.tier,
    Опция: plan.tierLabel,
    Период: plan.period,
    "Длительность (мес.)": plan.durationMonths,
    Цена: plan.price,
    "Старая цена": plan.compareAtPrice ?? "",
    Валюта: plan.currency,
    Лимиты: plan.limits,
    Тег: plan.tag ?? "",
    Бейдж: plan.badge ?? "",
    Активен: plan.active ? "Да" : "Нет",
    Популярный: plan.highlight ? "Да" : "Нет",
    "Порядок сортировки": plan.sortOrder,
  }));

  return toWorkbookBuffer("Тарифы", rows);
}

export function buildCounterpartiesWorkbook(
  rows: AdminCounterpartyExportRow[],
): ArrayBuffer {
  const sheetRows = rows.map((row) => ({
    "ID контрагента": row.counterpartyId,
    "Название контрагента": row.name,
    Заметки: row.notes,
    "Контактное лицо": row.contactName,
    Email: row.contactEmail,
    Телефон: row.contactPhone,
    WeChat: row.wechatId,
    Магазин: row.shopUrl,
    "Контрагент активен": row.counterpartyActive ? "Да" : "Нет",
    "Порядок контрагента": row.counterpartySortOrder,
    "Дата создания": format(row.createdAt, "dd.MM.yyyy HH:mm"),
    "ID позиции": row.optionId ?? "",
    "Название позиции": row.optionLabel ?? "",
    Цена: row.optionPrice ?? "",
    Валюта: row.optionCurrency ?? "",
    "Заметки позиции": row.optionNotes ?? "",
    "Позиция активна":
      row.optionActive == null ? "" : row.optionActive ? "Да" : "Нет",
    "Порядок позиции": row.optionSortOrder ?? "",
  }));

  return toWorkbookBuffer("Контрагенты", sheetRows);
}

export function buildPaymentsWorkbook(payments: AdminPaymentRow[]): ArrayBuffer {
  const rows = payments.map((payment) => ({
    "ID заказа": payment.id,
    Тариф: payment.planName,
    "ID тарифа": payment.planId,
    "Имя клиента": payment.user?.name ?? "",
    "Email клиента": payment.user?.email ?? "",
    "Email покупателя": payment.buyerEmail,
    Сумма: payment.amount,
    Валюта: payment.currency,
    Статус: ORDER_STATUS_LABELS[payment.status] ?? payment.status,
    "YooKassa ID": payment.yookassaId ?? "",
    Дата: format(payment.createdAt, "dd.MM.yyyy HH:mm"),
  }));

  return toWorkbookBuffer("Платежи", rows);
}

export function excelResponse(buffer: ArrayBuffer, filename: string): Response {
  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
