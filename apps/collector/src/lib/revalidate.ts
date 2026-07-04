import { mutate } from "swr";

/** Revalidate every collector-portal SWR key after a mutation. */
export function revalidateCollectorData() {
  return mutate(
    (key) =>
      (typeof key === "string" && key.startsWith("collector/")) ||
      (Array.isArray(key) &&
        typeof key[0] === "string" &&
        key[0].startsWith("collector/")),
  );
}
