import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge не знає про утиліти шкали «Сад» (text-display, text-h2 …) і без підказки
 * вважає їх кольором тексту, тобто викидає поруч із text-ink. Тут вони оголошені як
 * розмір шрифту, а тіні фокуса — як box-shadow. Радіус pill теж треба назвати радіусом,
 * інакше rounded-pill у className не витісняє rounded-md із варіанта.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: { radius: ["pill"] },
    classGroups: {
      "font-size": [
        {
          text: [
            "display",
            "h2",
            "h2-panel",
            "h3",
            "price",
            "body",
            "card-title",
            "small",
            "caption",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
