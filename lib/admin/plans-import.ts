import "server-only";

import * as XLSX from "xlsx";
import db from "@/lib/db";
import { getAdminProviders } from "@/lib/admin/plans";
import { parsePlanInput, planToDbRecord, type PlanInput } from "@/lib/plans";

export const PLAN_IMPORT_SHEET_NAME = "Тарифы";
export const PLAN_IMPORT_INSTRUCTIONS_SHEET = "Инструкция";

export const PLAN_IMPORT_COLUMNS = [
  "ID тарифа",
  "Название",
  "ID провайдера",
  "Тир",
  "Опция",
  "Период",
  "Длительность (мес.)",
  "Цена",
  "Старая цена",
  "Валюта",
  "Лимиты",
  "Тег",
  "Бейдж",
  "Активен",
  "Популярный",
  "Порядок сортировки",
] as const;

const HEADER_ALIASES: Record<string, (typeof PLAN_IMPORT_COLUMNS)[number]> = {
  "id тарифа": "ID тарифа",
  "id": "ID тарифа",
  название: "Название",
  name: "Название",
  "id провайдера": "ID провайдера",
  провайдер: "ID провайдера",
  provider: "ID провайдера",
  тир: "Тир",
  tier: "Тир",
  опция: "Опция",
  tierlabel: "Опция",
  период: "Период",
  period: "Период",
  "длительность (мес.)": "Длительность (мес.)",
  "длительность": "Длительность (мес.)",
  durationmonths: "Длительность (мес.)",
  цена: "Цена",
  price: "Цена",
  "старая цена": "Старая цена",
  compareatprice: "Старая цена",
  валюта: "Валюта",
  currency: "Валюта",
  лимиты: "Лимиты",
  limits: "Лимиты",
  тег: "Тег",
  tag: "Тег",
  бейдж: "Бейдж",
  badge: "Бейдж",
  активен: "Активен",
  active: "Активен",
  популярный: "Популярный",
  highlight: "Популярный",
  "порядок сортировки": "Порядок сортировки",
  sortorder: "Порядок сортировки",
};

export type PlanImportRowResult = {
  rowNumber: number;
  planId: string | null;
  name: string | null;
  valid: boolean;
  errors: string[];
  warnings: string[];
  input?: PlanInput;
};

export type PlanImportValidationResult = {
  rows: PlanImportRowResult[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    skipped: number;
  };
  sheetError?: string;
};

export type PlanImportExecutionResult = {
  created: number;
  updated: number;
  failed: { id: string; error: string }[];
};

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function resolveHeader(
  raw: string,
): (typeof PLAN_IMPORT_COLUMNS)[number] | null {
  const normalized = normalizeHeader(raw);
  if (!normalized) return null;
  if (HEADER_ALIASES[normalized]) return HEADER_ALIASES[normalized];
  const direct = PLAN_IMPORT_COLUMNS.find(
    (column) => normalizeHeader(column) === normalized,
  );
  return direct ?? null;
}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

type ParseFieldError = { error: string };

function isParseFieldError<T>(
  result: T | ParseFieldError,
): result is ParseFieldError {
  return typeof result === "object" && result !== null && "error" in result;
}

function parseBooleanCell(
  value: unknown,
  fieldLabel: string,
): boolean | null | ParseFieldError {
  const raw = cellToString(value);
  if (!raw) return null;
  const normalized = raw.toLowerCase();
  if (["да", "yes", "y", "1", "true", "истина"].includes(normalized)) {
    return true;
  }
  if (["нет", "no", "n", "0", "false", "ложь"].includes(normalized)) {
    return false;
  }
  return {
    error: `${fieldLabel}: укажите «Да» или «Нет» (получено: «${raw}»)`,
  };
}

function parseOptionalPositiveNumber(
  value: unknown,
  fieldLabel: string,
): number | null | ParseFieldError {
  const raw = cellToString(value);
  if (!raw) return null;
  const parsed = Number(raw.replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(parsed)) {
    return {
      error: `${fieldLabel}: укажите число (например, 1990)`,
    };
  }
  if (parsed <= 0) {
    return {
      error: `${fieldLabel}: должно быть больше нуля`,
    };
  }
  return parsed;
}

function parseRequiredPositiveNumber(
  value: unknown,
  fieldLabel: string,
): number | ParseFieldError {
  const raw = cellToString(value);
  if (!raw) {
    return { error: `${fieldLabel}: обязательное поле` };
  }
  const result = parseOptionalPositiveNumber(value, fieldLabel);
  if (isParseFieldError(result)) return result;
  if (result === null) {
    return { error: `${fieldLabel}: обязательное поле` };
  }
  return result;
}

