import { ChevronDown, LayoutGrid } from "lucide-react";
import { Link } from "react-router";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Button } from "~/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "~/components/ui/carousel";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "~/components/ui/navigation-menu";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

import { Specimen, StyleguideSection } from "./styleguide-section";

const CATALOG = [
  { title: "iPhone", to: "/collections/iphone" },
  { title: "Mac", to: "/collections/mac" },
  { title: "iPad", to: "/collections/ipad" },
  { title: "Watch", to: "/collections/watch" },
  { title: "AirPods", to: "/collections/airpods" },
  { title: "Аксесуари", to: "/collections/accessories" },
  { title: "Вживані", to: "/collections/used" },
  { title: "Знижки", to: "/collections/deals" },
];

const POPULAR_TABS = [
  { value: "hits", label: "Хіти", text: "Найпопулярніші моделі цього місяця." },
  { value: "new", label: "Новинки", text: "Щойно з'явилися в шоурумі." },
  { value: "study", label: "Для навчання", text: "Ноутбуки й планшети для студентів." },
  { value: "accessories", label: "Аксесуари", text: "Чохли, скло, зарядки." },
];

const MODELS = ["iPhone 17 Pro Max", "iPhone 17 Pro", "iPhone Air", "iPhone 17", "iPhone 16e"];
const STORAGE = ["64 ГБ", "128 ГБ", "256 ГБ", "512 ГБ", "1 ТБ", "2 ТБ"];

export function NavigationSection() {
  return (
    <StyleguideSection
      id="navigation"
      title="Навігація та структура"
      description="Вкладки, акордеон фільтрів, карусель, мега-меню. Активний стан завжди blue."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Specimen label="Tabs: pills" tone="page">
          <Tabs defaultValue="hits">
            <div className="-mx-6 overflow-x-auto px-6">
              <TabsList>
                {POPULAR_TABS.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {POPULAR_TABS.map((tab) => (
              <TabsContent key={tab.value} value={tab.value}>
                <p className="text-body text-ink-2">{tab.text}</p>
              </TabsContent>
            ))}
          </Tabs>
        </Specimen>

        <Specimen label="Tabs: line">
          <Tabs defaultValue="specs">
            <TabsList variant="line">
              <TabsTrigger value="specs">Характеристики</TabsTrigger>
              <TabsTrigger value="delivery">Доставка</TabsTrigger>
              <TabsTrigger value="reviews">Відгуки</TabsTrigger>
            </TabsList>
            <TabsContent value="specs">
              <p className="text-body text-ink-2">Дисплей 6,3 дюйма, чип A19 Pro, 256 ГБ.</p>
            </TabsContent>
            <TabsContent value="delivery">
              <p className="text-body text-ink-2">Нова пошта, кур&apos;єр по Вінниці, самовивіз.</p>
            </TabsContent>
            <TabsContent value="reviews">
              <p className="text-body text-ink-2">128 відгуків, середня оцінка 4,9.</p>
            </TabsContent>
          </Tabs>
        </Specimen>

        <Specimen label="Accordion: фільтри каталогу">
          <Accordion type="multiple" defaultValue={["memory"]}>
            <AccordionItem value="memory">
              <AccordionTrigger>Пам&apos;ять</AccordionTrigger>
              <AccordionContent>128 ГБ, 256 ГБ, 512 ГБ, 1 ТБ</AccordionContent>
            </AccordionItem>
            <AccordionItem value="color">
              <AccordionTrigger>Колір</AccordionTrigger>
              <AccordionContent>Синій титан, срібний, космічний помаранчевий</AccordionContent>
            </AccordionItem>
            <AccordionItem value="condition">
              <AccordionTrigger>Стан</AccordionTrigger>
              <AccordionContent>Новий, як новий, відмінний, хороший</AccordionContent>
            </AccordionItem>
          </Accordion>
        </Specimen>

        <Specimen label="NavigationMenu: основа мега-меню">
          <NavigationMenu className="flex-none">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-blue text-surface hover:bg-blue-hover data-open:bg-blue-hover [&_svg]:text-surface">
                  <LayoutGrid aria-hidden="true" strokeWidth={2} />
                  Каталог
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-80 grid-cols-2 gap-1">
                    {CATALOG.map((item) => (
                      <li key={item.to}>
                        <NavigationMenuLink asChild>
                          <Link to={item.to}>{item.title}</Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
          <p className="text-small text-ink-2">
            Відкривається за наведенням і з клавіатури. Повне мега-меню з&apos;явиться в шапці на
            етапі 3.
          </p>
        </Specimen>

        <Specimen label="Carousel" tone="page" className="lg:col-span-2">
          <Carousel aria-label="Лінійка iPhone" className="flex flex-col gap-4">
            <CarouselContent>
              {MODELS.map((model) => (
                <CarouselItem key={model} className="basis-4/5 sm:basis-1/2 lg:basis-1/3">
                  <div className="flex h-32 items-end rounded-lg bg-surface p-5 text-h3">
                    {model}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex gap-2">
              <CarouselPrevious className="bg-surface" />
              <CarouselNext className="bg-surface" />
            </div>
          </Carousel>
        </Specimen>

        <Specimen label="ScrollArea і Separator">
          <ScrollArea className="h-40 rounded-md border border-line">
            <ul className="p-2">
              {STORAGE.map((item, index) => (
                <li key={item}>
                  {index > 0 ? <Separator /> : null}
                  <span className="flex min-h-11 items-center px-2 text-small">{item}</span>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </Specimen>

        <Specimen label="Collapsible: вміст лишається в DOM (forceMount)">
          <Collapsible className="flex flex-col items-start gap-3">
            <p className="text-body text-ink-2">Дисплей 6,3 дюйма, чип A19 Pro, 256 ГБ.</p>
            <CollapsibleContent forceMount className="text-body text-ink-2">
              Камера 48 Мп, до 33 годин відео, eSIM і nano-SIM, захист IP68, вага 206 г.
            </CollapsibleContent>
            <CollapsibleTrigger asChild>
              <Button variant="secondary" size="sm" className="group/trigger">
                Усі характеристики
                <ChevronDown
                  aria-hidden="true"
                  className="size-4 transition-transform group-aria-expanded/trigger:rotate-180"
                />
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </Specimen>

        <Specimen label="Skeleton">
          <div className="flex items-center gap-4" role="status" aria-label="Завантаження">
            <Skeleton className="size-13 rounded-md" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-11.5 rounded-md" />
        </Specimen>
      </div>
    </StyleguideSection>
  );
}
