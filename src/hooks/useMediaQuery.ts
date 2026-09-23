/*
 * Vireo React — media-query hook.
 *
 * The idiomatic replacement for the reference's resize-bound width watchers
 * (`_bindBands()` in js/alpine/index.js, `sidebar.isMobile()` in
 * js/core/sidebar.js). `matchMedia` fires only when the band actually flips, so
 * there is nothing to debounce and no per-pixel resize churn.
 *
 * Portable: no router / UI imports, so the Next edition copies it verbatim.
 */
import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    try {
      return window.matchMedia(query).matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    let mq: MediaQueryList;
    try {
      mq = window.matchMedia(query);
    } catch {
      return;
    }
    setMatches(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    if (mq.addEventListener) {
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }
    /* Safari < 14 */
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, [query]);

  return matches;
}

export default useMediaQuery;