function parseOptionalNonNegativeInt(
  value: unknown,
  fieldLabel: string,
  defaultValue: number,
): number | ParseFieldError {
  const raw = cellToString(value);
  if (!raw) return defaultValue;
  const parsed = Number(raw.replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(parsed)) {
    return {
      error: `${fieldLabel}: укажите целое число (например, 1)`,
    };
  }
  if (parsed < 0) {
    return {
      error: `${fieldLabel}: не может быть отрицательным`,
    };
  }
  return Math.round(parsed);
}

function mapPlanInputError(message: string): string {
  const fieldMessages: Record<string, string> = {
    "Укажите название тарифа": "Название: укажите название тарифа",
    "Укажите провайдера": "ID провайдера: укажите существующий ID провайдера",
    "Укажите опцию (tier)": "Тир: укажите код опции (латиница, например pro)",
    "Укажите название опции": "Опция: укажите отображаемое название опции",
    "Укажите корректную цену": "Цена: укажите положительное число",
    "Укажите корректный порядок сортировки":
      "Порядок сортировки: укажите целое число",
    "Укажите корректный срок (в месяцах)":
      "Длительность (мес.): укажите число месяцев (0 или больше)",
    "Старая цена должна быть положительным числом":
      "Старая цена: укажите положительное число или оставьте пустым",
    "Добавьте хотя бы один лимит":
      "Лимиты: укажите хотя бы один пункт (через «;» или с новой строки)",
    "ID тарифа: латиница, цифры, дефис или подчёркивание (2–49 символов)":
      "ID тарифа: только латиница, цифры, дефис и подчёркивание (2–49 символов)",
  };
  return fieldMessages[message] ?? message;
}

function rowIsEmpty(record: Record<string, unknown>): boolean {
  return Object.values(record).every(
    (value) => value === null || value === undefined || cellToString(value) === "",
  );
}

function mapRecordToPlanBody(
  record: Record<string, unknown>,
): Record<string, unknown> {
  return {
    id: record["ID тарифа"],
    name: record["Название"],
    provider: record["ID провайдера"],
    tier: record["Тир"],
    tierLabel: record["Опция"],
    period: record["Период"],
    durationMonths: record["Длительность (мес.)"],
    price: record["Цена"],
    compareAtPrice: record["Старая цена"],
    currency: record["Валюта"],
    limits: record["Лимиты"],
    tag: record["Тег"],
    badge: record["Бейдж"],
    highlight: record["Популярный"],
    active: record["Активен"],
    sortOrder: record["Порядок сортировки"],
  };
}

function getPlansSheet(workbook: XLSX.WorkBook): XLSX.WorkSheet | null {
  if (workbook.SheetNames.includes(PLAN_IMPORT_SHEET_NAME)) {
    return workbook.Sheets[PLAN_IMPORT_SHEET_NAME] ?? null;
  }
  const fallbackName = workbook.SheetNames.find(
    (name) => name !== PLAN_IMPORT_INSTRUCTIONS_SHEET,
  );
  if (!fallbackName) return null;
  return workbook.Sheets[fallbackName] ?? null;
}

export function parsePlansImportWorkbook(
  buffer: ArrayBuffer,
): { records: Record<string, unknown>[]; sheetError?: string } {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = getPlansSheet(workbook);
  if (!sheet) {
    return { records: [], sheetError: `Лист «${PLAN_IMPORT_SHEET_NAME}» не найден` };
  }

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as unknown[][];

  if (matrix.length === 0) {
    return { records: [], sheetError: "Файл пустой" };
  }

  const headerRow = matrix[0] ?? [];
  const columnKeys: ((typeof PLAN_IMPORT_COLUMNS)[number] | null)[] = headerRow.map(
    (cell) => resolveHeader(cellToString(cell)),
  );

  const recognized = columnKeys.filter(Boolean);
  if (recognized.length === 0) {
    return {
      records: [],
      sheetError:
        "Не распознаны заголовки колонок. Скачайте шаблон и заполните лист «Тарифы».",
    };
  }

  const requiredHeaders: (typeof PLAN_IMPORT_COLUMNS)[number][] = [
    "ID тарифа",
    "Название",
    "ID провайдера",
    "Тир",
    "Опция",
    "Цена",
    "Лимиты",
  ];
  const missingRequired = requiredHeaders.filter(
    (header) => !columnKeys.includes(header),
  );
  if (missingRequired.length > 0) {
    return {
      records: [],
      sheetError: `Отсутствуют обязательные колонки: ${missingRequired.join(", ")}`,
    };
  }

  const records: Record<string, unknown>[] = [];
  for (let rowIndex = 1; rowIndex < matrix.length; rowIndex++) {
    const row = matrix[rowIndex] ?? [];
    const record: Record<string, unknown> = {};
    for (let colIndex = 0; colIndex < columnKeys.length; colIndex++) {
      const key = columnKeys[colIndex];
      if (!key) continue;
      record[key] = row[colIndex] ?? "";
    }
    if (!rowIsEmpty(record)) {
      records.push(record);
    }
  }

  return { records };
}

