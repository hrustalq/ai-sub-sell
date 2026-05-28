import "server-only";

import * as XLSX from "xlsx";
import db from "@/lib/db";
import {
  createCounterparty,
  updateCounterparty,
} from "@/lib/counterparties/repository";
import {
  parseCounterpartyInput,
  type CounterpartyInput,
} from "@/lib/counterparties/validation";

export const COUNTERPARTY_IMPORT_SHEET_NAME = "Контрагенты";
export const COUNTERPARTY_IMPORT_INSTRUCTIONS_SHEET = "Инструкция";

export const COUNTERPARTY_IMPORT_COLUMNS = [
  "ID контрагента",
  "Название контрагента",
  "Заметки",
  "Контактное лицо",
  "Email",
  "Телефон",
  "WeChat",
  "Магазин",
  "Контрагент активен",
  "Порядок контрагента",
  "ID позиции",
  "Название позиции",
  "Цена",
  "Валюта",
  "Заметки позиции",
  "Позиция активна",
  "Порядок позиции",
] as const;

const HEADER_ALIASES: Record<string, (typeof COUNTERPARTY_IMPORT_COLUMNS)[number]> = {
  "id контрагента": "ID контрагента",
  "id": "ID контрагента",
  "название контрагента": "Название контрагента",
  название: "Название контрагента",
  name: "Название контрагента",
  заметки: "Заметки",
  notes: "Заметки",
  "контактное лицо": "Контактное лицо",
  contactname: "Контактное лицо",
  email: "Email",
  телефон: "Телефон",
  phone: "Телефон",
  contactphone: "Телефон",
  wechat: "WeChat",
  wechatid: "WeChat",
  магазин: "Магазин",
  shopurl: "Магазин",
  "контрагент активен": "Контрагент активен",
  active: "Контрагент активен",
  "порядок контрагента": "Порядок контрагента",
  sortorder: "Порядок контрагента",
  "id позиции": "ID позиции",
  optionid: "ID позиции",
  "название позиции": "Название позиции",
  optionlabel: "Название позиции",
  цена: "Цена",
  price: "Цена",
  валюта: "Валюта",
  currency: "Валюта",
  "заметки позиции": "Заметки позиции",
  optionnotes: "Заметки позиции",
  "позиция активна": "Позиция активна",
  optionactive: "Позиция активна",
  "порядок позиции": "Порядок позиции",
  optionsortorder: "Порядок позиции",
};

export type CounterpartyImportRowResult = {
  rowNumber: number;
  counterpartyId: string | null;
  name: string | null;
  valid: boolean;
  errors: string[];
  warnings: string[];
  input?: CounterpartyInput;
};

export type CounterpartyImportValidationResult = {
  rows: CounterpartyImportRowResult[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    skipped: number;
  };
  sheetError?: string;
};

export type CounterpartyImportExecutionResult = {
  created: number;
  updated: number;
  failed: { id: string; error: string }[];
};

type ParsedCounterpartyGroup = {
  key: string;
  rowNumbers: number[];
  counterpartyId: string | null;
  name: string;
  notes: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  wechatId: string;
  shopUrl: string;
  active: boolean;
  sortOrder: number;
  pricingOptions: CounterpartyInput["pricingOptions"];
  errors: string[];
  warnings: string[];
};

type ParseFieldError = { error: string };

function isParseFieldError<T>(result: T | ParseFieldError): result is ParseFieldError {
  return typeof result === "object" && result !== null && "error" in result;
}

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function resolveHeader(
  raw: string,
): (typeof COUNTERPARTY_IMPORT_COLUMNS)[number] | null {
  const normalized = normalizeHeader(raw);
  if (!normalized) return null;
  if (HEADER_ALIASES[normalized]) return HEADER_ALIASES[normalized];
  const direct = COUNTERPARTY_IMPORT_COLUMNS.find(
    (column) => normalizeHeader(column) === normalized,
  );
  return direct ?? null;
}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
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

