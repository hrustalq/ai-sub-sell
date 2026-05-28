import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/brand";
import { themeColors } from "@/lib/theme-colors";

type BrandImageProps = {
  width: number;
  height: number;
  compact?: boolean;
};

export function BrandImage({ width, height, compact = false }: BrandImageProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: compact ? "center" : "flex-start",
        justifyContent: "center",
        background: `linear-gradient(135deg, ${themeColors.foreground} 0%, ${themeColors.primary} 100%)`,
        color: themeColors.primaryForeground,
        padding: compact ? 0 : Math.round(width * 0.08),
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          fontSize: compact ? Math.round(height * 0.42) : Math.round(height * 0.14),
          fontWeight: 700,
          letterSpacing: "-0.04em",
          lineHeight: 1,
        }}
      >
        <span>ai-</span>
        <span style={{ color: themeColors.ring }}>sub</span>
      </div>
      {!compact ? (
        <p
          style={{
            marginTop: Math.round(height * 0.04),
            maxWidth: "88%",
            fontSize: Math.round(height * 0.055),
            lineHeight: 1.35,
            color: themeColors.chart1,
            fontWeight: 400,
          }}
        >
          {SITE_DESCRIPTION}
        </p>
      ) : null}
      {!compact ? (
        <p
          style={{
            marginTop: "auto",
            fontSize: Math.round(height * 0.04),
            color: themeColors.mutedForeground,
          }}
        >
          {SITE_NAME}
        </p>
      ) : null}
    </div>
  );
}
