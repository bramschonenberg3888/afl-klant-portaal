'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const THRESHOLD = 100;

export function useScrollToBottom() {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
    setIsAtBottom(true);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const checkIsAtBottom = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      return scrollHeight - scrollTop - clientHeight < THRESHOLD;
    };

    const handleScroll = () => {
      const atBottom = checkIsAtBottom();
      setIsAtBottom(atBottom);

      // If user scrolled up, mark as user scrolling
      if (!atBottom) {
        isUserScrollingRef.current = true;
      } else {
        isUserScrollingRef.current = false;
      }
    };

    const autoScroll = () => {
      if (!isUserScrollingRef.current) {
        endRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
      }
    };

    // Watch for content changes (streaming tokens, new messages)
    const mutationObserver = new MutationObserver(autoScroll);
    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Watch for size changes (images loading, code blocks expanding)
    const resizeObserver = new ResizeObserver(autoScroll);
    resizeObserver.observe(container);

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return { containerRef, endRef, isAtBottom, scrollToBottom };
}
