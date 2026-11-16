import { useEffect, useState } from "react";

/**
 * Показує поточне значення CSS-змінної просто з tokens.css, щоб вітрина
 * не дублювала hex і не могла розійтися з токенами.
 */
export function TokenValue({ name }: { name: `--${string}` }) {
  const [value, setValue] = useState("");

  useEffect(() => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    setValue(raw.startsWith("#") ? raw.toUpperCase() : raw);
  }, [name]);

  return <span className="tabular-nums">{value || "…"}</span>;
}
