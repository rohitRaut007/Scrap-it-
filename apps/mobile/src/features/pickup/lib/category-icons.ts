import { Ionicons } from "@expo/vector-icons";

const MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
    metal: "hardware-chip-outline",
    paper: "document-text-outline",
    plastic: "water-outline",
    electronics: "phone-portrait-outline",
    appliances: "tv-outline",
    glass: "wine-outline",
};

/** Mirrors home grid mapping for consistent category iconography. */
export function categoryIonicon(
  iconKey: string,
): keyof typeof Ionicons.glyphMap {
  return MAP[iconKey] ?? "cube-outline";
}
