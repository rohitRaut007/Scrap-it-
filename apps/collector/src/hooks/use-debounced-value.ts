"use client";

import { useEffect, useState } from "react";

/** Delays reflecting `value` until it's been stable for `delayMs` — used to
 *  keep the live invoice PDF preview from re-rendering on every keystroke. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}
