import { useEffect } from "react";

function measure() {
  const wrap = document.querySelector(".tab-bar-wrap");
  if (!wrap) return;
  const h = wrap.getBoundingClientRect().height;
  document.documentElement.style.setProperty("--tab-bar-total", `${Math.ceil(h)}px`);
}

export function useTabBarHeight(modalOpen: boolean) {
  useEffect(() => {
    measure();
    const ro = new ResizeObserver(() => measure());
    const wrap = document.querySelector(".tab-bar-wrap");
    if (wrap) ro.observe(wrap);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [modalOpen]);
}
