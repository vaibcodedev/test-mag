import { ArrowRight, Info, Plus, ShoppingCart, X } from "lucide-react";
import { Fragment, useId, useMemo, useState, type ComponentProps } from "react";
import { Link } from "react-router";

import { Alert, AlertDescription } from "~/components/ui/alert";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Price } from "~/components/ui/price";
import { ShopImage } from "~/components/ui/shop-image";
import { Switch } from "~/components/ui/switch";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import type { CompareCategory } from "~/lib/compare/spec-schema";
import { plural } from "~/lib/format";
import { COMPARE_LIMIT, type SavedProduct } from "~/lib/saved-lists";
import { cn } from "~/lib/utils";

import { buildCompareSections } from "./compare-rows";

const IMAGE_FALLBACK_SIZE = 600;
const IMAGE_SIZES = "(min-width: 48rem) 12rem, 9rem";

/**
 * Колонка назв рядків. На телефоні вона забрала б третину екрана, тому там її бачать лише
 * читачі екрана, а назва рядка стоїть окремим рядком над значеннями (MobileLabelRow).
 * Від md колонка лишається на місці під час горизонтальної прокрутки.
 */
const LABEL_CELL =
  "max-md:sr-only md:sticky md:inset-s-0 md:z-10 md:w-52 md:min-w-52 md:bg-surface md:align-top";
/** На телефоні в екран уміщаються два товари й видно край третього. */
const PRODUCT_CELL = "w-40 min-w-40 px-3 align-top md:w-60 md:min-w-60 md:px-4";
/** Пунктирна плитка «Додати»: спільний вигляд двох її половин. */
const ADD_TILE =
  "flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-line px-4 text-center text-small font-semibold text-ink-2 focus-ring transition-colors duration-150 hover:text-blue";
/** Текст у широкій клітинці, який не тікає за край під час горизонтальної прокрутки. */
const PINNED_TEXT = "sticky inset-s-3 inline-block md:inset-s-4";
/**
 * Рядок із назвою, ціною та «Купити» лишається під шапкою сайту, поки гортаємо характеристики.
 * Лише від xl: там таблиця вміщується без горизонтальної прокрутки, а прокрутка всередині
 * обгортки вимикає прилипання до вікна.
 */
const STICKY_CELL = cn(
  "bg-surface xl:sticky xl:top-(--header-height) xl:z-20",
  // Край липкої смуги: тонка лінія й коротка тінь під нею. Малює псевдоелемент — тінь і межа
  // самої клітинки в таблиці зі спільними межами не видно.
  "xl:after:pointer-events-none xl:after:absolute xl:after:inset-x-0 xl:after:top-full xl:after:h-3",
  "xl:after:border-t xl:after:border-line xl:after:bg-linear-to-b xl:after:from-ink/8 xl:after:to-transparent",
);

export type CompareTableProps = Omit<ComponentProps<"div">, "children"> & {
  /** Категорія задає групи й рядки характеристик. */
  category: CompareCategory;
  /** Товари однієї категорії; показуються перші чотири. */
  products: readonly SavedProduct[];
  onRemove?: (product: SavedProduct) => void;
  onAddToCart?: (product: SavedProduct) => void;
  /** handle товару, який зараз додається в кошик. */
  addingHandle?: string | null;
};

/**
 * Таблиця порівняння однієї категорії: товари в колонках, характеристики в рядках за групами.
 * На телефоні прокручується горизонтально всередині себе, тож сторінка не ширшає.
 */
