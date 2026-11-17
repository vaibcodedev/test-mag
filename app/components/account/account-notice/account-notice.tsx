import { useId, type ComponentProps, type ReactNode } from "react";

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
  /** Кнопки та посилання, які виводять зі стану. */
  actions?: ReactNode;
};

/** Панель стану кабінету: недоступність або помилка — що сталося й що зробити далі. */
export function AccountNotice({ icon, title, description, actions, ...props }: AccountNoticeProps) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} data-slot="account-notice" {...props}>
      <Empty size="panel" titleSize="h3" className="h-full lg:justify-center">
        <EmptyHeader>
          <EmptyMedia>{icon}</EmptyMedia>
          <EmptyTitle as="h2" id={titleId}>
            {title}
          </EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
        {actions ? <EmptyContent>{actions}</EmptyContent> : null}
      </Empty>
    </section>
  );
}
