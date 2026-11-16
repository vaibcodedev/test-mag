import type { Meta, StoryObj } from "@storybook/react-vite";
import { LayoutGrid } from "lucide-react";
import { Link } from "react-router";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "~/components/ui/navigation-menu";
import { Skeleton } from "~/components/ui/skeleton";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./carousel";

const MODELS = ["iPhone 17 Pro Max", "iPhone 17 Pro", "iPhone Air", "iPhone 17", "iPhone 16e"];
const CATALOG = ["iPhone", "Mac", "iPad", "Watch", "AirPods", "Аксесуари"];

const meta = {
  title: "UI/Carousel, Command, NavigationMenu, Skeleton",
  component: Carousel,
  tags: ["autodocs"],
  args: { "aria-label": "Лінійка iPhone" },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Slides: Story = {
  parameters: { surface: "page" },
  render: (args) => (
    <Carousel {...args} className="flex flex-col gap-4">
      <CarouselContent>
        {MODELS.map((model) => (
          <CarouselItem key={model} className="basis-4/5 sm:basis-1/2 lg:basis-1/3">
            <div className="flex h-32 items-end rounded-lg bg-surface p-5 text-h3">{model}</div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="flex gap-2">
        <CarouselPrevious className="bg-surface" />
        <CarouselNext className="bg-surface" />
      </div>
    </Carousel>
  ),
};

/** Основа predictive search у шапці. */
export const SearchCommand: Story = {
  parameters: { surface: "page" },
  render: () => (
    <Command label="Пошук товарів" className="h-auto max-w-xl border border-line">
      <CommandInput placeholder="Що шукаєте?" />
      <CommandList>
        <CommandEmpty>Нічого не знайшли. Перевірте назву або напишіть нам у Telegram.</CommandEmpty>
        <CommandGroup heading="Товари">
          {MODELS.map((model) => (
            <CommandItem key={model} value={model}>
              {model}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

/** Основа мега-меню «Каталог». */
export const CatalogMenu: Story = {
  render: () => (
    <div className="min-h-72">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>
              <LayoutGrid aria-hidden="true" strokeWidth={2} />
              Каталог
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-80 grid-cols-2 gap-1">
                {CATALOG.map((item) => (
                  <li key={item}>
                    <NavigationMenuLink asChild>
                      <Link to="/collections">{item}</Link>
                    </NavigationMenuLink>
                  </li>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div className="flex max-w-sm items-center gap-4" role="status" aria-label="Завантаження">
      <Skeleton className="size-13 rounded-md" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  ),
};
