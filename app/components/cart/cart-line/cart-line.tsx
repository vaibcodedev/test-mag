import { Minus, Plus, Trash2 } from "lucide-react";
import { useState, type ComponentProps, type KeyboardEvent, type SubmitEvent } from "react";
import { Link } from "react-router";

import { Button } from "~/components/ui/button";
import { ButtonGroup } from "~/components/ui/button-group";
import { FieldError } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "~/components/ui/item";
import { ShopImage } from "~/components/ui/shop-image";
import type { useCartForm } from "~/lib/cart";
import { formatPrice, isOnSale, type Money } from "~/lib/format";
import { cn } from "~/lib/utils";

const IMAGE_FALLBACK_SIZE = 600;
const IMAGE_WIDTHS = [96, 192, 288] as const;
/** У товару без варіантів Shopify повертає службову опцію Title: Default Title. */
const DEFAULT_OPTION_VALUE = "Default Title";

/** Підказка, коли в полі кількості не число. */
export const QUANTITY_HINT = "Вкажіть кількість цифрами, наприклад 2.";
const DIGITS_ONLY = /^[0-9]+$/;

/** Поля рядка кошика, які показує картка. Оптимістичний рядок може прийти без товару й фото. */
export type CartLineData = {
  id: string;
  quantity: number;
  cost: {
    totalAmount: Money;
    amountPerQuantity?: Money | null;
    compareAtAmountPerQuantity?: Money | null;
  };
  attributes?: ReadonlyArray<{ key: string; value: string | null }> | null;
  merchandise?: {
    title?: string | null;
    selectedOptions?: ReadonlyArray<{ name: string; value: string }> | null;
    image?: {
      url: string;
      altText?: string | null;
      width?: number | null;
      height?: number | null;
    } | null;
    product?: { title?: string | null; handle?: string | null } | null;
  } | null;
};

/** `formProps` і `register` з `useCartForm()`: форма рядка тримається контракту Hydrogen. */
export type CartLineForm = ReturnType<typeof useCartForm>;

export type CartLineProps = Omit<ComponentProps<"li">, "children"> & {
  line: CartLineData;
  form: CartLineForm;
  /** Зміна рядка ще не підтверджена сервером. */
  pending?: boolean;
  /** Помилка саме цього рядка, українською. */
  error?: string | null;
  /** Куди перевести фокус, коли з кошика зникає останній рядок. */
  emptyCartFocusId: string;
  headingLevel?: "h2" | "h3";
};

