import "server-only";

export type PlansExportParams = {
  limit: number | "all";
  providerIds?: string[];
};

export function parsePlansExportParams(
  searchParams: URLSearchParams,
): PlansExportParams | "invalid" {
  const limitRaw = searchParams.get("limit") ?? "all";
  let limit: number | "all" = "all";

  if (limitRaw !== "all") {
    const parsed = Number(limitRaw);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 10_000) {
      return "invalid";
    }
    limit = Math.floor(parsed);
  }

  const providerRaws = searchParams.getAll("provider");
  if (providerRaws.length === 0) {
    return { limit, providerIds: undefined };
  }

  const providerIds = [
    ...new Set(
      providerRaws.map((value) => value.trim()).filter((value) => value.length > 0),
    ),
  ];

  if (providerIds.length === 0) {
    return "invalid";
  }

  return { limit, providerIds };
}
