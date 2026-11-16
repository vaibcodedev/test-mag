import { RotateCcw, TriangleAlert } from "lucide-react";
import type { ComponentProps } from "react";

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";

export type SavedLoadErrorProps = Omit<ComponentProps<"div">, "children"> & {
  onRetry: () => void;
};

/** Товари зі списку не завантажились: що сталося і як повторити. */
export function SavedLoadError({ onRetry, ...props }: SavedLoadErrorProps) {
  return (
    <Alert variant="danger" data-slot="saved-load-error" {...props}>
      <TriangleAlert aria-hidden="true" strokeWidth={2} />
      <AlertTitle>Не вдалося завантажити товари.</AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-3">
        <p>Перевірте з&apos;єднання з інтернетом і спробуйте ще раз — список збережено.</p>
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RotateCcw strokeWidth={2} aria-hidden="true" />
          Спробувати ще раз
        </Button>
      </AlertDescription>
    </Alert>
  );
}
