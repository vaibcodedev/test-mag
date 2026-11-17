import { CircleAlert, RotateCw, Send, UserRoundPen, UserRoundX } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useNavigation } from "react-router";

import { AccountHelp } from "~/components/account/account-help";
import { AccountNotice } from "~/components/account/account-notice";
import { AccountShortcuts } from "~/components/account/account-shortcuts";
import { CustomerProfile } from "~/components/account/customer-profile";
import { LogoutForm } from "~/components/account/logout-form";
import type { AccountOrder } from "~/components/account/order-card";
import { OrdersList } from "~/components/account/orders-list";
import { SignInPanel } from "~/components/account/sign-in-panel";
import { ContactCard } from "~/components/content/contact-card";
import { Container } from "~/components/layout/container";
import { Button } from "~/components/ui/button";
import {
  DEFAULT_ORDERS_CHOICE,
  ordersListSearch,
  type OrdersListChoice,
} from "~/lib/account/orders-list";
import type { StoreInfo } from "~/lib/content/site";

export type AccountCustomer = {
  firstName?: string | null;
  lastName?: string | null;
  emailAddress?: { emailAddress?: string | null } | null;
  orders: {
    nodes: readonly AccountOrder[];
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
  | {
      status: "signed-in";
      customer: AccountCustomer;
      /** Сортування й період списку замовлень; без них — типові. */
      list?: OrdersListChoice;
    };

export type AccountViewProps = {
  state: AccountState;
  /** Контакти магазину: допомога в кабінеті та зв'язок, коли вхід недоступний. */
  store: StoreInfo;
};

const ACCOUNT_PATH = "/account";

/** Сітка «вміст + бічна колонка»: однакова в усіх станах, щоб сторінка не стрибала. */
const LAYOUT = "grid gap-6 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-8";

/** Адреса сусідньої сторінки списку: зберігає вибране сортування й період. */
function cursorHref(
  list: OrdersListChoice,
  name: "before" | "after",
  cursor: string | null | undefined,
): string | null {
  return cursor ? ordersListSearch(list, { name, value: cursor }) : null;
}

/** Заголовок станів без входу; у кабінеті покупця h1 — це привітання в CustomerProfile. */
function PageTitle() {
  return <h1 className="text-h2 text-ink">Особистий кабінет</h1>;
}

/** Панель стану й картка контактів поруч: що сталося і як зв'язатися з магазином. */
function NoticeWithContacts({ notice, contacts }: { notice: ReactNode; contacts: ReactNode }) {
  return (
    <div className={LAYOUT}>
      {notice}
      {contacts}
    </div>
  );
}

function Unavailable({ store }: { store: StoreInfo }) {
  return (
    <NoticeWithContacts
      notice={
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
      }
      contacts={<ContactCard store={store} title="Ми на зв'язку" />}
    />
  );
}

function LoadError({ store }: { store: StoreInfo }) {
  return (
    <NoticeWithContacts
      notice={
        <AccountNotice
          icon={<CircleAlert strokeWidth={2} />}
          title="Не вдалося завантажити кабінет"
          description="Щось пішло не так, але з вашими замовленнями все гаразд. Спробуйте ще раз за хвилину. Якщо не допоможе — вийдіть з кабінету й увійдіть знову."
          actions={
            <>
              <Button asChild>
                {/* Звичайний <a>: повне перезавантаження сторінки заново запитує дані. */}
                <a href={ACCOUNT_PATH}>
                  <RotateCw aria-hidden="true" strokeWidth={2} />
                  Спробувати ще раз
                </a>
              </Button>
              <LogoutForm />
            </>
          }
        />
      }
      contacts={
        <ContactCard
          store={store}
          title="Потрібна допомога?"
          description="Напишіть або зателефонуйте — підкажемо стан замовлення без кабінету."
        />
      }
    />
  );
}

function SignedIn({
  customer,
  list,
  store,
}: {
  customer: AccountCustomer;
  list: OrdersListChoice;
  store: StoreInfo;
}) {
  const navigation = useNavigation();
  const busy = navigation.state === "loading" && navigation.location?.pathname === ACCOUNT_PATH;
  const { pageInfo } = customer.orders;

  return (
    <>
      <CustomerProfile
        firstName={customer.firstName}
        lastName={customer.lastName}
        email={customer.emailAddress?.emailAddress}
        actions={
          <>
            <Button asChild variant="surface" size="sm">
              <Link viewTransition to="/account/profile">
                <UserRoundPen aria-hidden="true" strokeWidth={2} />
                Профіль
              </Link>
            </Button>
            <LogoutForm variant="surface" size="sm" />
          </>
        }
      />
      <div className={`${LAYOUT} lg:items-start`}>
        <OrdersList
          orders={customer.orders.nodes}
          choice={list}
          previousHref={
            pageInfo.hasPreviousPage ? cursorHref(list, "before", pageInfo.startCursor) : null
          }
          nextHref={pageInfo.hasNextPage ? cursorHref(list, "after", pageInfo.endCursor) : null}
          busy={busy}
        />
        <aside aria-label="Корисне" className="flex min-w-0 flex-col gap-6">
          <AccountShortcuts />
          <AccountHelp store={store} />
        </aside>
      </div>
    </>
  );
}

/** Особистий кабінет: вхід, профіль і замовлення або пояснення, чому вхід недоступний. */
export function AccountView({ state, store }: AccountViewProps) {
  return (
    <Container data-slot="account-view" data-status={state.status} className="flex flex-col gap-8">
      {state.status === "signed-in" ? (
        <SignedIn
          customer={state.customer}
          list={state.list ?? DEFAULT_ORDERS_CHOICE}
          store={store}
        />
      ) : (
        <PageTitle />
      )}
      {state.status === "unavailable" ? <Unavailable store={store} /> : null}
      {state.status === "signed-out" ? <SignInPanel loginFailed={state.loginFailed} /> : null}
      {state.status === "error" ? <LoadError store={store} /> : null}
    </Container>
  );
}
