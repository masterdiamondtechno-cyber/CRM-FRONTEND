import { useEffect, useState } from "react";

export default function CountUp({ value, duration = 650 }) {
  const target = Number(value) || 0;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const finalValue = Number(value) || 0;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(finalValue);
      return undefined;
    }

    let frame = 0;
    let startTime;
    setDisplay(0);
    const tick = (time) => {
      startTime ??= time;
      const progress = Math.min(1, (time - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(finalValue * eased));
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [value, duration]);

  return <span aria-label={String(target)}>{display.toLocaleString("en-IN")}</span>;
}

