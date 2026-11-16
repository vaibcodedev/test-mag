import { CircleAlert, X } from "lucide-react";
import { useMemo, useState, type ComponentProps } from "react";

import { bannerErrorMessages } from "~/components/cart/cart-errors";
import { Alert, AlertAction, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { useCart } from "~/lib/cart";

/**
 * Банер для помилок, яким немає місця біля рядка: мережа, увесь кошик, прибрані рядки.
 * Закритий банер з'являється знову, щойно приходить новіша помилка.
 */
export function CartErrorBanner({ className, ...props }: Omit<ComponentProps<"div">, "children">) {
  const errors = useCart((state) => state.errors);
  const lines = useCart((state) => state.data.lines.nodes);
  const [dismissedAt, setDismissedAt] = useState(0);
  const messages = useMemo(
    () => bannerErrorMessages(errors, new Set(lines.map((line) => line.id))),
    [errors, lines],
  );

  if (messages.length === 0 || errors.lastUpdatedAt <= dismissedAt) return null;

  return (
    <Alert variant="danger" className={className} {...props} data-slot="cart-error-banner">
      <CircleAlert aria-hidden="true" strokeWidth={2} />
      <AlertDescription className="flex flex-col gap-1">
        {messages.map((message) => (
          <p key={message}>{message}</p>
        ))}
      </AlertDescription>
      <AlertAction>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Закрити повідомлення"
          onClick={() => setDismissedAt(errors.lastUpdatedAt)}
        >
          <X aria-hidden="true" strokeWidth={2} />
        </Button>
      </AlertAction>
    </Alert>
  );
}
