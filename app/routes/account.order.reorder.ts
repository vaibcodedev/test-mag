import { ORDER_REORDER_QUERY } from "~/graphql/queries/account-order.query";
import { REORDER_VARIANTS_QUERY } from "~/graphql/queries/reorder-variants.query";
import { getCustomerAccess, logAccountErrors, logAccountFailure } from "~/lib/account/api";
import { orderParamToId } from "~/lib/account/order-id";
import {
  buildReorderPlan,
  reorderVariantIds,
  type ReorderPlan,
  type ReorderVariant,
} from "~/lib/account/reorder";
import { customerAccountContext } from "~/lib/customer-account";
import { logGraphqlErrors } from "~/lib/shopify/errors";
import { storefrontClientContext } from "~/lib/storefront";

import type { Route } from "./+types/account.order.reorder";

/** План стосується одного покупця й залежить від наявності просто зараз: не кешується. */
const HEADERS = { "Cache-Control": "private, no-store" };

type ReorderError = { error: string };

function json(body: ReorderPlan | ReorderError, status = 200) {
  return Response.json(body, { status, headers: HEADERS });
}

/**
 * GET /account/orders/:id/reorder — план повторення замовлення.
 *
 * Позиції замовлення беремо з Customer Account API (лише свого покупця), а чи продається
 * кожен варіант зараз — зі Storefront API, того самого, з яким працює кошик. Відповідь:
 * рядки для `window.Shopify.actions.updateCart` і перелік пропущених позицій із причинами.
 * Сам кошик змінює браузер (~/hooks/use-reorder): так зміна проходить через стор кошика.
 */
export async function loader({ context, params }: Route.LoaderArgs) {
  const id = orderParamToId(params.id);
  if (!id) return json({ error: "Замовлення не знайдено." }, 404);

  const access = await getCustomerAccess(context.get(customerAccountContext));
  if (!access) return json({ error: "Увійдіть у кабінет, щоб повторити замовлення." }, 401);

  let lines;
  try {
    const { data, errors } = await access.client.graphql(ORDER_REORDER_QUERY, {
      accessToken: access.accessToken,
      variables: { id },
    });
    const failed = logAccountErrors("AccountOrderReorder", errors);
    if (!data?.order) {
      return failed
        ? json({ error: "Не вдалося завантажити замовлення. Спробуйте ще раз." }, 502)
        : json({ error: "Замовлення не знайдено." }, 404);
    }
    lines = data.order.lineItems.nodes;
  } catch (error) {
    logAccountFailure("AccountOrderReorder", error);
    return json({ error: "Не вдалося завантажити замовлення. Спробуйте ще раз." }, 502);
  }

  const ids = reorderVariantIds(lines);
  if (ids.length === 0) return json(buildReorderPlan(lines, []));

  try {
    // Без кешу: наявність має бути свіжою.
    const result = await context
      .get(storefrontClientContext)
      .graphql(REORDER_VARIANTS_QUERY, { variables: { ids } });
    // Помилка означає, що про частину варіантів нічого не відомо: вважати їх знятими
    // з продажу не можна, тож плану немає.
    if (logGraphqlErrors("ReorderVariants", result) || !result.data) {
      return json({ error: "Не вдалося перевірити наявність товарів. Спробуйте ще раз." }, 502);
    }

    const variants = result.data.nodes.flatMap((node): ReorderVariant[] =>
      node?.__typename === "ProductVariant" ? [node] : [],
    );
    return json(buildReorderPlan(lines, variants));
  } catch (error) {
    console.error("[storefront] ReorderVariants: запит не вдався", error);
    return json({ error: "Не вдалося перевірити наявність товарів. Спробуйте ще раз." }, 502);
  }
}
