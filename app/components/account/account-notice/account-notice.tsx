import { CircleAlert } from "lucide-react";
import { useId, type ComponentProps, type ReactNode } from "react";

import { Alert, AlertDescription } from "~/components/ui/alert";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";

export type AccountNoticeProps = Omit<ComponentProps<"section">, "title" | "children"> & {
  /** Іконка lucide. */
  icon: ReactNode;
  title: string;
  description: ReactNode;
  /** Повідомлення про помилку над діями; озвучується скринрідером одразу. */
  alert?: ReactNode;
  /** Кнопки та посилання, які виводять зі стану. */
  actions?: ReactNode;
};

/** Картка стану кабінету: вхід, недоступність або помилка — що сталося й що зробити далі. */
export function AccountNotice({
  icon,
  title,
  description,
  alert,
  actions,
  ...props
}: AccountNoticeProps) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} data-slot="account-notice" {...props}>
      <Empty size="sm">
        <EmptyHeader>
          <EmptyMedia>{icon}</EmptyMedia>
          <EmptyTitle as="h2" id={titleId}>
            {title}
          </EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
        {alert ? (
          <Alert variant="danger" className="max-w-xl">
            <CircleAlert aria-hidden="true" strokeWidth={2} />
            <AlertDescription>{alert}</AlertDescription>
          </Alert>
        ) : null}
        {actions ? <EmptyContent>{actions}</EmptyContent> : null}
      </Empty>
    </section>
  );
}
