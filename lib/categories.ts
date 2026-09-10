export type CategoryType = "income" | "expense";

export interface CategoryPreset {
  slug: string;
  name: string;
  type: CategoryType;
  emoji: string;
  color: string;
  is_system?: boolean;
}

export const DEFAULT_CATEGORY_PRESETS: CategoryPreset[] = [
  { slug: "salary", name: "Gaji", type: "income", emoji: "💰", color: "#10b981", is_system: true },
  { slug: "freelance", name: "Freelance", type: "income", emoji: "💼", color: "#8b5cf6", is_system: true },
  { slug: "investment", name: "Investasi", type: "income", emoji: "📈", color: "#06b6d4", is_system: true },
  { slug: "other", name: "Lainnya", type: "income", emoji: "📦", color: "#94a3b8", is_system: true },
  { slug: "food", name: "Makanan", type: "expense", emoji: "🍔", color: "#10b981", is_system: true },
  { slug: "transport", name: "Transportasi", type: "expense", emoji: "🚗", color: "#6366f1", is_system: true },
  { slug: "shopping", name: "Belanja", type: "expense", emoji: "🛍️", color: "#f59e0b", is_system: true },
  { slug: "bills", name: "Tagihan", type: "expense", emoji: "📄", color: "#3b82f6", is_system: true },
  { slug: "entertainment", name: "Hiburan", type: "expense", emoji: "🎮", color: "#ec4899", is_system: true },
  { slug: "health", name: "Kesehatan", type: "expense", emoji: "💊", color: "#14b8a6", is_system: true },
  { slug: "other", name: "Lainnya", type: "expense", emoji: "📦", color: "#94a3b8", is_system: true },
];

export const TRANSFER_CATEGORY_META = {
  slug: "transfer",
  name: "Transfer Antar Rekening",
  type: "expense" as const,
  emoji: "🔄",
  color: "#0f766e",
};

export function getDefaultCategoryPreset(slug: string, type?: CategoryType) {
  return (
    DEFAULT_CATEGORY_PRESETS.find((preset) => preset.slug === slug && (!type || preset.type === type)) ||
    DEFAULT_CATEGORY_PRESETS.find((preset) => preset.slug === slug) ||
    null
  );
}

export function getFallbackCategoryMeta(
  slug: string,
  type?: CategoryType
): { slug: string; name: string; type: CategoryType; emoji: string; color: string } {
  if (slug === TRANSFER_CATEGORY_META.slug) {
    return TRANSFER_CATEGORY_META;
  }

  const preset = getDefaultCategoryPreset(slug, type);
  if (preset) {
    return {
      slug: preset.slug,
      name: preset.name,
      type: preset.type,
      emoji: preset.emoji,
      color: preset.color,
    };
  }

  const formattedName = slug
    ? slug
        .split(/[-_]+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "Lainnya";

  return {
    slug: slug || "other",
    name: formattedName,
    type: type || "expense",
    emoji: "🏷️",
    color: "#94a3b8",
  };
}
