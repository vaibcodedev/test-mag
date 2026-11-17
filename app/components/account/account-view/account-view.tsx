import { CircleAlert, LogIn, Send, UserRoundX } from "lucide-react";
import { Link, useNavigation } from "react-router";

import { AccountNotice } from "~/components/account/account-notice";
import { CustomerProfile } from "~/components/account/customer-profile";
import { LogoutForm } from "~/components/account/logout-form";
import { OrdersList, type AccountOrder } from "~/components/account/orders-list";
import { Container } from "~/components/layout/container";
import { Button } from "~/components/ui/button";
import type { StoreInfo } from "~/lib/content/site";

export type AccountCustomer = {
  firstName?: string | null;
  lastName?: string | null;
  emailAddress?: { emailAddress?: string | null } | null;
  orders: {
    nodes: AccountOrder[];
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor?: string | null;
      endCursor?: string | null;
    };
  };
};

/** Стан кабінету, який повертає loader маршруту `/account`. */
export type AccountState =
  /** Customer Account API не налаштовано (mock.shop або немає ключів чи HTTPS). */
  | { status: "unavailable" }
  | { status: "signed-out"; loginFailed: boolean }
  | { status: "error" }
  | { status: "signed-in"; customer: AccountCustomer };

export type AccountViewProps = {
  state: AccountState;
  /** Контакти магазину для стану, коли вхід недоступний. */
  store: StoreInfo;
};

const ACCOUNT_PATH = "/account";

function cursorHref(name: "before" | "after", cursor: string | null | undefined): string | null {
  return cursor ? `?${name}=${encodeURIComponent(cursor)}` : null;
}

function Unavailable({ store }: { store: StoreInfo }) {
  return (
    <AccountNotice
      icon={<UserRoundX strokeWidth={2} />}
      title="Вхід запрацює після підключення магазину"
      description="Вхід у кабінет ще не налаштовано: він запрацює, щойно магазин під'єднають до Shopify. Купувати можна й без входу, а про статус замовлення запитайте нас у Telegram або телефоном."
      actions={
        <>
          <Button asChild>
            <Link viewTransition to="/collections" prefetch="intent">
              Перейти до каталогу
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <a href={store.telegramUrl} target="_blank" rel="noopener noreferrer">
              <Send aria-hidden="true" strokeWidth={2} />
              Написати в Telegram
              <span className="sr-only"> (відкриється в новій вкладці)</span>
            </a>
          </Button>
        </>
      }
    />
  );
}

function SignIn({ loginFailed }: { loginFailed: boolean }) {
  return (
    <AccountNotice
      icon={<LogIn strokeWidth={2} />}
      title="Увійдіть, щоб побачити замовлення"
      description="У кабінеті зібрано ваші замовлення з датами, статусами й сумами. Пароль не потрібен: надішлемо одноразовий код на вашу електронну пошту."
      alert={loginFailed ? "Не вдалося увійти. Спробуйте ще раз." : null}
      actions={
        <Button asChild>
          {/* Звичайний <a>: перехід на сторінку входу Shopify потребує повного завантаження. */}
          <a href="/account/login">
            <LogIn aria-hidden="true" strokeWidth={2} />
            Увійти
          </a>
        </Button>
      }
    />
  );
}

function LoadError() {
  return (
    <AccountNotice
      icon={<CircleAlert strokeWidth={2} />}
      title="Не вдалося завантажити кабінет"
      description="Оновіть сторінку трохи згодом. Якщо помилка повторюється, вийдіть з кабінету й увійдіть знову."
      actions={
        <>
          <Button asChild>
            <a href={ACCOUNT_PATH}>Оновити сторінку</a>
          </Button>
          <LogoutForm />
        </>
      }
    />
  );
}

function SignedIn({ customer }: { customer: AccountCustomer }) {
  const navigation = useNavigation();
  const busy = navigation.state === "loading" && navigation.location?.pathname === ACCOUNT_PATH;
  const { pageInfo } = customer.orders;

  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start lg:gap-8">
      <CustomerProfile
        firstName={customer.firstName}
        lastName={customer.lastName}
        email={customer.emailAddress?.emailAddress}
        actions={<LogoutForm />}
      />
      <OrdersList
        orders={customer.orders.nodes}
        newerHref={pageInfo.hasPreviousPage ? cursorHref("before", pageInfo.startCursor) : null}
        olderHref={pageInfo.hasNextPage ? cursorHref("after", pageInfo.endCursor) : null}
        busy={busy}
      />
    </div>
  );
}

/** Особистий кабінет: вхід, профіль і замовлення або пояснення, чому вхід недоступний. */
export function AccountView({ state, store }: AccountViewProps) {
  return (
    <Container data-slot="account-view" className="flex flex-col gap-8">
      <h1 className="text-h2 text-ink">Особистий кабінет</h1>
      {state.status === "unavailable" ? <Unavailable store={store} /> : null}
      {state.status === "signed-out" ? <SignIn loginFailed={state.loginFailed} /> : null}
      {state.status === "error" ? <LoadError /> : null}
      {state.status === "signed-in" ? <SignedIn customer={state.customer} /> : null}
    </Container>
  );
}
