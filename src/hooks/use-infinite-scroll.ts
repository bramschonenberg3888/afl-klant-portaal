'use client';

import { useRef, useEffect } from 'react';

export function useInfiniteScroll(
  callback: () => void,
  options: { enabled: boolean }
) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!options.enabled) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) callback();
      },
      { threshold: 0.1 }
    );

    const el = sentinelRef.current;
    if (el) observer.observe(el);

    return () => observer.disconnect();
  }, [callback, options.enabled]);

  return sentinelRef;
}
