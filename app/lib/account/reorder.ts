import type { Money } from "~/lib/format";

/**
 * «Повторити замовлення»: з позицій минулого замовлення збираємо рядки для кошика.
 *
 * Поле `Order.reorderPath` з API тут не використовується свідомо: воно веде на адресу, яка
 * збирає НОВИЙ кошик і одразу відправляє в оформлення. Нам потрібно інше — додати товари
 * до поточного кошика, показати його в панелі й чесно назвати позиції, яких уже не купити.
 * Тому сервер звіряє варіанти з вітриною (Storefront API), а кошик змінюється як завжди,
 * через `window.Shopify.actions.updateCart`.
 */

/** Позиція минулого замовлення (Customer Account API). */
export type ReorderOrderLine = {
  title: string;
  variantTitle?: string | null;
  quantity: number;
  /** Немає у власноруч доданих позицій і в товарів, які видалили з магазину. */
  variantId?: string | null;
};

/** Варіант, як його зараз бачить вітрина (Storefront API). */
export type ReorderVariant = {
  id: string;
  availableForSale: boolean;
  title: string;
  price: Money;
  image?: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
  selectedOptions: ReadonlyArray<{ name: string; value: string }>;
  product: { title: string; handle: string };
};

/** Рядок, який стор кошика показує одразу, не чекаючи відповіді Shopify. */
export type ReorderPreview = {
  id: string;
  price: Money;
  title: string;
  image: ReorderVariant["image"];
  selectedOptions: ReorderVariant["selectedOptions"];
  product: ReorderVariant["product"];
};

export type ReorderLine = { merchandiseId: string; quantity: number; preview: ReorderPreview };

/** `gone` — товару більше немає в продажу; `sold-out` — закінчився. */
export type ReorderSkipped = { title: string; reason: "gone" | "sold-out" };

export type ReorderPlan = {
  lines: ReorderLine[];
  skipped: ReorderSkipped[];
};

/** Чим закінчилось додавання в кошик. */
export type ReorderResult =
  /** Shopify прийняв усі рядки. */
  | "added"
  /** Прийняв, але з попередженням: частини кількості немає. */
  | "limited"
  /** Відхилив. */
  | "rejected"
  /** Кошик не встиг завантажитись. */
  | "not-ready"
  /** Немає з'єднання або сервер не відповів. */
  | "network"
  /** Сесія в кабінеті закінчилась. */
  | "signed-out";

export type ReorderMessage = {
  tone: "success" | "warning" | "error";
  title: string;
  description?: string;
};

export type ReorderOutcome = {
  /** Відкривати кошик лише тоді, коли в ньому справді щось з'явилося. */
  openCart: boolean;
  message: ReorderMessage;
};

const DEFAULT_VARIANT_TITLE = "Default Title";
/** Скільки назв уміщає повідомлення; решту рахуємо: «та ще 2». */
const MAX_NAMES = 3;

function lineTitle(line: ReorderOrderLine): string {
  const title = line.title.trim() || "Товар без назви";
  const variant = line.variantTitle?.trim();
  return variant && variant !== DEFAULT_VARIANT_TITLE ? `${title} (${variant})` : title;
}

/** Варіанти замовлення без повторів — список для запиту у Storefront API. */
export function reorderVariantIds(lines: readonly ReorderOrderLine[]): string[] {
  return [...new Set(lines.flatMap((line) => (line.variantId ? [line.variantId] : [])))];
}

/**
 * План повторення. Позиції з тим самим варіантом зливаються в один рядок кошика; позиції без
 * варіанта, зняті з продажу й розпродані потрапляють у `skipped` — кожна зі своєю причиною.
 */
