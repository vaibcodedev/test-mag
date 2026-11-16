import {
  ArrowUpRight,
  ChevronDown,
  CreditCard,
  Scale,
  ShoppingCart,
  SlidersHorizontal,
  Trash2,
  User,
} from "lucide-react";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { toast } from "~/components/ui/sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";

import { Specimen, SpecimenRow, StyleguideSection } from "./styleguide-section";

const SEARCH_SUGGESTIONS = ["iPhone 17 Pro", "iPhone 17", "iPhone Air", "Чохол для iPhone 17 Pro"];
const SEARCH_CATEGORIES = ["iPhone", "Аксесуари для iPhone"];

export function OverlaysSection() {
  const [sort, setSort] = useState("popular");
  const [query, setQuery] = useState("iphone");

  return (
    <StyleguideSection
      id="overlays"
      title="Панелі, вікна, меню"
      description="Sheet — мобільне меню, кошик і фільтри. Dialog — підтвердження. Sonner — сповіщення на ink."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Specimen label="Sheet і Dialog">
          <SpecimenRow>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary">
                  <ShoppingCart aria-hidden="true" />
                  Кошик
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Кошик</SheetTitle>
                  <SheetDescription>1 товар на 64 999 ₴</SheetDescription>
                </SheetHeader>
                <SheetBody>
                  <p className="text-body text-ink-2">
                    iPhone 17 Pro 256 ГБ, синій титан. Доставимо завтра Новою поштою або
                    кур&apos;єром по Вінниці.
                  </p>
                </SheetBody>
                <SheetFooter>
                  <Button size="lg">Оформити замовлення</Button>
                  <SheetClose asChild>
                    <Button variant="ghost">Продовжити покупки</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary">
                  <SlidersHorizontal aria-hidden="true" />
                  Фільтри
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom">
                <SheetHeader>
                  <SheetTitle>Фільтри</SheetTitle>
                  <SheetDescription>Ціна, пам&apos;ять, колір і стан</SheetDescription>
                </SheetHeader>
                <SheetFooter>
                  <SheetClose asChild>
                    <Button>Показати 48 товарів</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary">Очистити кошик</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Очистити кошик?</DialogTitle>
                  <DialogDescription>
                    З кошика зникнуть усі 3 товари. Обране та порівняння залишаться.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="secondary">Залишити товари</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button variant="ink">Очистити кошик</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </SpecimenRow>
        </Specimen>

        <Specimen label="DropdownMenu, Tooltip, toast">
          <SpecimenRow>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary">
                  <User aria-hidden="true" />
                  Кабінет
                  <ChevronDown aria-hidden="true" className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Олена Коваль</DropdownMenuLabel>
                <DropdownMenuItem>Мої замовлення</DropdownMenuItem>
                <DropdownMenuItem>Обране</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Сортування</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
                  <DropdownMenuRadioItem value="popular">Спочатку популярні</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="price-asc">Спочатку дешевші</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Вийти</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary" size="icon" aria-label="Порівняння">
                  <Scale aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Порівняння: 2 товари</TooltipContent>
            </Tooltip>

            <Button
              onClick={() =>
                toast.success("Додано в кошик", {
                  description: "iPhone 17 Pro 256 ГБ, синій титан",
                })
              }
            >
              <ShoppingCart aria-hidden="true" />
              Показати toast
            </Button>
          </SpecimenRow>
        </Specimen>

        <Specimen label="AlertDialog і Popover" className="lg:col-span-2">
          <SpecimenRow>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="secondary">
                  <Trash2 aria-hidden="true" />
                  Видалити товар
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent size="sm">
                <AlertDialogHeader>
                  <AlertDialogMedia>
                    <Trash2 strokeWidth={2} />
                  </AlertDialogMedia>
                  <AlertDialogTitle>Видалити товар із кошика?</AlertDialogTitle>
                  <AlertDialogDescription>
                    iPhone 17 Pro 256 ГБ, синій титан. Його можна буде додати знову з каталогу.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Залишити</AlertDialogCancel>
                  <AlertDialogAction variant="ink">Видалити товар</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="secondary">
                  <CreditCard aria-hidden="true" />
                  Оплата частинами
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start">
                <PopoverHeader>
                  <PopoverTitle>4 800 ₴ на місяць</PopoverTitle>
                  <PopoverDescription>
                    25 платежів без переплат. Перший платіж — у день покупки.
                  </PopoverDescription>
                </PopoverHeader>
                <PopoverClose asChild>
                  <Button size="sm" className="w-fit">
                    Зрозуміло
                  </Button>
                </PopoverClose>
              </PopoverContent>
            </Popover>
          </SpecimenRow>
          <p className="text-small text-ink-2">
            AlertDialog не закривається кліком повз вікно: відповісти треба кнопкою. Кнопки
            називають дію, а не «Так / Ні».
          </p>
        </Specimen>

        <Specimen label="Command: підказки пошуку" tone="page" className="lg:col-span-2">
          <Command label="Пошук товарів" className="h-auto max-w-2xl border border-line">
            <CommandInput placeholder="Що шукаєте?" value={query} onValueChange={setQuery} />
            <CommandList>
              <CommandEmpty>
                Нічого не знайшли. Перевірте назву або напишіть нам у Telegram.
              </CommandEmpty>
              <CommandGroup heading="Товари">
                {SEARCH_SUGGESTIONS.map((suggestion) => (
                  <CommandItem
                    key={suggestion}
                    value={suggestion}
                    onSelect={(value) => toast(`Вибрано товар: ${value}`)}
                  >
                    {suggestion}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup heading="Категорії">
                {SEARCH_CATEGORIES.map((category) => (
                  <CommandItem
                    key={category}
                    value={category}
                    onSelect={(value) => toast(`Вибрано категорію: ${value}`)}
                  >
                    {category}
                    <ArrowUpRight aria-hidden="true" strokeWidth={2} className="ms-auto" />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </Specimen>
      </div>
    </StyleguideSection>
  );
}