export async function validatePlansImport(
  buffer: ArrayBuffer,
): Promise<PlanImportValidationResult> {
  const { records, sheetError } = parsePlansImportWorkbook(buffer);
  if (sheetError) {
    return {
      rows: [],
      summary: { total: 0, valid: 0, invalid: 0, skipped: 0 },
      sheetError,
    };
  }

  const providers = await getAdminProviders();
  const providerIds = new Set(providers.map((provider) => provider.id));
  const existingPlans = await db.plan.findMany({ select: { id: true } });
  const existingIds = new Set(existingPlans.map((plan) => plan.id));
  const seenIds = new Set<string>();

  const rows: PlanImportRowResult[] = [];

  for (let index = 0; index < records.length; index++) {
    const record = records[index]!;
    const rowNumber = index + 2;
    const errors: string[] = [];
    const warnings: string[] = [];

    const planIdRaw = cellToString(record["ID тарифа"]);
    const planId = planIdRaw ? planIdRaw.toLowerCase() : null;
    const name = cellToString(record["Название"]) || null;

    if (!planIdRaw) {
      errors.push("ID тарифа: обязательное поле");
    }

    const priceParsed = parseRequiredPositiveNumber(record["Цена"], "Цена");
    if (isParseFieldError(priceParsed)) errors.push(priceParsed.error);

    const compareParsed = parseOptionalPositiveNumber(
      record["Старая цена"],
      "Старая цена",
    );
    if (isParseFieldError(compareParsed)) errors.push(compareParsed.error);

    const durationParsed = parseOptionalNonNegativeInt(
      record["Длительность (мес.)"],
      "Длительность (мес.)",
      1,
    );
    if (isParseFieldError(durationParsed)) errors.push(durationParsed.error);

    const sortOrderParsed = parseOptionalNonNegativeInt(
      record["Порядок сортировки"],
      "Порядок сортировки",
      0,
    );
    if (isParseFieldError(sortOrderParsed)) errors.push(sortOrderParsed.error);

    const activeParsed = parseBooleanCell(record["Активен"], "Активен");
    if (isParseFieldError(activeParsed)) errors.push(activeParsed.error);

    const highlightParsed = parseBooleanCell(record["Популярный"], "Популярный");
    if (isParseFieldError(highlightParsed)) errors.push(highlightParsed.error);

    const limitsRaw = cellToString(record["Лимиты"]);
    const limitsList = limitsRaw
      ? limitsRaw
          .split(/[;\n]+/)
          .map((item) => item.trim())
          .filter(Boolean)
      : [];
    if (limitsList.length === 0) {
      errors.push(
        "Лимиты: укажите хотя бы один пункт (через «;» или с новой строки в ячейке)",
      );
    }

    const body = mapRecordToPlanBody(record);
    if (limitsList.length > 0) body.limits = limitsList;
    if (typeof activeParsed === "boolean") body.active = activeParsed;
    if (typeof highlightParsed === "boolean") body.highlight = highlightParsed;
    if (typeof compareParsed === "number") body.compareAtPrice = compareParsed;
    if (!isParseFieldError(priceParsed)) body.price = priceParsed;
    if (!isParseFieldError(durationParsed)) body.durationMonths = durationParsed;
    if (!isParseFieldError(sortOrderParsed)) body.sortOrder = sortOrderParsed;

    const parsed = parsePlanInput(body);
    if ("error" in parsed) {
      errors.push(mapPlanInputError(parsed.error));
    } else {
      if (!providerIds.has(parsed.provider)) {
        errors.push(
          `Провайдер «${parsed.provider}» не найден. Доступны: ${[...providerIds].join(", ")}`,
        );
      }

      if (parsed.id) {
        if (seenIds.has(parsed.id)) {
          errors.push(`Дубликат ID «${parsed.id}» в файле`);
        } else {
          seenIds.add(parsed.id);
        }
        if (existingIds.has(parsed.id)) {
          warnings.push(`Тариф «${parsed.id}» уже существует — будет обновлён при импорте`);
        }
      }
    }

    const parsedOk = !("error" in parsed);
    const valid = errors.length === 0 && parsedOk;
    rows.push({
      rowNumber,
      planId: planId ?? (valid && parsedOk ? (parsed.id ?? null) : null),
      name: name ?? (valid && parsedOk ? parsed.name : null),
      valid,
      errors,
      warnings,
      input: valid && parsedOk ? parsed : undefined,
    });
  }

  const valid = rows.filter((row) => row.valid).length;
  return {
    rows,
    summary: {
      total: rows.length,
      valid,
      invalid: rows.length - valid,
      skipped: 0,
    },
  };
}

