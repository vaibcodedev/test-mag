import {
  ArrowRight,
  CreditCard,
  Heart,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Chip } from "~/components/ui/chip";
import { IconTile } from "~/components/ui/icon-tile";
import { Wordmark } from "~/components/ui/wordmark";

import { Specimen, SpecimenRow, StyleguideSection } from "./styleguide-section";

export function ActionsSection() {
  return (
    <>
      <StyleguideSection
        id="buttons"
        title="Button"
        description="Розміри: sm 40 (ціль натискання 44), md 46, lg 56, icon 44×44. Повна ширина — через className."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Specimen label="Варіанти на світлому">
            <SpecimenRow>
              <Button>
                <ShoppingCart aria-hidden="true" />
                Купити
              </Button>
              <Button variant="ink">Оформити замовлення</Button>
              <Button variant="secondary">Порівняти</Button>
              <Button variant="ghost">Скасувати</Button>
              <Button variant="link">Усі умови доставки</Button>
            </SpecimenRow>
          </Specimen>
          <Specimen label="Варіанти на ink: lime та on-dark" tone="ink">
            <SpecimenRow>
              <Button variant="lime">
                Купити
                <ArrowRight aria-hidden="true" />
              </Button>
              <Button variant="on-dark">Порівняти</Button>
              <Button variant="lime" size="icon" aria-label="Додати в кошик">
                <ShoppingCart aria-hidden="true" />
              </Button>
              <Button variant="on-dark" size="icon" aria-label="Додати в обране">
                <Heart aria-hidden="true" />
              </Button>
            </SpecimenRow>
          </Specimen>
          <Specimen label="На тлі сторінки: surface" tone="page">
            <SpecimenRow>
              <Button>Купити</Button>
              <Button variant="surface">Показати ще</Button>
              <Button variant="surface" size="sm">
                Усі статті
              </Button>
              <Button variant="surface" size="icon" aria-label="Додати в обране">
                <Heart aria-hidden="true" />
              </Button>
            </SpecimenRow>
          </Specimen>
          <Specimen label="Розміри">
            <SpecimenRow className="items-end">
              <Button size="sm">sm · 40</Button>
              <Button size="md">md · 46</Button>
              <Button size="lg">lg · 56</Button>
              <Button size="icon" aria-label="Кошик">
                <ShoppingCart aria-hidden="true" />
              </Button>
              <Button size="icon" variant="secondary" aria-label="Додати в обране">
                <Heart aria-hidden="true" />
              </Button>
            </SpecimenRow>
          </Specimen>
          <Specimen label="Стани: disabled і loading">
            <SpecimenRow>
              <Button disabled>Купити</Button>
              <Button variant="secondary" disabled>
                Порівняти
              </Button>
              <Button loading>Купити</Button>
              <Button variant="ink" loading>
                Оформити замовлення
              </Button>
            </SpecimenRow>
            <Button className="w-full">
              <ShoppingCart aria-hidden="true" />
              Купити на всю ширину
            </Button>
          </Specimen>
        </div>
      </StyleguideSection>

      <StyleguideSection
        id="labels"
        title="Badge, Chip, IconTile"
        description="Бейдж позначає товар або показує лічильник (count, на синій кнопці — count-on-blue). Chip — це Badge у варіантах chip, chip-surface, chip-on-dark; IconTile — це ItemMedia variant=icon."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Specimen label="Badge">
            <SpecimenRow>
              <Badge variant="new">Новинка</Badge>
              <Badge variant="hit">Хіт</Badge>
              <Badge variant="top">Топ</Badge>
              <Badge variant="sale">−8%</Badge>
              <Badge variant="grade">Відмінний</Badge>
              <Badge variant="outline">eSIM</Badge>
            </SpecimenRow>
            <SpecimenRow>
              <Badge variant="count">3</Badge>
              <Badge variant="count">12</Badge>
              <Button className="px-4 text-small">
                <ShoppingCart aria-hidden="true" />
                Кошик
                <Badge variant="count-on-blue">2</Badge>
              </Button>
            </SpecimenRow>
            <SpecimenRow>
              <Badge variant="chip">chip · 256 ГБ</Badge>
              <Badge variant="chip-surface" className="border border-line">
                chip-surface · eSIM
              </Badge>
            </SpecimenRow>
          </Specimen>
          <Specimen label="Chip">
            <SpecimenRow>
              <Chip>4 800 ₴ × 25 міс.</Chip>
              <Chip>256 ГБ</Chip>
              <Chip>
                <CreditCard aria-hidden="true" strokeWidth={2} />
                0% частинами
              </Chip>
            </SpecimenRow>
            <SpecimenRow className="rounded-md bg-ink p-4">
              <Chip tone="on-dark">A19 Pro</Chip>
              <Chip tone="on-dark">Камера 48 Мп</Chip>
              <Chip tone="on-dark">до 33 годин відео</Chip>
            </SpecimenRow>
          </Specimen>
          <Specimen label="IconTile: light 44 і 52">
            <SpecimenRow>
              <IconTile>
                <Truck strokeWidth={2} />
              </IconTile>
              <IconTile>
                <ShieldCheck strokeWidth={2} />
              </IconTile>
              <IconTile size="lg">
                <RotateCcw strokeWidth={2} />
              </IconTile>
              <IconTile size="lg">
                <MessageCircle strokeWidth={2} />
              </IconTile>
            </SpecimenRow>
          </Specimen>
          <Specimen label="IconTile: dark" tone="ink">
            <SpecimenRow>
              <IconTile tone="dark">
                <Truck strokeWidth={2} />
              </IconTile>
              <IconTile tone="dark" size="lg">
                <ShieldCheck strokeWidth={2} className="text-lime" />
              </IconTile>
            </SpecimenRow>
          </Specimen>
        </div>
      </StyleguideSection>

      <StyleguideSection
        id="wordmark"
        title="Wordmark"
        description="Логотип «сад» з листком для шапки та великий вордмарк із крапкою для футера."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Specimen label="У шапці">
            <SpecimenRow className="gap-8">
              <Wordmark />
              <Wordmark size="md" />
            </SpecimenRow>
          </Specimen>
          <Specimen label="На ink і у футері" tone="ink">
            <SpecimenRow className="gap-8">
              <Wordmark tone="on-dark" size="md" />
              <Wordmark tone="lime" size="md" mark="dot" />
            </SpecimenRow>
          </Specimen>
        </div>
      </StyleguideSection>
    </>
  );
}
