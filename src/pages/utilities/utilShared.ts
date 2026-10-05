/*
 * Vireo React — shared copy-flash hook for the utility/token pages.
 *
 * Ports the Alpine `x-data="{ flash:null, copy(v){…} }"` pattern from the utilities
 * reference pages: clicking a token tile copies its CSS var to the clipboard and
 * flashes "Copied!" for ~1.3s. State-driven, no DOM mutation.
 */
import { useCallback, useState } from 'react';

export function useCopyFlash(timeout = 1300) {
  const [flash, setFlash] = useState<string | null>(null);
  const copy = useCallback((v: string) => {
    navigator.clipboard?.writeText(v);
    setFlash(v);
    setTimeout(() => setFlash((cur) => (cur === v ? null : cur)), timeout);
  }, [timeout]);
  return { flash, copy };
}