function parseOptionalNonNegativeNumber(
  value: unknown,
  fieldLabel: string,
): number | null | ParseFieldError {
  const raw = cellToString(value);
  if (!raw) return null;
  const parsed = Number(raw.replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { error: `${fieldLabel}: укажите число больше или равное нулю` };
  }
  return parsed;
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
    return { error: `${fieldLabel}: укажите целое число` };
  }
  if (parsed < 0) {
    return { error: `${fieldLabel}: не может быть отрицательным` };
  }
  return Math.round(parsed);
}

function rowIsEmpty(record: Record<string, unknown>): boolean {
  return Object.values(record).every(
    (value) => value === null || value === undefined || cellToString(value) === "",
  );
}

function getCounterpartySheet(workbook: XLSX.WorkBook): XLSX.WorkSheet | null {
  if (workbook.SheetNames.includes(COUNTERPARTY_IMPORT_SHEET_NAME)) {
    return workbook.Sheets[COUNTERPARTY_IMPORT_SHEET_NAME] ?? null;
  }
  const fallbackName = workbook.SheetNames.find(
    (name) => name !== COUNTERPARTY_IMPORT_INSTRUCTIONS_SHEET,
  );
  if (!fallbackName) return null;
  return workbook.Sheets[fallbackName] ?? null;
}

