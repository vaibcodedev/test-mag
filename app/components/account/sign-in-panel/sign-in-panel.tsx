import { CircleAlert, KeyRound, LogIn, PackageCheck, ReceiptText } from "lucide-react";
import { useId, type ComponentProps } from "react";
import { Link } from "react-router";

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card, CardTitle } from "~/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "~/components/ui/item";
import { cn } from "~/lib/utils";

export type SignInPanelProps = Omit<ComponentProps<"div">, "children"> & {
  /** Попередня спроба входу не вдалася. */
  loginFailed?: boolean;
};

const BENEFITS = [
  {
    icon: ReceiptText,
    title: "Усі замовлення в одному місці",
    description: "Дати, склад і суми кожної покупки.",
  },
  {
    icon: PackageCheck,
    title: "Стан оплати й доставки",
    description: "Одразу видно, що вже оплачено й відправлено.",
  },
  {
    icon: KeyRound,
    title: "Вхід без пароля",
    description: "Нічого запам'ятовувати: щоразу — новий код з пошти.",
  },
];

/**
 * Запрошення увійти: одна головна дія, пояснення про одноразовий код і те, що покупець
 * побачить у кабінеті. Купувати можна й без входу — про це сказано прямо.
 */
export function SignInPanel({ loginFailed = false, className, ...props }: SignInPanelProps) {
  const titleId = useId();
  const benefitsId = useId();

  return (
    <div
      data-slot="sign-in-panel"
      className={cn("grid gap-6 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-8", className)}
      {...props}
    >
      <section aria-labelledby={titleId} className="flex">
        <Empty size="panel" titleSize="h3" className="lg:justify-center">
          <EmptyHeader>
            <EmptyMedia>
              <LogIn strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle as="h2" id={titleId}>
              Увійдіть, щоб бачити свої замовлення
            </EmptyTitle>
            <EmptyDescription>
              Пароль не потрібен. Вкажіть електронну пошту, з якою купували, — надішлемо на неї
              одноразовий код.
            </EmptyDescription>
          </EmptyHeader>

          {loginFailed ? (
            <Alert variant="danger" className="max-w-xl">
              <CircleAlert aria-hidden="true" strokeWidth={2} />
              <AlertTitle>Не вдалося увійти</AlertTitle>
              <AlertDescription>
                Можливо, код застарів або вхід було скасовано. Спробуйте ще раз — надішлемо новий
                код.
              </AlertDescription>
            </Alert>
          ) : null}

          <EmptyContent>
            <Button asChild size="lg" className="w-full sm:w-auto">
              {/* Звичайний <a>: перехід на сторінку входу Shopify потребує повного завантаження. */}
              <a href="/account/login">
                <LogIn aria-hidden="true" strokeWidth={2} />
                {loginFailed ? "Увійти ще раз" : "Увійти"}
              </a>
            </Button>
          </EmptyContent>

          <EmptyDescription className="max-w-xl text-small">
            Купувати можна й без кабінету: оформлення замовлення не потребує входу.{" "}
            <Link
              viewTransition
              to="/collections"
              prefetch="intent"
              className="rounded-sm focus-ring"
            >
              Перейти до каталогу
            </Link>
          </EmptyDescription>
        </Empty>
      </section>

      <Card asChild size="panel" tone="ink" padding="md" className="gap-5 md:p-8">
        <section aria-labelledby={benefitsId}>
          <CardTitle asChild size="h3">
            <h2 id={benefitsId}>Що є в кабінеті</h2>
          </CardTitle>
          <ItemGroup asChild className="gap-5">
            <ul role="list">
              {BENEFITS.map(({ icon: Icon, title, description }) => (
                <li key={title}>
                  <Item variant="on-dark" size="none" className="flex-nowrap items-start">
                    <ItemMedia variant="icon" tone="lime">
                      <Icon aria-hidden="true" strokeWidth={2} />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{title}</ItemTitle>
                      <ItemDescription>{description}</ItemDescription>
                    </ItemContent>
                  </Item>
                </li>
              ))}
            </ul>
          </ItemGroup>
        </section>
      </Card>
    </div>
  );
}
