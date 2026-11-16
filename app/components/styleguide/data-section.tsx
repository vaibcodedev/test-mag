import {
  ArrowUpRight,
  Check,
  CircleAlert,
  CircleCheck,
  Info,
  MapPin,
  Phone,
  SearchX,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Truck,
  X,
} from "lucide-react";
import { Link } from "react-router";

import type { ProductCardImage } from "~/components/product/product-card";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "~/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "~/components/ui/item";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";
import { Progress } from "~/components/ui/progress";
import { ShopImage } from "~/components/ui/shop-image";
import { Spinner } from "~/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { STORE_INFO } from "~/lib/content/site";

import { Specimen, SpecimenRow, StyleguideSection } from "./styleguide-section";

const THUMB_SIZE = 112;
const PHOTO_SIZE = 480;
const SQUARE = 1;
const DELIVERY_PROGRESS = 64;
const COMPARE_PROGRESS = 50;

const COMPARE_MODELS = ["iPhone 17 Pro", "iPhone 17", "iPhone Air"];
const COMPARE_SPECS = [
  { name: "Дисплей", values: ["6,3 дюйма, 120 Гц", "6,3 дюйма, 120 Гц", "6,5 дюйма, 120 Гц"] },
  { name: "Чип", values: ["A19 Pro", "A19", "A19 Pro"] },
  { name: "Камера", values: ["48 + 48 + 48 Мп", "48 + 48 Мп", "48 Мп"] },
  { name: "Відео без підзарядки", values: ["до 33 годин", "до 30 годин", "до 27 годин"] },
];

const SUGGESTIONS = [
  { title: "iPhone 17 Pro 256 ГБ, синій титан", price: "64 999 ₴", to: "/products/iphone-17-pro" },
  { title: "iPhone 17 256 ГБ, чорний", price: "44 999 ₴", to: "/products/iphone-17" },
];

type DataSectionProps = {
  /** Фото товарів магазину для мініатюр і картки. */
  images: readonly ProductCardImage[];
};

function Thumb({ image }: { image: ProductCardImage | undefined }) {
  if (!image)
    return <Smartphone aria-hidden="true" strokeWidth={2} className="size-6 text-ink-2" />;

  return (
    <ShopImage
      src={image.url}
      alt=""
      width={image.width ?? THUMB_SIZE}
      height={image.height ?? THUMB_SIZE}
      sizes="56px"
      widths={[THUMB_SIZE]}
    />
  );
}