export function parseCounterpartiesImportWorkbook(
  buffer: ArrayBuffer,
): { records: Record<string, unknown>[]; sheetError?: string } {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = getCounterpartySheet(workbook);
  if (!sheet) {
    return {
      records: [],
      sheetError: `Лист «${COUNTERPARTY_IMPORT_SHEET_NAME}» не найден`,
    };
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
  const columnKeys: ((typeof COUNTERPARTY_IMPORT_COLUMNS)[number] | null)[] =
    headerRow.map((cell) => resolveHeader(cellToString(cell)));

  const recognized = columnKeys.filter(Boolean);
  if (recognized.length === 0) {
    return {
      records: [],
      sheetError:
        "Не распознаны заголовки колонок. Скачайте шаблон и заполните лист «Контрагенты».",
    };
  }

  const requiredHeaders: (typeof COUNTERPARTY_IMPORT_COLUMNS)[number][] = [
    "Название контрагента",
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

function groupKey(counterpartyId: string | null, name: string): string {
  if (counterpartyId) return `id:${counterpartyId}`;
  return `name:${name.toLowerCase()}`;
}

function buildGroupFromRecord(
  record: Record<string, unknown>,
  rowNumber: number,
): ParsedCounterpartyGroup | { error: string } {
  const counterpartyIdRaw = cellToString(record["ID контрагента"]);
  const counterpartyId = counterpartyIdRaw || null;
  const name = cellToString(record["Название контрагента"]);

  if (!name) {
    return { error: `Строка ${rowNumber}: укажите название контрагента` };
  }

  const activeParsed = parseBooleanCell(record["Контрагент активен"], "Контрагент активен");
  if (isParseFieldError(activeParsed)) return { error: activeParsed.error };

  const sortOrderParsed = parseOptionalNonNegativeInt(
    record["Порядок контрагента"],
    "Порядок контрагента",
    0,
  );
  if (isParseFieldError(sortOrderParsed)) return { error: sortOrderParsed.error };

  const optionLabel = cellToString(record["Название позиции"]);
  const pricingOptions: CounterpartyInput["pricingOptions"] = [];

  if (optionLabel) {
    const priceParsed = parseOptionalNonNegativeNumber(record["Цена"], "Цена");
    if (isParseFieldError(priceParsed)) return { error: priceParsed.error };
    if (priceParsed === null) {
      return { error: `Строка ${rowNumber}: укажите цену для позиции «${optionLabel}»` };
    }

    const optionActiveParsed = parseBooleanCell(record["Позиция активна"], "Позиция активна");
    if (isParseFieldError(optionActiveParsed)) return { error: optionActiveParsed.error };

    const optionSortOrderParsed = parseOptionalNonNegativeInt(
      record["Порядок позиции"],
      "Порядок позиции",
      pricingOptions.length,
    );
    if (isParseFieldError(optionSortOrderParsed)) return { error: optionSortOrderParsed.error };

    const optionIdRaw = cellToString(record["ID позиции"]);
    pricingOptions.push({
      ...(optionIdRaw ? { id: optionIdRaw } : {}),
      label: optionLabel,
      price: priceParsed,
      currency: cellToString(record["Валюта"]) || "CNY",
      notes: cellToString(record["Заметки позиции"]),
      sortOrder: optionSortOrderParsed,
      active: optionActiveParsed !== false,
    });
  }

  return {
    key: groupKey(counterpartyId, name),
    rowNumbers: [rowNumber],
    counterpartyId,
    name,
    notes: cellToString(record["Заметки"]),
    contactName: cellToString(record["Контактное лицо"]),
    contactEmail: cellToString(record["Email"]),
    contactPhone: cellToString(record["Телефон"]),
    wechatId: cellToString(record["WeChat"]),
    shopUrl: cellToString(record["Магазин"]),
    active: activeParsed !== false,
    sortOrder: sortOrderParsed,
    pricingOptions,
    errors: [],
    warnings: [],
  };
}

function mergeGroup(
  existing: ParsedCounterpartyGroup,
  incoming: ParsedCounterpartyGroup,
): ParsedCounterpartyGroup {
  const fields: (keyof ParsedCounterpartyGroup)[] = [
    "name",
    "notes",
    "contactName",
    "contactEmail",
    "contactPhone",
    "wechatId",
    "shopUrl",
  ];

  for (const field of fields) {
    const current = existing[field];
    const next = incoming[field];
    if (current && next && current !== next) {
      existing.errors.push(
        `Строка ${incoming.rowNumbers[0]}: поле «${field}» не совпадает с предыдущими строками контрагента`,
      );
    } else if (!current && next) {
      (existing as Record<string, unknown>)[field] = next;
    }
  }

  if (
    existing.counterpartyId &&
    incoming.counterpartyId &&
    existing.counterpartyId !== incoming.counterpartyId
  ) {
    existing.errors.push(
      `Строка ${incoming.rowNumbers[0]}: разные ID контрагента в одной группе`,
    );
  } else if (!existing.counterpartyId && incoming.counterpartyId) {
    existing.counterpartyId = incoming.counterpartyId;
    existing.key = groupKey(incoming.counterpartyId, existing.name);
  }

  existing.rowNumbers.push(...incoming.rowNumbers);
  existing.pricingOptions.push(...incoming.pricingOptions);
  return existing;
}

export async function validateCounterpartiesImport(
  buffer: ArrayBuffer,
): Promise<CounterpartyImportValidationResult> {
  const { records, sheetError } = parseCounterpartiesImportWorkbook(buffer);
  if (sheetError) {
    return {
      rows: [],
      summary: { total: 0, valid: 0, invalid: 0, skipped: 0 },
      sheetError,
    };
  }

  const existingCounterparties = await db.counterparty.findMany({
    select: { id: true },
  });
  const existingIds = new Set(existingCounterparties.map((row) => row.id));
  const groups = new Map<string, ParsedCounterpartyGroup>();

  for (let index = 0; index < records.length; index++) {
    const record = records[index]!;
    const rowNumber = index + 2;
    const built = buildGroupFromRecord(record, rowNumber);
    if ("error" in built) {
      return {
        rows: [
          {
            rowNumber,
            counterpartyId: cellToString(record["ID контрагента"]) || null,
            name: cellToString(record["Название контрагента"]) || null,
            valid: false,
            errors: [built.error],
            warnings: [],
          },
        ],
        summary: { total: 1, valid: 0, invalid: 1, skipped: records.length - 1 },
      };
    }

    const current = groups.get(built.key);
    if (current) {
      groups.set(built.key, mergeGroup(current, built));
    } else {
      groups.set(built.key, built);
    }
  }

  const rows: CounterpartyImportRowResult[] = [];

  for (const group of groups.values()) {
    const body = {
      ...(group.counterpartyId ? { id: group.counterpartyId } : {}),
      name: group.name,
      notes: group.notes,
      contactName: group.contactName,
      contactEmail: group.contactEmail,
      contactPhone: group.contactPhone,
      wechatId: group.wechatId,
      shopUrl: group.shopUrl,
      active: group.active,
      sortOrder: group.sortOrder,
      pricingOptions: group.pricingOptions,
    };

    const parsed = parseCounterpartyInput(body);
    const errors = [...group.errors];
    const warnings = [...group.warnings];

    if ("error" in parsed) {
      errors.push(parsed.error);
    } else if (parsed.id && existingIds.has(parsed.id)) {
      warnings.push(`Контрагент «${parsed.id}» уже существует — будет обновлён при импорте`);
    } else if (!parsed.id) {
      warnings.push("ID не указан — будет создан новый контрагент");
    }

    const valid = errors.length === 0 && !("error" in parsed);
    rows.push({
      rowNumber: group.rowNumbers[0]!,
      counterpartyId: group.counterpartyId,
      name: group.name,
      valid,
      errors,
      warnings,
      input: valid && !("error" in parsed) ? parsed : undefined,
    });
  }

  rows.sort((a, b) => a.rowNumber - b.rowNumber);
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

export function buildCounterpartiesImportTemplate(): ArrayBuffer {
  const workbook = XLSX.utils.book_new();

  const instructions: string[][] = [
    ["Импорт контрагентов"],
    [""],
    ["1. Заполните лист «Контрагенты». Строку-пример можно удалить."],
    ["2. Одна строка = одна закупочная позиция. Поля контрагента повторяются в каждой строке."],
    ["3. Обязательное поле: Название контрагента."],
    ["4. Если указано Название позиции — обязательна Цена."],
    ["5. ID контрагента / ID позиции можно оставить пустыми для новых записей."],
    ["6. Существующие ID будут обновлены при импорте."],
    ["7. Да/Нет — для полей активности (пусто = Да)."],
  ];
  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions);
  XLSX.utils.book_append_sheet(
    workbook,
    instructionsSheet,
    COUNTERPARTY_IMPORT_INSTRUCTIONS_SHEET,
  );

  const exampleRow: Record<string, string | number> = {
    "ID контрагента": "",
    "Название контрагента": "Taobao Shop — AI accounts",
    Заметки: "Основной поставщик ChatGPT",
    "Контактное лицо": "Zhang Wei",
    Email: "supplier@example.com",
    Телефон: "+86 138 0000 0000",
    WeChat: "wxid_example",
    Магазин: "https://shop.taobao.com/example",
    "Контрагент активен": "Да",
    "Порядок контрагента": 0,
    "ID позиции": "",
    "Название позиции": "ChatGPT Plus — 1 месяц",
    Цена: 68,
    Валюта: "CNY",
    "Заметки позиции": "Выдача в течение 24 часов",
    "Позиция активна": "Да",
    "Порядок позиции": 0,
  };

  const sheet = XLSX.utils.json_to_sheet([exampleRow], {
    header: [...COUNTERPARTY_IMPORT_COLUMNS],
  });
  XLSX.utils.book_append_sheet(workbook, sheet, COUNTERPARTY_IMPORT_SHEET_NAME);

  return XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

export async function executeCounterpartiesImport(
  inputs: CounterpartyInput[],
): Promise<CounterpartyImportExecutionResult> {
  const result: CounterpartyImportExecutionResult = {
    created: 0,
    updated: 0,
    failed: [],
  };

  for (const input of inputs) {
    try {
      if (input.id) {
        const existing = await db.counterparty.findUnique({ where: { id: input.id } });
        if (existing) {
          await updateCounterparty(input.id, input);
          result.updated += 1;
          continue;
        }
      }

      await createCounterparty(input);
      result.created += 1;
    } catch {
      result.failed.push({
        id: input.id ?? input.name,
        error: "Не удалось сохранить контрагента",
      });
    }
  }

  return result;
}
