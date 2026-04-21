"use client";

import { useState, useEffect, useRef } from "react";

export function useAnimatedCounter(
  endValue: number,
  duration: number = 1000,
  startOnMount: boolean = true
): number {
  const [count, setCount] = useState(0);
  const previousValue = useRef(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!startOnMount && endValue === 0) return;

    const startValue = previousValue.current;
    const startTime = performance.now();
    const difference = endValue - startValue;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      const currentValue = startValue + difference * easeOutQuart;
      setCount(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [endValue, duration, startOnMount]);

  return count;
}
