"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";

export default function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const prevPathname = useRef(pathname);

  const startProgress = useCallback(() => {
    setVisible(true);
    setProgress(0);
    let current = 0;
    timerRef.current = setInterval(() => {
      current += Math.random() * 15;
      if (current >= 85) {
        current = 85;
        if (timerRef.current) clearInterval(timerRef.current);
      }
      setProgress(current);
    }, 100);
  }, []);

  const completeProgress = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);
    setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("mailto") || href.startsWith("#")) return;
      if (href !== pathname) {
        startProgress();
      }
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname, startProgress]);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      completeProgress();
    }
  }, [pathname, completeProgress]);

  if (!visible) return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999, height: "3px", pointerEvents: "none" }}>
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          background: "linear-gradient(90deg, #f97316, #fb923c, #f97316)",
          transition: progress === 100 ? "width 0.15s ease" : "width 0.1s ease",
          borderRadius: "0 2px 2px 0",
          boxShadow: "0 0 10px rgba(249, 115, 22, 0.7)",
        }}
      />
    </div>
  );
}
