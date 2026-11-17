import type { PredictiveSearchStatus } from "@shopify/hydrogen";
import { ArrowRight, LayoutGrid, Search } from "lucide-react";
import type { ComponentProps, Ref } from "react";
import { Link } from "react-router";

import { Alert, AlertDescription } from "~/components/ui/alert";
import { CommandEmpty, CommandGroup, CommandItem, CommandList } from "~/components/ui/command";
import { Item, ItemContent, ItemMedia } from "~/components/ui/item";
import { Separator } from "~/components/ui/separator";
import { ShopImage } from "~/components/ui/shop-image";
import { Spinner } from "~/components/ui/spinner";
import { STORE_INFO } from "~/lib/content/site";
import { formatPrice } from "~/lib/format";
import { cn } from "~/lib/utils";

import type { PredictiveOption, PredictiveOptions } from "./predictive-options";

const THUMB_FALLBACK_SIZE = 96;
const THUMB_WIDTHS = [48, 96, 144] as const;
/** Фото товару заповнює мініатюру цілком, без полів і змішування з тлом. */
const THUMB = "rounded-sm";

export type PredictiveListProps = Omit<ComponentProps<"div">, "children" | "onSelect"> & {
  /** Елемент listbox: його id поле пошуку ставить в aria-controls. */
  listRef?: Ref<HTMLDivElement>;
  status: PredictiveSearchStatus;
  options: PredictiveOptions;
  /** Клік по опції; сам перехід робить посилання. */
  onSelect?: (option: PredictiveOption) => void;
};

/** Чи є в списку хоч одна опція, тобто чи рендериться listbox. */
export function hasPredictiveOptions(
  status: PredictiveSearchStatus,
  options: PredictiveOptions,
): boolean {
  if (status === "idle") return false;
  if (status === "success" && options.groups.length === 0) return false;
  return options.flat.length > 0;
}

function OptionVisual({ option }: { option: PredictiveOption }) {
  if (option.kind === "product" || option.kind === "collection") {
    if (option.image) {
      return (
        <ItemMedia variant="image" size="sm" fit="cover" className={THUMB}>
          <ShopImage
            src={option.image.url}
            alt=""
            width={option.image.width ?? THUMB_FALLBACK_SIZE}
            height={option.image.height ?? THUMB_FALLBACK_SIZE}
            sizes="48px"
            widths={THUMB_WIDTHS}
          />
        </ItemMedia>
      );
    }
    return (
      <ItemMedia variant="icon">
        <LayoutGrid aria-hidden="true" strokeWidth={2} />
      </ItemMedia>
    );
  }

  return (
    <ItemMedia variant="icon">
      {option.kind === "all" ? (
        <ArrowRight aria-hidden="true" strokeWidth={2} className="text-blue" />
      ) : (
        <Search aria-hidden="true" strokeWidth={2} />
      )}
    </ItemMedia>
  );
}

/**
 * Рядок підказки: CommandItem поверх справжнього посилання (asChild), тож адреса з параметрами
 * відстеження відкривається і кліком, і в новій вкладці. id опції — наш, а не згенерований cmdk:
 * на нього посилається aria-activedescendant поля.
 */
function OptionRow({
  option,
  onSelect,
}: { option: PredictiveOption } & Pick<PredictiveListProps, "onSelect">) {
  return (
    <CommandItem asChild value={option.id} onSelect={() => onSelect?.(option)} className="py-1.5">
      <Link viewTransition id={option.id} data-kind={option.kind} tabIndex={-1} to={option.href}>
        <OptionVisual option={option} />
        <ItemContent>
          <span className={cn("line-clamp-2", option.kind === "all" && "font-semibold text-blue")}>
            {option.title}
          </span>
        </ItemContent>
        {option.price ? (
          <span className="shrink-0 font-semibold text-ink tabular-nums">
            {formatPrice(option.price)}
          </span>
        ) : null}
      </Link>
    </CommandItem>
  );
}

/**
 * Вміст спливного шару пошуку: стани «шукаємо», «помилка», «нічого не знайшли» і список
 * підказок на cmdk — запити, товари, категорії та рядок «Усі результати».
 * Має стояти всередині <Command>: вибір стрілками й мишею веде саме він,
 * а результат для екранних читачів озвучує live-регіон поруч із полем.
 */
export function PredictiveList({
  listRef,
  status,
  options,
  onSelect,
  className,
  ...props
}: PredictiveListProps) {
  if (status === "idle") return null;

  const { groups, all } = options;
  const empty = status === "success" && groups.length === 0;
  const stale = status === "loading" && groups.length > 0;

  return (
    <div
      role="presentation"
      data-slot="predictive-list"
      data-status={status}
      // Натискання мишею не має забирати фокус із поля: інакше список закриється раніше за клік.
      onMouseDown={(event) => event.preventDefault()}
      // Клавіші всередині шару (Enter на посиланні в Telegram) не належать списку підказок.
      onKeyDown={(event) => event.stopPropagation()}
      className={cn("flex flex-col", className)}
      {...props}
    >
      {status === "loading" && groups.length === 0 ? (
        <Item size="sm">
          <ItemMedia>
            <Spinner aria-hidden="true" />
          </ItemMedia>
          <ItemContent>Шукаємо…</ItemContent>
        </Item>
      ) : null}

      {status === "error" ? (
        <Alert variant="danger">
          <AlertDescription>
            Підказки зараз недоступні. Натисніть Enter, щоб відкрити всі результати.
          </AlertDescription>
        </Alert>
      ) : null}

      {empty ? (
        <CommandEmpty data-slot="predictive-empty" className="py-4 text-start">
          Нічого не знайшли. Перевірте назву або{" "}
          <a
            href={STORE_INFO.telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm font-semibold text-blue underline-offset-4 focus-ring hover:underline"
          >
            напишіть нам у Telegram
          </a>
          .
        </CommandEmpty>
      ) : (
        <CommandList
          ref={listRef}
          label="Підказки пошуку"
          aria-busy={stale || undefined}
          className="max-h-[min(70dvh,32rem)] p-0"
        >
          {groups.map((group) => (
            <CommandGroup
              key={group.key}
              heading={group.heading}
              data-group={group.key}
              className={cn(stale && "opacity-60")}
            >
              {group.options.map((option) => (
                <OptionRow key={option.id} option={option} onSelect={onSelect} />
              ))}
            </CommandGroup>
          ))}
          {all ? (
            <>
              {groups.length > 0 ? <Separator className="my-1.5" /> : null}
              <OptionRow option={all} onSelect={onSelect} />
            </>
          ) : null}
        </CommandList>
      )}
    </div>
  );
}
