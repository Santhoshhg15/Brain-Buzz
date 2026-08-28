import { useState, useEffect, useRef } from "react";

export function useCountUp(targetValue: number, durationMs: number = 700): number {
  const [displayValue, setDisplayValue] = useState(0);
  const prevTargetRef = useRef(0);

  useEffect(() => {
    const startValue = prevTargetRef.current;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(startValue + (targetValue - startValue) * eased);
      setDisplayValue(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevTargetRef.current = targetValue;
      }
    }

    const frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [targetValue, durationMs]);

  return displayValue;
}
