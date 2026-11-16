import { PackageSearch, SearchX } from "lucide-react";
import { Link } from "react-router";

import { ProductGridEmpty, type ProductGridEmptyProps } from "~/components/product/product-grid";
import { Button } from "~/components/ui/button";

export type CollectionEmptyProps = Omit<
  ProductGridEmptyProps,
  "icon" | "title" | "description" | "children"
> & {
  /** true — товари сховали фільтри; false — колекція порожня сама по собі. */
  filtered: boolean;
  /** Адреса колекції без фільтрів. */
  resetHref: string;
};

/** Порожня колекція: пояснює, чому товарів немає, і пропонує наступний крок. */
export function CollectionEmpty({ filtered, resetHref, ...props }: CollectionEmptyProps) {
  if (filtered) {
    return (
      <ProductGridEmpty
        icon={<SearchX strokeWidth={2} />}
        title="За цими фільтрами нічого не знайшлося"
        description="Жоден товар не відповідає всім вибраним умовам одразу. Розширте діапазон ціни чи приберіть один із фільтрів — або скиньте їх усі."
        {...props}
      >
        <Button asChild>
          <Link to={resetHref} preventScrollReset>
            Скинути фільтри
          </Link>
        </Button>
      </ProductGridEmpty>
    );
  }

  return (
    <ProductGridEmpty
      icon={<PackageSearch strokeWidth={2} />}
      title="Тут поки немає товарів"
      description="Ми ще наповнюємо цю категорію. Подивіться інші розділи каталогу або напишіть нам — підкажемо, коли товар з'явиться."
      {...props}
    >
      <Button asChild>
        <Link to="/collections">Перейти до каталогу</Link>
      </Button>
    </ProductGridEmpty>
  );
}