export function CompareTable({
  category,
  products: allProducts,
  onRemove,
  onAddToCart,
  addingHandle,
  className,
  ...props
}: CompareTableProps) {
  const [onlyDifferences, setOnlyDifferences] = useState(false);
  const toggleId = useId();

  const products = useMemo(() => allProducts.slice(0, COMPARE_LIMIT), [allProducts]);
  const sections = useMemo(() => buildCompareSections(products, category), [products, category]);
  const canCompare = products.length > 1;
  const filtering = canCompare && onlyDifferences;
  const visibleSections = sections
    .map((section) => ({
      ...section,
      rows: filtering ? section.rows.filter((row) => row.differs) : section.rows,
    }))
    .filter((section) => section.rows.length > 0);

  if (products.length === 0) return null;

  const freeSlots = COMPARE_LIMIT - products.length;
  const columns = products.length + 1 + (freeSlots > 0 ? 1 : 0);
  const collectionHref = `/collections/${category.key}`;

  return (
    <div
      data-slot="compare-table"
      className={cn("flex w-fit max-w-full flex-col gap-4", className)}
      {...props}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <p className="text-body text-ink-2">
          {products.length} з {COMPARE_LIMIT}{" "}
          {plural(COMPARE_LIMIT, { one: "моделі", few: "моделей", many: "моделей" })}{" "}
          {category.title}
          {freeSlots === 0 ? ". Щоб додати іншу, приберіть одну зі списку." : null}
        </p>
        {canCompare ? (
          <div className="flex min-h-11 w-fit items-center gap-3">
            <Switch id={toggleId} checked={onlyDifferences} onCheckedChange={setOnlyDifferences} />
            <Label htmlFor={toggleId} className="min-h-11 cursor-pointer">
              Лише відмінності
            </Label>
          </div>
        ) : null}
      </div>

      <Table
        scrollLabel={`Таблиця порівняння: ${category.title}`}
        containerClassName="w-fit max-w-full rounded-xl bg-surface xl:overflow-visible xl:focus-visible:shadow-none"
        className="w-auto md:[&_tbody_tr:last-child>*:first-child]:rounded-es-xl"
      >
        <TableCaption className="sr-only">
          Порівняння характеристик {category.title}: {products.length}{" "}
          {plural(products.length, { one: "товар", few: "товари", many: "товарів" })}
        </TableCaption>
        <TableHeader>
          {/* Фото та «прибрати»: цей рядок гортається разом зі сторінкою. */}
          <TableRow className="border-b-0">
            <TableHead className={cn(LABEL_CELL, "rounded-ss-xl")}>
              <span className="sr-only">Характеристика</span>
            </TableHead>
            {products.map((product) => (
              <TableHead key={product.handle} className={cn(PRODUCT_CELL, "pt-4 pb-0")}>
                <div className="relative">
                  <AspectRatio ratio={1} className="overflow-hidden rounded-md bg-photo">
                    {product.image ? (
                      <ShopImage
                        src={product.image.url}
                        alt=""
                        width={product.image.width ?? IMAGE_FALLBACK_SIZE}
                        height={product.image.height ?? IMAGE_FALLBACK_SIZE}
                        sizes={IMAGE_SIZES}
                        className={cn(
                          "size-full object-cover",
                          !product.availableForSale && "opacity-50",
                        )}
                      />
                    ) : null}
                  </AspectRatio>
                  {onRemove ? (
                    <Button
                      variant="surface"
                      size="icon"
                      aria-label={`Прибрати з порівняння: ${product.title}`}
                      onClick={() => onRemove(product)}
                      className="absolute end-2 top-2"
                    >
                      <X strokeWidth={2} aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              </TableHead>
            ))}
            {freeSlots > 0 ? (
              <TableHead className={cn(PRODUCT_CELL, "rounded-se-xl pt-4 pb-0")}>
                {/* Вільне місце в таблиці веде до каталогу цієї ж категорії. Плитка тягнеться
                    на два рядки шапки: це її верхня половина, нижня — в липкому рядку. */}
                <Link
                  viewTransition
                  to={collectionHref}
                  prefetch="intent"
                  data-slot="compare-add"
                  className={cn(ADD_TILE, "aspect-square rounded-b-none border-b-0 pt-4")}
                >
                  <span className="flex size-11 items-center justify-center rounded-pill bg-page text-ink">
                    <Plus strokeWidth={2} aria-hidden="true" className="size-5" />
                  </span>
                  Додати {category.title}
                </Link>
              </TableHead>
            ) : null}
          </TableRow>

          {/* Назва, ціна й «Купити»: від xl рядок прилипає під шапкою сайту. */}
          <TableRow data-slot="compare-summary" className="border-b-0">
            <TableHead className={cn(LABEL_CELL, STICKY_CELL, "xl:z-30")}>
              <span className="sr-only">Товар</span>
            </TableHead>
            {products.map((product) => (
              <TableHead
                key={product.handle}
                className={cn(PRODUCT_CELL, STICKY_CELL, "pt-2 pb-4")}
              >
                <div className="flex h-full flex-col gap-1 text-start">
                  {/* Назва товару лишається звичайним ink-посиланням, як у картці товару. */}
                  <Link
                    viewTransition
                    to={`/products/${product.handle}`}
                    prefetch="intent"
                    className="inline-flex min-h-11 items-center rounded-sm text-card-title text-ink focus-ring hover:text-blue"
                  >
                    <span className="line-clamp-1">{product.title}</span>
                  </Link>
                  <Price
                    price={product.price}
                    compareAt={product.availableForSale ? product.compareAtPrice : null}
                    from={product.priceFrom}
                    showSavings={false}
                    className="text-ink"
                  />
                  {product.availableForSale && product.variantId ? (
                    <Button
                      className="mt-1 w-full"
                      onClick={onAddToCart ? () => onAddToCart(product) : undefined}
                      loading={addingHandle === product.handle}
                    >
                      <ShoppingCart strokeWidth={2} aria-hidden="true" />
                      Купити
                      <span className="sr-only">: {product.title}</span>
                    </Button>
                  ) : (
                    <Button asChild variant="secondary" className="mt-1 w-full">
                      <Link
                        viewTransition
                        to={`/products/${product.handle}`}
                        prefetch="intent"
                        aria-label={`${product.availableForSale ? "Обрати варіант" : "Докладніше"}: ${product.title}`}
                      >
                        {product.availableForSale ? "Обрати варіант" : "Докладніше"}
                      </Link>
                    </Button>
                  )}
                </div>
              </TableHead>
            ))}
            {freeSlots > 0 ? (
              <TableHead className={cn(PRODUCT_CELL, STICKY_CELL, "relative")}>
                {/* Нижня половина плитки. Коли рядок прилип, вона лишається на видноті. */}
                <Link
                  viewTransition
                  to={collectionHref}
                  prefetch="intent"
                  data-slot="compare-add-more"
                  className={cn(
                    ADD_TILE,
                    "absolute inset-x-3 top-0 bottom-4 rounded-t-none border-t-0 pb-4 md:inset-x-4",
                  )}
                >
                  <span className="text-caption font-medium text-muted-foreground">
                    Ще {freeSlots}{" "}
                    {plural(freeSlots, { one: "місце", few: "місця", many: "місць" })}
                  </span>
                  <span className="inline-flex items-center gap-1 text-blue">
                    Обрати в каталозі
                    <span className="sr-only">: {category.title}</span>
                    <ArrowRight strokeWidth={2} aria-hidden="true" className="size-4" />
                  </span>
                </Link>
              </TableHead>
            ) : null}
          </TableRow>
        </TableHeader>

        <TableBody>
          {visibleSections.map((section) => (
            <Fragment key={section.id}>
              <TableRow data-section={section.id} className="border-b-0">
                <TableHead
                  scope="colgroup"
                  colSpan={columns}
                  className="h-auto bg-page px-3 pt-5 pb-2 text-small font-semibold text-ink md:px-4"
                >
                  <span className={PINNED_TEXT}>{section.title}</span>
                </TableHead>
              </TableRow>
              {section.rows.map((row) => (
                <Fragment key={row.id}>
                  {/* Лише для ока на телефоні: читачі екрана беруть назву із заголовка рядка. */}
                  <TableRow aria-hidden="true" className="border-b-0 md:hidden">
                    <TableCell
                      colSpan={columns}
                      className="px-3 pt-3 pb-0 text-caption font-semibold text-muted-foreground"
                    >
                      <span className={PINNED_TEXT}>{row.label}</span>
                    </TableCell>
                  </TableRow>
                  <TableRow data-row={row.id} data-differs={row.differs}>
                    <TableHead scope="row" className={LABEL_CELL}>
                      {row.label}
                    </TableHead>
                    {row.cells.map((cell, index) => (
                      <TableCell key={products[index]?.handle ?? index} className={PRODUCT_CELL}>
                        {cell.content}
                      </TableCell>
                    ))}
                    {freeSlots > 0 ? <TableCell className={PRODUCT_CELL} /> : null}
                  </TableRow>
                </Fragment>
              ))}
            </Fragment>
          ))}
        </TableBody>
      </Table>

      {filtering && visibleSections.length === 0 ? (
        <Alert variant="surface">
          <Info aria-hidden="true" strokeWidth={2} />
          <AlertDescription>
            За цими характеристиками товари однакові. Вимкніть «Лише відмінності», щоб побачити всі
            рядки.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
