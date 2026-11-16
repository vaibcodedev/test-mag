import { useState } from "react";

import { ColorSwatches, type ColorSwatch } from "~/components/product/color-swatches";
import { CompareButton } from "~/components/product/compare-button";
import { InstallmentChip } from "~/components/product/installment-chip";
import { StockStatus } from "~/components/product/stock-status";
import { UsedGrade } from "~/components/product/used-grade";
import { WishlistButton } from "~/components/product/wishlist-button";
import { Countdown } from "~/components/ui/countdown";
import { Price } from "~/components/ui/price";
import { Rating } from "~/components/ui/rating";

import { Specimen, SpecimenRow, StyleguideSection } from "./styleguide-section";
import { uah } from "./styleguide.data";

/** Демо-значення метаполя custom.color_swatches: дані товару, а не кольори інтерфейсу. */
const DEMO_COLORS: ColorSwatch[] = [
  { name: "Синій титан", hex: "#3c4a5e" },
  { name: "Срібний", hex: "#e3e4e5" },
  { name: "Космічний помаранчевий", hex: "#f77e2d" },
];

/** Сталі дати: розмітка сервера й браузера збігається, а відлік оживає після гідрації. */
const DEMO_DEAL_END = "2027-12-31T23:59:59+02:00";
const DEMO_DEAL_FINISHED = "2026-01-01T00:00:00+02:00";

export function CommerceSection() {
  const [color, setColor] = useState(DEMO_COLORS[0]?.name);
  const [darkColor, setDarkColor] = useState(DEMO_COLORS[1]?.name);
  const [wishlisted, setWishlisted] = useState(true);
  const [compared, setCompared] = useState(false);

  return (
    <StyleguideSection
      id="commerce"
      title="Ціна, рейтинг, деталі товару"
      description="Price форматує гривню як «119 999 ₴». Знижка — це sale-ціна, закреслена стара ціна та «Економія N ₴»."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Specimen label="Price: card, lg, hero">
          <div className="flex flex-col gap-5">
            <Price price={uah(64999)} />
            <Price price={uah(49999)} compareAt={uah(54499)} />
            <Price size="lg" price={uah(119999)} from />
            <Price size="lg" price={uah(49999)} compareAt={uah(54499)} />
            <Price size="hero" price={uah(119999)} from />
          </div>
        </Specimen>
        <Specimen label="Price на ink" tone="ink">
          <div className="flex flex-col gap-5">
            <Price size="hero" price={uah(119999)} from onDark />
            <Price price={uah(64999)} onDark />
          </div>
          <SpecimenRow>
            <InstallmentChip price={uah(119999)} tone="on-dark" showIcon />
          </SpecimenRow>
        </Specimen>
        <Specimen label="Rating">
          <div className="flex flex-col items-start gap-3">
            <Rating value={4.9} count={128} />
            <Rating value={4.2} count={3} />
            <Rating value={4.9} count={128} variant="compact" />
          </div>
        </Specimen>
        <Specimen label="Rating на ink" tone="ink">
          <Rating value={4.9} count={412} onDark />
        </Specimen>
        <Specimen label="InstallmentChip, StockStatus, UsedGrade">
          <SpecimenRow>
            <InstallmentChip price={uah(119999)} />
            <InstallmentChip price={uah(49999)} months={24} showIcon />
          </SpecimenRow>
          <StockStatus available delivery="доставимо завтра" />
          <StockStatus available={false} />
          <UsedGrade batteryHealth={91} />
        </Specimen>
        <Specimen label="ColorSwatches, обране, порівняння">
          <ColorSwatches colors={DEMO_COLORS} value={color} onChange={setColor} />
          <p className="text-small text-ink-2">Вибрано: {color}</p>
          <SpecimenRow>
            <ColorSwatches colors={DEMO_COLORS} />
            <span className="text-caption text-muted-foreground">Перелік у картці товару</span>
          </SpecimenRow>
          <SpecimenRow className="rounded-md bg-ink p-2">
            <ColorSwatches colors={DEMO_COLORS} value={darkColor} onChange={setDarkColor} onDark />
          </SpecimenRow>
          <SpecimenRow className="rounded-md bg-photo p-3">
            <WishlistButton
              productTitle="iPhone 17 Pro"
              active={wishlisted}
              onClick={() => setWishlisted((value) => !value)}
            />
            <CompareButton
              productTitle="iPhone 17 Pro"
              active={compared}
              onClick={() => setCompared((value) => !value)}
            />
          </SpecimenRow>
        </Specimen>
        <Specimen label="Countdown на ink" tone="ink">
          <Countdown endsAt={DEMO_DEAL_END} />
        </Specimen>
        <Specimen label="Countdown: light і завершений">
          <div className="flex flex-col gap-5">
            <Countdown endsAt={DEMO_DEAL_END} tone="light" />
            <Countdown endsAt={DEMO_DEAL_FINISHED} tone="light" />
          </div>
        </Specimen>
      </div>
    </StyleguideSection>
  );
}
