import { useEffect, useRef, useState } from 'react';

interface Size {
  width: number;
  height: number;
}

/**
 * Hook to measure element size using ResizeObserver
 * Avoids forced reflows by using ResizeObserver instead of manual queries
 *
 * @returns {Object} ref - Ref to attach to element, size - Current element dimensions
 *
 * @example
 * ```tsx
 * const { ref, size } = useElementSize<HTMLDivElement>();
 *
 * return (
 *   <div ref={ref}>
 *     Width: {size.width}px, Height: {size.height}px
 *   </div>
 * );
 * ```
 */
export function useElementSize<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;

    // Create ResizeObserver to watch for size changes
    const observer = new ResizeObserver((entries) => {
      if (!entries[0]) return;

      const { width, height } = entries[0].contentRect;

      // Use requestAnimationFrame to batch updates
      requestAnimationFrame(() => {
        setSize({ width, height });
      });
    });

    // Start observing
    observer.observe(ref.current);

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, []);

  return { ref, size };
}
