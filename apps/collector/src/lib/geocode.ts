export interface ReverseGeocodeResult {
  addressLine: string;
  city: string;
}

/**
 * Reverse-geocodes via OpenStreetMap's public Nominatim API (no key required,
 * unlike Google Maps Geocoding) — fine for the low-volume, user-initiated
 * lookups this button triggers. Swap for a paid provider if usage grows,
 * since Nominatim's usage policy caps public traffic at ~1 req/sec.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data?.address as Record<string, string> | undefined;
    if (!addr) return null;

    const lineParts = [
      [addr.house_number, addr.road].filter(Boolean).join(" "),
      addr.neighbourhood ?? addr.suburb,
    ].filter((part): part is string => Boolean(part && part.length > 0));

    const city =
      addr.city ?? addr.town ?? addr.village ?? addr.county ?? addr.state_district ?? "";

    if (lineParts.length === 0 && !city) return null;

    return {
      addressLine: lineParts.join(", "),
      city,
    };
  } catch {
    return null;
  }
}
