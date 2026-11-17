import { ArrowLeft, CircleAlert, RotateCw } from "lucide-react";
import { Link, redirect } from "react-router";

import { AccountNotice } from "~/components/account/account-notice";
import { OrderDetails } from "~/components/account/order-details";
import { ContactCard } from "~/components/content/contact-card";
import { Container } from "~/components/layout/container";
import { Button } from "~/components/ui/button";
import {
  ORDER_ADJUSTMENTS_QUERY,
  ORDER_QUERY,
  ORDER_SHIPMENTS_QUERY,
} from "~/graphql/queries/account-order.query";
import {
  getCustomerAccess,
  logAccountErrors,
  logAccountFailure,
  optionalAccountData,
  type AccountGraphqlError,
} from "~/lib/account/api";
import { orderParamToId } from "~/lib/account/order-id";
import { STORE_INFO } from "~/lib/content/site";
import { customerAccountContext } from "~/lib/customer-account";

import type { Route } from "./+types/account.order";

const ACCOUNT_PATH = "/account";

export function meta({ loaderData }: Route.MetaArgs) {
  const name = loaderData?.status === "ready" ? ` ${loaderData.order.name}` : "";
  return [
    { title: `Замовлення${name} — Ionov Store` },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

/**
 * API може сказати «такого замовлення немає» помилкою, а не порожньою відповіддю.
 * «Field … doesn't exist» сюди не належить: це збій запиту, а не відсутнє замовлення.
 */
function isNotFound(errors: readonly AccountGraphqlError[]): boolean {
  return errors.some(
    (error) =>
      /NOT_FOUND/.test(String(error.extensions?.code ?? "")) ||
      /not found|invalid id/i.test(error.message),
  );
}

export async function loader({ context, params }: Route.LoaderArgs) {
  const id = orderParamToId(params.id);
  if (!id) throw new Response("Not Found", { status: 404 });

  // Без входу (і без налаштованого кабінету) показуємо стан входу на сторінці кабінету.
  const access = await getCustomerAccess(context.get(customerAccountContext));
  if (!access) throw redirect(ACCOUNT_PATH);

  const { client, accessToken } = access;
  const variables = { id };

  // Основний запит вирішує долю сторінки; два другорядні лише додають блоки.
  const [core, adjustments, shipments] = await Promise.all([
    client.graphql(ORDER_QUERY, { accessToken, variables }).catch((error: unknown) => {
      logAccountFailure("AccountOrder", error);
      return null;
    }),
    optionalAccountData("AccountOrderAdjustments", () =>
      client.graphql(ORDER_ADJUSTMENTS_QUERY, { accessToken, variables }),
    ),
    optionalAccountData("AccountOrderShipments", () =>
      client.graphql(ORDER_SHIPMENTS_QUERY, { accessToken, variables }),
    ),
  ]);

  if (!core) return { status: "error" } as const;

  const order = core.data?.order ?? null;
  const failed = logAccountErrors("AccountOrder", core.errors);
  if (!order) {
    // Чуже або неіснуюче замовлення — звичайна 404; будь-який інший збій — стан помилки.
    if (!failed || isNotFound(core.errors ?? [])) throw new Response("Not Found", { status: 404 });
    return { status: "error" } as const;
  }

  return {
    status: "ready",
    order,
    adjustments: adjustments?.order ?? null,
    shipments: shipments?.order?.fulfillments.nodes ?? null,
  } as const;
}

export default function AccountOrderRoute({ loaderData, params }: Route.ComponentProps) {
  return (
    <main id="main-content" tabIndex={-1} className="flex-1 py-8 outline-none md:py-12">
      {loaderData.status === "ready" ? (
        <OrderDetails
          order={loaderData.order}
          adjustments={loaderData.adjustments}
          shipments={loaderData.shipments}
          store={STORE_INFO}
        />
      ) : (
        <Container className="flex flex-col gap-8">
          <h1 className="text-h2 text-ink">Замовлення</h1>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-8">
            <AccountNotice
              icon={<CircleAlert strokeWidth={2} />}
              title="Не вдалося завантажити замовлення"
              description="Щось пішло не так, але із замовленням усе гаразд. Спробуйте ще раз за хвилину або поверніться до списку замовлень."
              actions={
                <>
                  <Button asChild>
                    {/* Звичайний <a>: повне перезавантаження сторінки заново запитує дані. */}
                    <a href={`${ACCOUNT_PATH}/orders/${params.id}`}>
                      <RotateCw aria-hidden="true" strokeWidth={2} />
                      Спробувати ще раз
                    </a>
                  </Button>
                  <Button asChild variant="secondary">
                    <Link viewTransition to={ACCOUNT_PATH}>
                      <ArrowLeft aria-hidden="true" strokeWidth={2} />
                      До замовлень
                    </Link>
                  </Button>
                </>
              }
            />
            <ContactCard
              store={STORE_INFO}
              title="Потрібна допомога?"
              description="Напишіть або зателефонуйте — підкажемо стан замовлення без кабінету."
            />
          </div>
        </Container>
      )}
    </main>
  );
}