export function buildReorderPlan(
  orderLines: readonly ReorderOrderLine[],
  variants: ReadonlyArray<ReorderVariant | null | undefined>,
): ReorderPlan {
  const byId = new Map(variants.flatMap((variant) => (variant ? [[variant.id, variant]] : [])));
  const lines = new Map<string, ReorderLine>();
  const skipped: ReorderSkipped[] = [];

  for (const line of orderLines) {
    if (line.quantity <= 0) continue;
    const variant = line.variantId ? byId.get(line.variantId) : undefined;
    if (!variant) {
      skipped.push({ title: lineTitle(line), reason: "gone" });
      continue;
    }
    if (!variant.availableForSale) {
      skipped.push({ title: lineTitle(line), reason: "sold-out" });
      continue;
    }

    const existing = lines.get(variant.id);
    if (existing) {
      existing.quantity += line.quantity;
      continue;
    }
    lines.set(variant.id, {
      merchandiseId: variant.id,
      quantity: line.quantity,
      preview: {
        id: variant.id,
        price: variant.price,
        title: variant.title,
        image: variant.image ?? null,
        selectedOptions: variant.selectedOptions,
        product: variant.product,
      },
    });
  }

  return { lines: [...lines.values()], skipped };
}

function names(items: readonly ReorderSkipped[]): string {
  const shown = items.slice(0, MAX_NAMES).map((item) => `«${item.title}»`);
  const rest = items.length - shown.length;
  return rest > 0 ? `${shown.join(", ")} та ще ${rest}` : shown.join(", ");
}

/** «Закінчились: «A», «B». Більше не продаються: «C».» */
export function skippedSummary(skipped: readonly ReorderSkipped[]): string {
  const soldOut = skipped.filter((item) => item.reason === "sold-out");
  const gone = skipped.filter((item) => item.reason === "gone");
  return [
    soldOut.length > 0
      ? `${soldOut.length === 1 ? "Закінчився" : "Закінчились"}: ${names(soldOut)}.`
      : null,
    gone.length > 0
      ? `${gone.length === 1 ? "Більше не продається" : "Більше не продаються"}: ${names(gone)}.`
      : null,
  ]
    .filter(Boolean)
    .join(" ");
}

const FAILURES: Record<Exclude<ReorderResult, "added" | "limited">, ReorderMessage> = {
  rejected: {
    tone: "error",
    title: "Не вдалося додати товари",
    description:
      "Магазин не прийняв товари з цього замовлення: можливо, вони щойно закінчились. Спробуйте ще раз або додайте їх зі сторінок товарів.",
  },
  "not-ready": {
    tone: "error",
    title: "Не вдалося додати товари",
    description: "Кошик ще завантажується. Зачекайте кілька секунд і спробуйте ще раз.",
  },
  network: {
    tone: "error",
    title: "Не вдалося повторити замовлення",
    description: "Перевірте з'єднання й спробуйте ще раз.",
  },
  "signed-out": {
    tone: "error",
    title: "Увійдіть у кабінет ще раз",
    description: "Сесія закінчилась. Оновіть сторінку, увійдіть і повторіть замовлення.",
  },
};

/** Немає плану взагалі: замовлення не знайшлося або сервер не відповів. */
export function reorderFailure(
  result: Exclude<ReorderResult, "added" | "limited">,
): ReorderOutcome {
  return { openCart: false, message: FAILURES[result] };
}

/**
 * Що сказати покупцеві й чи відкривати кошик. Правило одне: кошик відкривається лише тоді,
 * коли в нього щось додано, а кожну пропущену позицію названо.
 */
export function reorderOutcome(plan: ReorderPlan, result: ReorderResult): ReorderOutcome {
  const skipped = skippedSummary(plan.skipped);

  if (plan.lines.length === 0) {
    return {
      openCart: false,
      message: {
        tone: "error",
        title: "Нічого не додано",
        description: skipped
          ? `Жодного товару з цього замовлення зараз не купити. ${skipped}`
          : "У цьому замовленні немає товарів, які можна додати в кошик.",
      },
    };
  }

  if (result !== "added" && result !== "limited") return reorderFailure(result);

  if (result === "limited") {
    return {
      openCart: true,
      message: {
        tone: "warning",
        title: "Додано не все",
        description: ["Частини товарів немає в потрібній кількості — перевірте кошик.", skipped]
          .filter(Boolean)
          .join(" "),
      },
    };
  }

  if (skipped) {
    return {
      openCart: true,
      message: {
        tone: "warning",
        title: "Додано не все",
        description: `${skipped} Решта вже в кошику.`,
      },
    };
  }

  return { openCart: true, message: { tone: "success", title: "Товари додано в кошик" } };
}
