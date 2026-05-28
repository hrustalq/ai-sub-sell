import { getPricingCatalog } from "@/lib/plans/pricing-catalog";
import { PricingSection } from "@/components/plans/pricing-section";

export async function PricingIsland() {
  const catalog = await getPricingCatalog();
  return <PricingSection catalog={catalog} />;
}
