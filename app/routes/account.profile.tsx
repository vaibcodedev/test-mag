import { ArrowLeft, CircleAlert, RotateCw } from "lucide-react";
import { Link, redirect, useNavigation } from "react-router";

import { AccountNotice } from "~/components/account/account-notice";
import {
  ProfileView,
  type ProfileData,
  type ProfilePending,
} from "~/components/account/profile-view";
import { ContactCard } from "~/components/content/contact-card";
import { Container } from "~/components/layout/container";
import { Button } from "~/components/ui/button";
import {
  PROFILE_MARKETING_QUERY,
  PROFILE_PHONE_QUERY,
  PROFILE_QUERY,
} from "~/graphql/queries/account-profile.query";
import {
  getCustomerAccess,
  logAccountErrors,
  logAccountFailure,
  optionalAccountData,
} from "~/lib/account/api";
import { marketingStatus, runProfileAction } from "~/lib/account/profile";
import { STORE_INFO } from "~/lib/content/site";
import { customerAccountContext } from "~/lib/customer-account";

import type { Route } from "./+types/account.profile";

const ACCOUNT_PATH = "/account";
const PROFILE_PATH = "/account/profile";

export function meta() {
  return [{ title: "Профіль — Ionov Store" }, { name: "robots", content: "noindex, nofollow" }];
}

export async function loader({ context }: Route.LoaderArgs) {
  // Без входу (і без налаштованого кабінету) показуємо стан входу на сторінці кабінету.
  const access = await getCustomerAccess(context.get(customerAccountContext));
  if (!access) throw redirect(ACCOUNT_PATH);

  const { client, accessToken } = access;
  // Ім'я й пошта вирішують долю сторінки; розсилка й телефон — окремі запити: якщо магазин
  // їх не віддасть, відповідний блок стане недоступним, а решта працюватиме.
  const [base, marketing, phone] = await Promise.all([
    client.graphql(PROFILE_QUERY, { accessToken }).catch((error: unknown) => {
      logAccountFailure("AccountProfile", error);
      return null;
    }),
    optionalAccountData("AccountProfileMarketing", () =>
      client.graphql(PROFILE_MARKETING_QUERY, { accessToken }),
    ),
    optionalAccountData("AccountProfilePhone", () =>
      client.graphql(PROFILE_PHONE_QUERY, { accessToken }),
    ),
  ]);

  if (!base) return { status: "error" } as const;
  if (logAccountErrors("AccountProfile", base.errors) || !base.data?.customer) {
    return { status: "error" } as const;
  }

  const { customer } = base.data;
  const email = customer.emailAddress?.emailAddress ?? null;
  const defaultAddress = phone?.customer.defaultAddress;

  const profile: ProfileData = {
    firstName: customer.firstName,
    lastName: customer.lastName,
    email,
    phone: !phone
      ? { status: "unavailable" }
      : defaultAddress
        ? { status: "editable", value: defaultAddress.phoneNumber ?? "" }
        : { status: "no-address" },
    // Без пошти підписувати нікуди, тож перемикач недоступний.
    marketing: email
      ? marketingStatus(marketing?.customer.emailAddress?.marketingState)
      : "unavailable",
  };

  return { status: "ready", profile } as const;
}

export async function action({ context, request }: Route.ActionArgs) {
  const access = await getCustomerAccess(context.get(customerAccountContext));
  // Сесія закінчилась, доки форма була відкрита: показуємо стан входу.
  if (!access) throw redirect(ACCOUNT_PATH);

  const result = await runProfileAction(access, await request.formData());
  if (!result) throw new Response("Bad Request", { status: 400 });
  return result;
}

function pendingOf(navigation: ReturnType<typeof useNavigation>): ProfilePending {
  const formData = navigation.state === "idle" ? undefined : navigation.formData;
  const intent = formData?.get("intent");
  if (intent === "profile") return { intent };
  if (intent === "marketing") {
    return {
      intent,
      target: formData?.get("marketing") === "unsubscribe" ? "unsubscribe" : "subscribe",
    };
  }
  return null;
}

export default function AccountProfileRoute({ loaderData, actionData }: Route.ComponentProps) {
  const navigation = useNavigation();

  return (
    <main id="main-content" tabIndex={-1} className="flex-1 py-8 outline-none md:py-12">
      {loaderData.status === "ready" ? (
        <ProfileView
          profile={loaderData.profile}
          result={actionData ?? null}
          pending={pendingOf(navigation)}
        />
      ) : (
        <Container className="flex flex-col gap-8">
          <h1 className="text-h2 text-ink">Профіль</h1>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-8">
            <AccountNotice
              icon={<CircleAlert strokeWidth={2} />}
              title="Не вдалося завантажити профіль"
              description="Щось пішло не так, але з вашими даними все гаразд. Спробуйте ще раз за хвилину."
              actions={
                <>
                  <Button asChild>
                    {/* Звичайний <a>: повне перезавантаження сторінки заново запитує дані. */}
                    <a href={PROFILE_PATH}>
                      <RotateCw aria-hidden="true" strokeWidth={2} />
                      Спробувати ще раз
                    </a>
                  </Button>
                  <Button asChild variant="secondary">
                    <Link viewTransition to={ACCOUNT_PATH}>
                      <ArrowLeft aria-hidden="true" strokeWidth={2} />
                      До кабінету
                    </Link>
                  </Button>
                </>
              }
            />
            <ContactCard store={STORE_INFO} title="Потрібна допомога?" />
          </div>
        </Container>
      )}
    </main>
  );
}
