import { Info, ShoppingCart, X } from "lucide-react";
import { useId, useMemo, useState, type ComponentProps } from "react";
import { Link } from "react-router";

import { Alert, AlertDescription } from "~/components/ui/alert";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { ShopImage } from "~/components/ui/shop-image";
import { Switch } from "~/components/ui/switch";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { plural } from "~/lib/format";
import type { SavedProduct } from "~/lib/saved-lists";
import { cn } from "~/lib/utils";

import { buildCompareRows } from "./compare-rows";

const IMAGE_FALLBACK_SIZE = 600;
const IMAGE_SIZES = "(min-width: 48rem) 15rem, 10rem";

/** Ширини колонок: назви рядків вужчі, товари ширші; на телефоні таблиця прокручується. */
const LABEL_CELL = "w-32 min-w-32 align-top break-words hyphens-auto md:w-48 md:min-w-48";
const PRODUCT_CELL = "w-44 min-w-44 align-top md:w-60 md:min-w-60";

export type CompareTableProps = Omit<ComponentProps<"div">, "children"> & {
  products: readonly SavedProduct[];
  onRemove?: (product: SavedProduct) => void;
  onAddToCart?: (product: SavedProduct) => void;
  /** handle товару, який зараз додається в кошик. */
  addingHandle?: string | null;
};

/**
 * Таблиця порівняння: товари в колонках, характеристики в рядках.
 * Прокручується горизонтально всередині себе, тож сторінка на телефоні не ширшає.
 */
export function CompareTable({
  products,
  onRemove,
  onAddToCart,
  addingHandle,
  className,
  ...props
}: CompareTableProps) {
  const [onlyDifferences, setOnlyDifferences] = useState(false);
  const toggleId = useId();

  const rows = useMemo(() => buildCompareRows(products), [products]);
  const canCompare = products.length > 1;
  const filtering = canCompare && onlyDifferences;
  const visibleRows = filtering ? rows.filter((row) => row.differs) : rows;

  if (products.length === 0) return null;

  return (
    <div data-slot="compare-table" className={cn("flex flex-col gap-4", className)} {...props}>
      {canCompare ? (
        <div className="flex min-h-11 w-fit items-center gap-3">
          <Switch id={toggleId} checked={onlyDifferences} onCheckedChange={setOnlyDifferences} />
          <Label htmlFor={toggleId} className="min-h-11 cursor-pointer">
            Лише відмінності
          </Label>
        </div>
      ) : null}

      <Table
        stickyFirstColumn
        scrollLabel="Таблиця порівняння товарів"
        containerClassName="w-fit max-w-full rounded-xl bg-surface"
        className="w-auto"
      >
        <TableCaption className="sr-only">
          Порівняння характеристик: {products.length}{" "}
          {plural(products.length, { one: "товар", few: "товари", many: "товарів" })}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className={LABEL_CELL}>
              <span className="sr-only">Характеристика</span>
            </TableHead>
            {products.map((product) => (
              <TableHead key={product.handle} className={PRODUCT_CELL}>
                <div className="relative flex flex-col gap-3 text-start">
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
                  {/* Назва товару лишається звичайним ink-посиланням, як у картці товару. */}
                  <Link
                    to={`/products/${product.handle}`}
                    prefetch="intent"
                    className="inline-flex min-h-11 items-center rounded-sm text-card-title text-ink focus-ring hover:text-blue"
                  >
                    <span className="line-clamp-3">{product.title}</span>
                  </Link>
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleRows.map((row) => (
            <TableRow key={row.id} data-row={row.id} data-differs={row.differs}>
              <TableHead scope="row" className={LABEL_CELL}>
                {row.label}
              </TableHead>
              {row.cells.map((cell, index) => (
                <TableCell key={products[index]?.handle ?? index} className={PRODUCT_CELL}>
                  {cell.content}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableHead scope="row" className={LABEL_CELL}>
              Купівля
            </TableHead>
            {products.map((product) => (
              <TableCell key={product.handle} className={PRODUCT_CELL}>
                {product.availableForSale ? (
                  <Button
                    className="w-full"
                    onClick={onAddToCart ? () => onAddToCart(product) : undefined}
                    loading={addingHandle === product.handle}
                  >
                    <ShoppingCart strokeWidth={2} aria-hidden="true" />
                    Купити
                    <span className="sr-only">: {product.title}</span>
                  </Button>
                ) : (
                  <Button asChild variant="secondary" className="w-full">
                    <Link
                      to={`/products/${product.handle}`}
                      prefetch="intent"
                      aria-label={`Докладніше: ${product.title}`}
                    >
                      Докладніше
                    </Link>
                  </Button>
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableFooter>
      </Table>

      {filtering && visibleRows.length === 0 ? (
        <Alert variant="info" className="bg-surface">
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