export function buildPlansImportTemplate(providerIds: string[]): ArrayBuffer {
  const workbook = XLSX.utils.book_new();

  const instructions: string[][] = [
    ["Импорт тарифов"],
    [""],
    ["1. Заполните лист «Тарифы». Строку-пример можно удалить."],
    ["2. Обязательные поля: ID тарифа, Название, ID провайдера, Тир, Опция, Цена, Лимиты"],
    ["3. Лимиты — через точку с запятой (;) или с новой строки в одной ячейке"],
    ["4. Активен / Популярный — «Да» или «Нет» (пусто = Да для активен, Нет для популярный)"],
    ["5. ID тарифа: латиница, цифры, дефис, подчёркивание (2–49 символов)"],
    ["6. Существующие ID будут обновлены при импорте"],
    [""],
    ["Доступные ID провайдеров:"],
    [providerIds.join(", ")],
  ];
  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions);
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, PLAN_IMPORT_INSTRUCTIONS_SHEET);

  const exampleRow: Record<string, string | number> = {
    "ID тарифа": "codex_pro_1m",
    Название: "Codex Pro",
    "ID провайдера": providerIds[0] ?? "codex",
    Тир: "pro",
    Опция: "Pro",
    Период: "1 месяц",
    "Длительность (мес.)": 1,
    Цена: 1990,
    "Старая цена": "",
    Валюта: "RUB",
    Лимиты: "Безлимитные запросы; Приоритетная очередь",
    Тег: "",
    Бейдж: "",
    Активен: "Да",
    Популярный: "Нет",
    "Порядок сортировки": 0,
  };

  const plansSheet = XLSX.utils.json_to_sheet([exampleRow], {
    header: [...PLAN_IMPORT_COLUMNS],
  });
  XLSX.utils.book_append_sheet(workbook, plansSheet, PLAN_IMPORT_SHEET_NAME);

  return XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

function toPlanData(input: PlanInput) {
  return {
    id: input.id!,
    name: input.name,
    price: input.price,
    currency: input.currency,
    period: input.period,
    limits: input.limits,
    tag: input.tag,
    badge: input.badge,
    highlight: input.highlight,
    active: input.active,
    sortOrder: input.sortOrder,
    provider: input.provider,
    tier: input.tier,
    tierLabel: input.tierLabel,
    durationMonths: input.durationMonths,
    compareAtPrice: input.compareAtPrice,
  };
}

export async function executePlansImport(
  inputs: PlanInput[],
): Promise<PlanImportExecutionResult> {
  const result: PlanImportExecutionResult = {
    created: 0,
    updated: 0,
    failed: [],
  };

  for (const input of inputs) {
    if (!input.id) {
      result.failed.push({ id: "—", error: "Отсутствует ID тарифа" });
      continue;
    }

    try {
      const provider = await db.planProvider.findUnique({
        where: { id: input.provider },
      });
      if (!provider) {
        result.failed.push({
          id: input.id,
          error: `Провайдер «${input.provider}» не найден`,
        });
        continue;
      }

      const data = planToDbRecord(toPlanData(input));
      const existing = await db.plan.findUnique({ where: { id: input.id } });

      if (existing) {
        const { id: planId, ...updateData } = data;
        await db.plan.update({ where: { id: planId }, data: updateData });
        result.updated += 1;
      } else {
        await db.plan.create({ data });
        result.created += 1;
      }
    } catch {
      result.failed.push({
        id: input.id,
        error: "Не удалось сохранить тариф",
      });
    }
  }

  return result;
}