function domId(prefix: string, lineId: string) {
  return `${prefix}-${lineId.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

/** Рядок кошика: фото, назва, опції, ціна, кількість і кнопка «Прибрати». */
export function CartLine({
  line,
  form,
  pending = false,
  error = null,
  emptyCartFocusId,
  headingLevel: Heading = "h3",
  className,
  ...props
}: CartLineProps) {
  const { formProps, register } = form;
  const merchandise = line.merchandise;
  const product = merchandise?.product;
  const title = product?.title ?? merchandise?.title ?? "Товар";
  const image = merchandise?.image;
  const options = (merchandise?.selectedOptions ?? []).filter(
    (option) => option.value !== DEFAULT_OPTION_VALUE,
  );
  const attributes = (line.attributes ?? []).filter(
    (attribute) => !attribute.key.startsWith("_") && attribute.value != null,
  );
  const unitPrice = line.cost.amountPerQuantity;
  const unitCompareAt = line.cost.compareAtAmountPerQuantity;
  const errorId = domId("cart-line-error", line.id);
  const pendingValue = pending && "opacity-50";

  // Підказка про нечислове значення живе в рядку: сервер такого запиту не бачить.
  const [quantityHint, setQuantityHint] = useState<string | null>(null);
  const message = error ?? quantityHint;

  /** Повертає в поле останню підтверджену кількість і пояснює, що саме не так. */
  const rejectQuantity = (input: HTMLInputElement) => {
    input.value = String(line.quantity);
    setQuantityHint(QUANTITY_HINT);
  };

  // Рядок, що зникає, забирає з собою елемент у фокусі. Поки він ще є, переводимо фокус
  // на таку саму кнопку сусіднього рядка або на заголовок кошика.
  const moveFocusBeforeRemoval = (event: SubmitEvent<HTMLFormElement>) => {
    const formElement = event.currentTarget;
    if (!formElement.contains(document.activeElement)) return;
    const intent = event.nativeEvent.submitter?.getAttribute("value");
    const quantity = new FormData(formElement).get("quantity");
    const removesLine =
      intent === "remove" ||
      (intent === "decrease" && line.quantity <= 1) ||
      (intent === "set" && Number(quantity) <= 0);
    if (!removesLine) return;

    const item = formElement.closest("li");
    const neighbour = item?.nextElementSibling ?? item?.previousElementSibling;
    const selector = intent === "set" ? 'input[name="quantity"]' : `button[value="${intent}"]`;
    const target =
      neighbour?.querySelector<HTMLElement>(selector) ?? document.getElementById(emptyCartFocusId);
    target?.focus();
  };

  const beforeSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    const formElement = event.currentTarget;
    const intent = event.nativeEvent.submitter?.getAttribute("value");
    const input = formElement.elements.namedItem("quantity");

    if (intent !== "remove" && input instanceof HTMLInputElement) {
      const raw = input.value.trim();
      // Порожнє поле проходить перевірку pattern, тому число перевіряємо й тут.
      if (!DIGITS_ONLY.test(raw)) {
        event.preventDefault();
        rejectQuantity(input);
        return;
      }
      // Та сама кількість, що вже в кошику: запит не потрібен. Так відсікається й другий
      // submit від події change, яку браузер надсилає після Enter, коли поле втрачає фокус.
      if (intent === "set" && Number(raw) === line.quantity) {
        event.preventDefault();
        input.value = String(line.quantity);
        setQuantityHint(null);
        return;
      }
    }

    setQuantityHint(null);
    moveFocusBeforeRemoval(event);
  };

  // Enter у полі: браузер спершу надсилає change (Hydrogen відправляє форму), а потім ще й
  // неявний submit. Якщо перший запит прибрав рядок (кількість 0), другий іде вже у від'єднану
  // форму, і в консолі з'являється «Form submission canceled because the form is not connected».
  // Тому Enter обробляємо самі: один submit кнопкою set, поки форма на місці.
  const submitOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
    event.preventDefault();
    const formElement = event.currentTarget.form;
    const setButton = formElement?.querySelector<HTMLButtonElement>(
      'button[name="intent"][value="set"]',
    );
    if (formElement?.isConnected && setButton) formElement.requestSubmit(setButton);
  };

  return (
    <li
      data-slot="cart-line"
      data-testid="cart-line"
      data-pending={pending || undefined}
      aria-busy={pending || undefined}
      // Рядок — сітка з одним рядком: коли товар прибрали, CartLines ставить data-leaving,
      // і рядок плавно згортається до нуля та гасне, а не зникає ривком.
      className={cn(
        "grid grid-rows-[1fr] transition-[grid-template-rows,opacity] duration-300 ease-in-out data-leaving:grid-rows-[0fr] data-leaving:opacity-0",
        className,
      )}
      {...props}
    >
      <Item size="none" className="min-h-0 flex-nowrap items-start overflow-hidden py-4">
        <ItemMedia variant="image" size="lg" fit="cover" className="sm:size-24">
          {image ? (
            <ShopImage
              src={image.url}
              alt=""
              width={image.width ?? IMAGE_FALLBACK_SIZE}
              height={image.height ?? IMAGE_FALLBACK_SIZE}
              sizes="96px"
              widths={IMAGE_WIDTHS}
            />
          ) : null}
        </ItemMedia>

        <ItemContent className="gap-2">
          <div className="flex flex-col gap-1">
            <ItemTitle asChild>
              <Heading>
                {product?.handle ? (
                  <Link
                    viewTransition
                    to={`/products/${product.handle}`}
                    prefetch="intent"
                    className="inline-flex min-h-11 items-center rounded-sm focus-ring hover:text-blue"
                  >
                    {title}
                  </Link>
                ) : (
                  title
                )}
              </Heading>
            </ItemTitle>
            {options.length > 0 ? (
              <ItemDescription>{options.map((option) => option.value).join(" · ")}</ItemDescription>
            ) : null}
            {attributes.map((attribute) => (
              <ItemDescription key={attribute.key}>
                {attribute.key}: {attribute.value}
              </ItemDescription>
            ))}
          </div>

          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className={cn("text-body font-extrabold text-ink tabular-nums", pendingValue)}>
              <span className="sr-only">Разом за товар: </span>
              {formatPrice(line.cost.totalAmount)}
            </span>
            {unitPrice && line.quantity > 1 ? (
              <span className={cn("text-caption text-muted-foreground tabular-nums", pendingValue)}>
                {formatPrice(unitPrice)} за шт.
              </span>
            ) : null}
            {unitPrice && isOnSale(unitPrice, unitCompareAt) ? (
              <s className="text-caption text-muted-foreground tabular-nums">
                <span className="sr-only">Стара ціна: </span>
                {formatPrice(unitCompareAt)}
              </s>
            ) : null}
          </div>

          <form
            {...formProps({ beforeSubmit })}
            className="flex items-center justify-between gap-2"
          >
            <button {...register("set")} />
            <input type="hidden" {...register("lineId", { value: line.id })} />
            <ButtonGroup aria-label={`Кількість: ${title}`}>
              <Button
                variant="ghost"
                size="icon"
                type="submit"
                {...register("decrease")}
                aria-label={line.quantity <= 1 ? "Прибрати останню одиницю" : "Зменшити кількість"}
              >
                <Minus aria-hidden="true" strokeWidth={2} className="size-4" />
              </Button>
              <Input
                {...register("quantity", { value: line.quantity, interactive: true })}
                aria-label="Кількість"
                aria-describedby={message ? errorId : undefined}
                aria-invalid={message ? true : undefined}
                onKeyDown={submitOnEnter}
                onInput={() => setQuantityHint(null)}
                onInvalid={(event) => {
                  // Замість системної підказки браузера — наша, українською, під полем.
                  event.preventDefault();
                  rejectQuantity(event.currentTarget);
                }}
                className={cn("w-12 px-0 text-center font-semibold tabular-nums", pendingValue)}
              />
              <Button
                variant="ghost"
                size="icon"
                type="submit"
                {...register("increase")}
                aria-label="Збільшити кількість"
              >
                <Plus aria-hidden="true" strokeWidth={2} className="size-4" />
              </Button>
            </ButtonGroup>
            <ItemActions>
              <Button
                variant="ghost"
                size="icon"
                type="submit"
                {...register("remove")}
                aria-label={`Прибрати з кошика: ${title}`}
              >
                <Trash2 aria-hidden="true" strokeWidth={2} />
              </Button>
            </ItemActions>
          </form>

          <FieldError id={errorId}>{message}</FieldError>
        </ItemContent>
      </Item>
    </li>
  );
}