export function DataSection({ images }: DataSectionProps) {
  const photo = images[0];

  return (
    <StyleguideSection
      id="data"
      title="Картки, рядки, таблиці"
      description="Card — основа карток і плиток, Item — рядок «медіа + текст», Table — порівняння, Empty й Alert — стани. Усе це компоненти shadcn у темі «Сад»."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Specimen label="Card: тони surface, ink, blue та interactive" tone="page">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card interactive asChild className="focus-ring">
              <Link to="/collections/iphone">
                <AspectRatio ratio={SQUARE} className="overflow-hidden rounded-md bg-photo">
                  {photo ? (
                    <ShopImage
                      src={photo.url}
                      alt=""
                      width={photo.width ?? PHOTO_SIZE}
                      height={photo.height ?? PHOTO_SIZE}
                      sizes="(min-width: 64rem) 20vw, 50vw"
                      className="size-full lift-photo object-contain mix-blend-multiply"
                    />
                  ) : null}
                </AspectRatio>
                <CardFooter className="justify-between">
                  <CardTitle className="text-h3">iPhone</CardTitle>
                  <ArrowUpRight aria-hidden="true" strokeWidth={2} className="size-6" />
                </CardFooter>
              </Link>
            </Card>
            <div className="flex flex-col gap-4">
              <Card tone="ink">
                <CardHeader>
                  <CardTitle asChild>
                    <h4>Trade-in</h4>
                  </CardTitle>
                  <CardDescription>Знижка до 30 000 ₴ за старий iPhone.</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button variant="lime" size="sm">
                    Оцінити пристрій
                  </Button>
                </CardFooter>
              </Card>
              <Card tone="blue" padding="sm">
                <CardTitle>Оплата частинами</CardTitle>
                <CardDescription>До 25 платежів без переплат.</CardDescription>
              </Card>
            </div>
          </div>
        </Specimen>

        <Specimen label="Card: тон page на білому, шапка і вміст">
          <Card tone="page">
            <CardHeader>
              <CardTitle asChild>
                <h4>Шоурум у Вінниці</h4>
              </CardTitle>
              <CardDescription>
                {STORE_INFO.street}, {STORE_INFO.hours}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-body text-ink-2">
              Потримайте техніку в руках, перш ніж купити. Консультант покаже різницю між моделями.
            </CardContent>
            <CardFooter>
              <Button asChild size="sm">
                <Link to="/pages/contacts">Як дістатися</Link>
              </Button>
            </CardFooter>
          </Card>
        </Specimen>

        <Specimen label="Item: плитка з іконкою 44 і 52, outline, muted">
          <ItemGroup>
            <Item size="none">
              <ItemMedia variant="icon">
                <Truck aria-hidden="true" strokeWidth={2} />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Доставка завтра</ItemTitle>
                <ItemDescription>
                  Новою поштою по Україні або кур&apos;єром по Вінниці.
                </ItemDescription>
              </ItemContent>
            </Item>
            <Item variant="outline">
              <ItemMedia variant="icon" size="lg">
                <ShieldCheck aria-hidden="true" strokeWidth={2} />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Гарантія 12 місяців</ItemTitle>
                <ItemDescription>Ремонтуємо або міняємо у власному сервісі.</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button variant="secondary" size="sm">
                  Умови
                </Button>
              </ItemActions>
            </Item>
            <Item asChild variant="muted">
              <a href={STORE_INFO.phoneHref}>
                <ItemMedia>
                  <Phone aria-hidden="true" strokeWidth={2} />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{STORE_INFO.phone}</ItemTitle>
                  <ItemDescription>{STORE_INFO.hours}</ItemDescription>
                </ItemContent>
              </a>
            </Item>
          </ItemGroup>
        </Specimen>

        <Specimen label="Item: підказки пошуку з фото">
          <ItemGroup asChild className="gap-0">
            <ul>
              {SUGGESTIONS.map((suggestion, index) => (
                <li key={suggestion.to}>
                  <Item asChild size="sm">
                    <Link to={suggestion.to}>
                      <ItemMedia variant="image">
                        <Thumb image={images[index]} />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>{suggestion.title}</ItemTitle>
                        <ItemDescription>{suggestion.price}</ItemDescription>
                      </ItemContent>
                      <ArrowUpRight
                        aria-hidden="true"
                        strokeWidth={2}
                        className="size-5 text-ink-2"
                      />
                    </Link>
                  </Item>
                </li>
              ))}
            </ul>
          </ItemGroup>
        </Specimen>

        <Specimen label="Item: on-dark" tone="ink">
          <Item variant="on-dark" size="none">
            <ItemMedia variant="icon" size="lg" tone="dark">
              <MapPin aria-hidden="true" strokeWidth={2} className="text-lime" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Самовивіз сьогодні</ItemTitle>
              <ItemDescription>
                Заберіть замовлення в шоурумі через годину після оформлення.
              </ItemDescription>
            </ItemContent>
          </Item>
          <Alert variant="on-dark">
            <Truck aria-hidden="true" strokeWidth={2} />
            <AlertTitle>Доставимо завтра</AlertTitle>
            <AlertDescription>Замовлення до 16:00 відправляємо того ж дня.</AlertDescription>
          </Alert>
          <Progress value={40} tone="on-dark" aria-label="Залишилося товарів за акцією" />
        </Specimen>

        <Specimen label="Alert: info, success, warning, danger">
          <Alert>
            <Info aria-hidden="true" strokeWidth={2} />
            <AlertTitle>Самовивіз сьогодні до 20:00</AlertTitle>
            <AlertDescription>Товар уже в шоурумі.</AlertDescription>
          </Alert>
          <Alert variant="success">
            <CircleCheck aria-hidden="true" strokeWidth={2} />
            <AlertTitle>Промокод застосовано</AlertTitle>
            <AlertDescription>Знижка 1 500 ₴ уже врахована в сумі.</AlertDescription>
          </Alert>
          <Alert variant="warning">
            <CircleAlert aria-hidden="true" strokeWidth={2} />
            <AlertTitle>Залишився 1 iPhone 17 Pro у цьому кольорі</AlertTitle>
          </Alert>
          <Alert variant="danger" role="status">
            <CircleAlert aria-hidden="true" strokeWidth={2} />
            <AlertTitle>Не вдалося додати товар у кошик</AlertTitle>
            <AlertDescription>Перевірте з&apos;єднання і спробуйте ще раз.</AlertDescription>
            <AlertAction>
              <Button variant="ghost" size="icon" className="rounded-pill" aria-label="Закрити">
                <X aria-hidden="true" />
              </Button>
            </AlertAction>
          </Alert>
        </Specimen>

        <Specimen
          label="Table: порівняння із закріпленою першою колонкою"
          className="lg:col-span-2"
        >
          <Table stickyFirstColumn scrollLabel="Порівняння iPhone" className="min-w-xl">
            <TableHeader>
              <TableRow>
                <TableHead>Характеристика</TableHead>
                {COMPARE_MODELS.map((model) => (
                  <TableHead key={model}>{model}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {COMPARE_SPECS.map((spec) => (
                <TableRow key={spec.name}>
                  <TableHead scope="row">{spec.name}</TableHead>
                  {spec.values.map((value, index) => (
                    <TableCell key={COMPARE_MODELS[index]}>{value}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Specimen>

        <Specimen label="Empty: ліворуч і по центру" tone="page" className="lg:col-span-2">
          <div className="grid gap-4 lg:grid-cols-2">
            <Empty>
              <EmptyHeader>
                <EmptyMedia>
                  <ShoppingCart strokeWidth={2} />
                </EmptyMedia>
                <EmptyTitle as="h4">У кошику поки порожньо</EmptyTitle>
                <EmptyDescription>
                  Додайте iPhone, Mac чи аксесуар — і оформіть замовлення за дві хвилини.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild>
                  <Link to="/collections/all">Перейти в каталог</Link>
                </Button>
              </EmptyContent>
            </Empty>
            <Empty centered size="sm">
              <EmptyHeader>
                <EmptyMedia>
                  <SearchX strokeWidth={2} />
                </EmptyMedia>
                <EmptyTitle as="h4">Нічого не знайшли</EmptyTitle>
                <EmptyDescription>
                  Перевірте назву або <Link to="/pages/contacts">напишіть нам</Link>.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild variant="secondary" size="sm">
                  <Link to="/collections/all">Увесь каталог</Link>
                </Button>
              </EmptyContent>
            </Empty>
          </div>
        </Specimen>

        <Specimen label="Breadcrumb і Pagination" tone="page" className="lg:col-span-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Головна</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/collections/iphone">iPhone</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>iPhone 17 Pro 256 ГБ, синій титан</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Pagination className="justify-start">
            <PaginationContent className="justify-start">
              <PaginationItem>
                <PaginationPrevious disabled />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink asChild page={1} isActive>
                  <Link to="?page=1#data" preventScrollReset />
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink asChild page={2}>
                  <Link to="?page=2#data" preventScrollReset />
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink asChild page={12}>
                  <Link to="?page=12#data" preventScrollReset />
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext asChild>
                  <Link to="?page=2#data" preventScrollReset />
                </PaginationNext>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </Specimen>

        <Specimen label="Avatar">
          <SpecimenRow>
            <Avatar size="sm">
              <AvatarFallback>ОК</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>ОК</AvatarFallback>
              <AvatarBadge>
                <Check aria-hidden="true" strokeWidth={2} />
              </AvatarBadge>
            </Avatar>
            <Avatar size="lg" tone="page">
              <AvatarFallback>ТМ</AvatarFallback>
            </Avatar>
            <AvatarGroup role="img" aria-label="Олена, Тарас та ще 12 покупців">
              <Avatar>
                <AvatarFallback>ОК</AvatarFallback>
              </Avatar>
              <Avatar tone="page">
                <AvatarFallback>ТМ</AvatarFallback>
              </Avatar>
              <AvatarGroupCount>+12</AvatarGroupCount>
            </AvatarGroup>
          </SpecimenRow>
        </Specimen>

        <Specimen label="Progress і Spinner">
          <div className="flex flex-col gap-2">
            <p id="styleguide-progress-delivery" className="text-small text-ink-2">
              Ще 1 080 ₴ до безкоштовної доставки
            </p>
            <Progress value={DELIVERY_PROGRESS} aria-labelledby="styleguide-progress-delivery" />
          </div>
          <div className="flex flex-col gap-2">
            <p id="styleguide-progress-compare" className="text-small text-ink-2">
              У порівнянні 2 товари з 4
            </p>
            <Progress value={COMPARE_PROGRESS} aria-labelledby="styleguide-progress-compare" />
          </div>
          <SpecimenRow>
            <Spinner />
            <Spinner className="size-6 text-blue" />
          </SpecimenRow>
        </Specimen>
      </div>
    </StyleguideSection>
  );
}
