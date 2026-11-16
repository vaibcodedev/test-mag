import { CircleAlert, CircleSlash, Send, ShoppingCart } from "lucide-react";
import type { ComponentProps, ReactNode, Ref } from "react";

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { STORE_INFO } from "~/lib/content/site";
import { cn } from "~/lib/utils";

/**
 * Що можна зробити з вибраним варіантом:
 * available — купити; sold-out — немає в наявності; unselected — варіант ще не вибрано;
 * unavailable — товар не продається разовою покупкою (лише за підпискою).
 */
export type PurchaseState = "available" | "sold-out" | "unselected" | "unavailable";

type HiddenField = { name: string; value?: string; defaultValue?: string };

export type ProductFormFields = {
  /** register("merchandiseId") із форми товару Hydrogen. */
  merchandiseId: HiddenField;
  /** register("quantity"): кількість завжди 1, змінюється вже в кошику. */
  quantity: HiddenField;
  /** register("addToCart"): name і type кнопки, за якими кошик розпізнає дію. */
  submit: { name: string; type: "submit" };
};

export type ProductFormProps = Omit<ComponentProps<"form">, "children"> & {
  fields: ProductFormFields;
  state: PurchaseState;
  /** Товар додається в кошик. */
  pending?: boolean;
  /** Помилки кошика, які треба показати покупцеві. */
  errors?: readonly string[];
  /** Головна кнопка «Купити»: за нею стежить липка панель на мобільному. */
  submitRef?: Ref<HTMLButtonElement>;
  /** Швидка оплата під кнопкою (Shop Pay). */
  children?: ReactNode;
};

/**
 * Форма «Купити». method, action та onSubmit приходять із formProps() Hydrogen:
 * з JavaScript товар додається без перезавантаження, без нього — звичайним POST на кошик.
 */
export function ProductForm({
  fields,
  state,
  pending = false,
  errors = [],
  submitRef,
  children,
  className,
  ...props
}: ProductFormProps) {
  return (
    <div data-slot="product-form" data-state={state} className="flex flex-col gap-3">
      <form className={cn("flex flex-col gap-3", className)} {...props}>
        <input type="hidden" {...fields.merchandiseId} />
        <input type="hidden" {...fields.quantity} />

        {state === "available" ? (
          <Button {...fields.submit} ref={submitRef} size="lg" className="w-full" loading={pending}>
            <ShoppingCart aria-hidden="true" strokeWidth={2} />
            Купити
          </Button>
        ) : null}

        {state === "unselected" ? (
          <Button size="lg" className="w-full" disabled>
            Оберіть варіант
          </Button>
        ) : null}
      </form>

      {state === "sold-out" ? (
        <Alert>
          <CircleSlash aria-hidden="true" strokeWidth={2} />
          <AlertTitle>Немає в наявності</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-1">
            <p>Цей варіант розкупили. Оберіть інший або напишіть нам — скажемо, коли привеземо.</p>
            <Button asChild variant="link" size="sm" className="min-h-11">
              <a href={STORE_INFO.telegramUrl} target="_blank" rel="noreferrer">
                <Send aria-hidden="true" strokeWidth={2} />
                Запитати в Telegram
                <span className="sr-only"> (відкриється в новій вкладці)</span>
              </a>
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {state === "unavailable" ? (
        <Alert>
          <AlertDescription>
            Цей товар зараз не можна купити на сайті. Напишіть нам або завітайте в шоурум —
            допоможемо оформити замовлення.
          </AlertDescription>
        </Alert>
      ) : null}

      {errors.length > 0 ? (
        <Alert variant="danger">
          <CircleAlert aria-hidden="true" strokeWidth={2} />
          <AlertDescription>
            <ul role="list" className="flex flex-col gap-1">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      {children}
    </div>
  );
}
