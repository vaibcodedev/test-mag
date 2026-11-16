import { AccountView } from "~/components/account/account-view";
import { ACCOUNT_QUERY } from "~/graphql/queries/account.query";
import { STORE_INFO } from "~/lib/content/site";
import { customerAccountContext } from "~/lib/customer-account";

import type { Route } from "./+types/account";

const ORDERS_PAGE_SIZE = 10;

export function meta() {
  return [
    { title: "Особистий кабінет — Сад" },
    { name: "description", content: "Ваші замовлення в магазині «Сад»: дати, статуси й суми." },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const customerAccount = context.get(customerAccountContext);
  if (!customerAccount) return { status: "unavailable" } as const;

  const { client, session, sessionManager, requestContext } = customerAccount;
  // Reading the token marks the response as personalized, so it is never cached.
  const accessToken = await session.getOrRefreshAccessToken(sessionManager, requestContext);
  const searchParams = new URL(request.url).searchParams;
  if (!accessToken) {
    return { status: "signed-out", loginFailed: searchParams.get("login") === "failed" } as const;
  }

  const before = searchParams.get("before");
  const variables = before
    ? { last: ORDERS_PAGE_SIZE, before }
    : { first: ORDERS_PAGE_SIZE, after: searchParams.get("after") };

  try {
    const { data, errors } = await client.graphql(ACCOUNT_QUERY, { accessToken, variables });
    // Текст помилки API англійський і технічний, тому покупцю показуємо власне пояснення.
    if (errors || !data.customer) return { status: "error" } as const;
    return { status: "signed-in", customer: data.customer } as const;
  } catch {
    return { status: "error" } as const;
  }
}

export default function AccountRoute({ loaderData }: Route.ComponentProps) {
  return (
    <main id="main-content" tabIndex={-1} className="flex-1 py-12 outline-none">
      <AccountView state={loaderData} store={STORE_INFO} />
    </main>
  );
}
