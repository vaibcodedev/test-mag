import { ArrowRight, Heart, Minus, Plus, Scale, Search } from "lucide-react";
import { useId, useState, type CSSProperties } from "react";

import { Button } from "~/components/ui/button";
import { ButtonGroup, ButtonGroupText } from "~/components/ui/button-group";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  fieldProps,
  FieldSet,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "~/components/ui/input-group";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Slider } from "~/components/ui/slider";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import { Toggle } from "~/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { formatPrice } from "~/lib/format";

import { Specimen, StyleguideSection } from "./styleguide-section";
import { uah } from "./styleguide.data";

const PRICE_MIN = 0;
const PRICE_MAX = 150000;
const PRICE_STEP = 1000;
const MEMORY_OPTIONS = ["128 ГБ", "256 ГБ", "512 ГБ", "1 ТБ"];
const CONDITION_OPTIONS = ["Новий", "Як новий", "Відмінний", "Хороший"];
/** Демо залежного вибору: відділення з'являються після міста. */
const BRANCHES: Record<string, string[]> = {
  vinnytsia: ["Шоурум Ionov Store, вул. Соборна", "Нова пошта №1", "Нова пошта №12"],
  kyiv: ["Нова пошта №5", "Нова пошта №41"],
  lviv: ["Нова пошта №3", "Нова пошта №27"],
};
const QUANTITY_MIN = 1;
const QUANTITY_MAX = 5;
/** Демо-значення метаполя custom.color_swatches: дані товару, а не кольори інтерфейсу. */
const SWATCHES = [
  { name: "Синій титан", hex: "#3c4a5e" },
  { name: "Срібний", hex: "#e3e4e5" },
  { name: "Космічний помаранчевий", hex: "#f77e2d" },
];

export function FormsSection() {
  const id = useId();
  const [priceRange, setPriceRange] = useState([20000, 90000]);
  const [quantity, setQuantity] = useState(QUANTITY_MIN);
  const [memory, setMemory] = useState("256 ГБ");
  const [swatch, setSwatch] = useState(SWATCHES[0]?.name ?? "");
  const [darkSwatch, setDarkSwatch] = useState(SWATCHES[1]?.name ?? "");
  const [cityValue, setCityValue] = useState("");
  const [branch, setBranch] = useState("");
  const branches = BRANCHES[cityValue] ?? [];

  const clampQuantity = (value: number) => Math.min(QUANTITY_MAX, Math.max(QUANTITY_MIN, value));
  const city = fieldProps(`${id}-city`, { description: true });
  const email = fieldProps(`${id}-field-email`, { invalid: true });
  const darkEmail = fieldProps(`${id}-dark-email`, { invalid: true, description: true });

  return (
    <StyleguideSection
      id="forms"
      title="Поля та вибір"
      description="Висота полів 46, радіус 14. Помилка пояснює, що не так і як це виправити. Field збирає підпис, поле, підказку й помилку; увімкнений стан перемикачів завжди blue."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Specimen label="Input і Textarea">
          <div className="flex flex-col gap-2">
            <label htmlFor={`${id}-name`} className="text-small font-semibold">
              Ім&apos;я
            </label>
            <Input id={`${id}-name`} placeholder="Олена" autoComplete="given-name" />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor={`${id}-phone`} className="text-small font-semibold">
              Телефон
            </label>
            <Input
              id={`${id}-phone`}
              type="tel"
              defaultValue="068 129"
              aria-invalid="true"
              aria-describedby={`${id}-phone-error`}
            />
            <p id={`${id}-phone-error`} className="text-small text-danger">
              У номері має бути 10 цифр, наприклад 068 129 99 00.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor={`${id}-imei`} className="text-small font-semibold">
              IMEI
            </label>
            <Input id={`${id}-imei`} disabled defaultValue="35 209900 176148 1" />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor={`${id}-comment`} className="text-small font-semibold">
              Коментар до замовлення
            </label>
            <Textarea id={`${id}-comment`} placeholder="Наприклад, зателефонуйте після 18:00" />
          </div>
        </Specimen>

        <Specimen label="InputGroup і Select">
          <div className="flex flex-col gap-2">
            <label htmlFor={`${id}-search`} className="text-small font-semibold">
              Пошук
            </label>
            <InputGroup>
              <InputGroupAddon>
                <Search aria-hidden="true" strokeWidth={2} />
              </InputGroupAddon>
              <InputGroupInput id={`${id}-search`} type="search" placeholder="iPhone 17 Pro" />
            </InputGroup>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor={`${id}-email`} className="text-small font-semibold">
              Email для розсилки
            </label>
            <InputGroup>
              <InputGroupInput
                id={`${id}-email`}
                type="email"
                placeholder="olena@example.com"
                autoComplete="email"
                className="ps-4"
              />
              <InputGroupAddon align="end">
                <Button size="sm">
                  Підписатися
                  <ArrowRight aria-hidden="true" />
                </Button>
              </InputGroupAddon>
            </InputGroup>
          </div>
          <div className="flex flex-col gap-2">
            <span id={`${id}-sort`} className="text-small font-semibold">
              Сортування
            </span>
            <Select defaultValue="popular">
              <SelectTrigger aria-labelledby={`${id}-sort`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Спочатку популярні</SelectItem>
                <SelectItem value="price-asc">Спочатку дешевші</SelectItem>
                <SelectItem value="price-desc">Спочатку дорожчі</SelectItem>
                <SelectItem value="new">Спочатку новинки</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Specimen>

        <Specimen label="Checkbox і RadioGroup">
          <fieldset className="flex flex-col gap-1">
            <legend className="mb-2 text-small font-semibold">Пам&apos;ять</legend>
            {MEMORY_OPTIONS.map((option, index) => (
              <label
                key={option}
                className="flex min-h-11 cursor-pointer items-center gap-3 text-body has-disabled:cursor-not-allowed has-disabled:text-muted-foreground"
              >
                <Checkbox defaultChecked={index === 1} disabled={index === 3} />
                {option}
              </label>
            ))}
          </fieldset>
          <div className="flex flex-col gap-1">
            <span id={`${id}-condition`} className="mb-2 text-small font-semibold">
              Стан
            </span>
            <RadioGroup defaultValue={CONDITION_OPTIONS[0]} aria-labelledby={`${id}-condition`}>
              {CONDITION_OPTIONS.map((option) => (
                <label
                  key={option}
                  className="flex min-h-11 cursor-pointer items-center gap-3 text-body"
                >
                  <RadioGroupItem value={option} />
                  {option}
                </label>
              ))}
            </RadioGroup>
          </div>
        </Specimen>

        <Specimen label="Slider: фільтр ціни">
          <p className="text-body font-semibold tabular-nums">
            {formatPrice(uah(priceRange[0] ?? PRICE_MIN))} —{" "}
            {formatPrice(uah(priceRange[1] ?? PRICE_MAX))}
          </p>
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={PRICE_STEP}
            minStepsBetweenThumbs={1}
            thumbLabels={["Ціна від", "Ціна до"]}
          />
          <Slider defaultValue={[40]} disabled thumbLabels={["Недоступний повзунок"]} />
        </Specimen>

        <Specimen label="Field, Label, NativeSelect">
          <FieldSet>
            <FieldLegend>Куди доставити</FieldLegend>
            <FieldGroup>
              <Field {...city.field}>
                <FieldLabel {...city.label}>Місто</FieldLabel>
                <NativeSelect
                  name="city"
                  value={cityValue}
                  onChange={(event) => {
                    setCityValue(event.target.value);
                    setBranch("");
                  }}
                  {...city.control}
                >
                  <NativeSelectOption value="">Виберіть місто</NativeSelectOption>
                  <NativeSelectOption value="vinnytsia">Вінниця</NativeSelectOption>
                  <NativeSelectOption value="kyiv">Київ</NativeSelectOption>
                  <NativeSelectOption value="lviv">Львів</NativeSelectOption>
                </NativeSelect>
                <FieldDescription {...city.description}>
                  У Вінниці кур&apos;єр привозить у день замовлення.
                </FieldDescription>
              </Field>
              <Field {...email.field}>
                <FieldLabel {...email.label}>Email</FieldLabel>
                <Input type="email" defaultValue="olena@" autoComplete="email" {...email.control} />
                <FieldError {...email.error}>
                  В адресі бракує домену. Приклад: olena@example.com.
                </FieldError>
              </Field>
              <Field data-disabled={branches.length === 0 ? "true" : undefined}>
                <FieldLabel htmlFor={`${id}-branch`}>Відділення</FieldLabel>
                <NativeSelect
                  id={`${id}-branch`}
                  name="branch"
                  disabled={branches.length === 0}
                  value={branch}
                  onChange={(event) => setBranch(event.target.value)}
                >
                  <NativeSelectOption value="">
                    {branches.length === 0 ? "Спершу виберіть місто" : "Виберіть відділення"}
                  </NativeSelectOption>
                  {branches.map((item) => (
                    <NativeSelectOption key={item} value={item}>
                      {item}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            </FieldGroup>
          </FieldSet>
        </Specimen>

        <Specimen label="Switch і горизонтальне поле">
          <Field orientation="horizontal">
            <FieldLabel htmlFor={`${id}-stock`}>Лише в наявності</FieldLabel>
            <Switch id={`${id}-stock`} defaultChecked />
          </Field>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor={`${id}-news`}>Знижки тижня на пошту</FieldLabel>
              <FieldDescription>Один лист щоп&apos;ятниці, без спаму.</FieldDescription>
            </FieldContent>
            <Switch id={`${id}-news`} />
          </Field>
          <Field orientation="horizontal" data-disabled="true">
            <FieldLabel htmlFor={`${id}-sms`}>SMS про статус замовлення</FieldLabel>
            <Switch id={`${id}-sms`} size="sm" disabled defaultChecked />
          </Field>
        </Specimen>

        <Specimen label="ToggleGroup: pill і swatch">
          <div className="flex flex-col gap-2">
            <span id={`${id}-memory`} className="text-small font-semibold">
              Пам&apos;ять
            </span>
            <ToggleGroup
              type="single"
              value={memory}
              onValueChange={(next) => (next ? setMemory(next) : undefined)}
              aria-labelledby={`${id}-memory`}
            >
              {MEMORY_OPTIONS.map((option, index) => (
                <ToggleGroupItem key={option} value={option} disabled={index === 3}>
                  {option}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <div className="flex flex-col gap-1">
            <span id={`${id}-swatch`} className="text-small font-semibold">
              Колір: <span className="font-medium text-ink-2">{swatch}</span>
            </span>
            <ToggleGroup
              type="single"
              variant="swatch"
              value={swatch}
              onValueChange={(next) => (next ? setSwatch(next) : undefined)}
              aria-labelledby={`${id}-swatch`}
              className="-ms-2"
            >
              {SWATCHES.map((color) => (
                <ToggleGroupItem
                  key={color.name}
                  value={color.name}
                  swatch={color.hex}
                  aria-label={color.name}
                  title={color.name}
                />
              ))}
            </ToggleGroup>
          </div>
        </Specimen>

        <Specimen label="Toggle: недоступне значення, asChild-посилання, thumbnail" tone="page">
          <ToggleGroup type="single" defaultValue="256 ГБ" aria-label="Пам'ять (приклад)">
            <ToggleGroupItem value="256 ГБ">256 ГБ</ToggleGroupItem>
            <ToggleGroupItem value="512 ГБ" unavailable>
              512 ГБ<span className="sr-only">, немає в наявності</span>
            </ToggleGroupItem>
            {/* asChild: елемент групи — посилання; крапка кольору потрапляє всередину нього. */}
            <ToggleGroupItem asChild value="Срібний" variant="swatch" swatch="#e3e4e5">
              <a href="#forms" aria-label="Срібний" title="Срібний" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="Помаранчевий"
              variant="swatch"
              swatch="#f77e2d"
              unavailable
              aria-label="Космічний помаранчевий, немає в наявності"
            />
          </ToggleGroup>
          <ToggleGroup
            type="single"
            variant="thumbnail"
            defaultValue="1"
            aria-label="Фото товару (приклад)"
          >
            {SWATCHES.map((color, index) => (
              <ToggleGroupItem
                key={color.name}
                value={String(index + 1)}
                aria-label={`Фото ${index + 1}`}
              >
                <span
                  aria-hidden="true"
                  className="size-full bg-(--swatch)"
                  style={{ "--swatch": color.hex } as CSSProperties}
                />
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Specimen>

        <Specimen label="Field та Input на ink: onDark" tone="ink">
          <Field {...darkEmail.field} onDark>
            <FieldLabel {...darkEmail.label}>Email для розсилки</FieldLabel>
            <Input
              type="email"
              defaultValue="olena@"
              autoComplete="email"
              onDark
              {...darkEmail.control}
            />
            <FieldError {...darkEmail.error}>
              В адресі бракує домену. Приклад: olena@example.com.
            </FieldError>
            <FieldDescription {...darkEmail.description}>
              Пишемо раз на тиждень: новинки та знижки.
            </FieldDescription>
          </Field>
        </Specimen>

        <Specimen label="Toggle: pill та icon" tone="page">
          <div className="flex flex-wrap items-center gap-2">
            <Toggle>У наявності</Toggle>
            <Toggle defaultPressed>Зі знижкою</Toggle>
            <Toggle disabled>Вживані</Toggle>
            <Toggle variant="icon" aria-label="Додати в обране: iPhone 17 Pro">
              <Heart aria-hidden="true" strokeWidth={2} />
            </Toggle>
            <Toggle variant="icon" defaultPressed aria-label="Прибрати з обраного: iPhone 17">
              <Heart aria-hidden="true" strokeWidth={2} />
            </Toggle>
            <Toggle variant="icon" defaultPressed aria-label="Прибрати з порівняння: iPhone 17">
              <Scale aria-hidden="true" strokeWidth={2} />
            </Toggle>
          </div>
        </Specimen>

        <Specimen label="Toggle на ink: onDark" tone="ink">
          <div className="flex flex-wrap items-center gap-2">
            <Toggle onDark defaultPressed>
              256 ГБ
            </Toggle>
            <Toggle onDark>512 ГБ</Toggle>
            <Toggle
              variant="icon"
              onDark
              defaultPressed
              aria-label="Прибрати з обраного: iPhone Air"
            >
              <Heart aria-hidden="true" strokeWidth={2} />
            </Toggle>
          </div>
          <ToggleGroup
            type="single"
            variant="swatch"
            onDark
            value={darkSwatch}
            onValueChange={(next) => (next ? setDarkSwatch(next) : undefined)}
            aria-label="Колір"
            className="-ms-2"
          >
            {SWATCHES.map((color) => (
              <ToggleGroupItem
                key={color.name}
                value={color.name}
                swatch={color.hex}
                aria-label={color.name}
                title={color.name}
              />
            ))}
          </ToggleGroup>
        </Specimen>

        <Specimen label="ButtonGroup: лічильник кількості, поле з префіксом">
          <ButtonGroup aria-label="Кількість: iPhone 17 Pro">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Зменшити кількість"
              disabled={quantity <= QUANTITY_MIN}
              onClick={() => setQuantity((value) => clampQuantity(value - 1))}
            >
              <Minus aria-hidden="true" />
            </Button>
            <Input
              aria-label="Кількість"
              inputMode="numeric"
              value={quantity}
              onChange={(event) =>
                setQuantity(clampQuantity(Number(event.target.value) || QUANTITY_MIN))
              }
              className="w-14 px-0 text-center tabular-nums"
            />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Збільшити кількість"
              disabled={quantity >= QUANTITY_MAX}
              onClick={() => setQuantity((value) => clampQuantity(value + 1))}
            >
              <Plus aria-hidden="true" />
            </Button>
          </ButtonGroup>
          <ButtonGroup aria-label="Передзвоніть мені" className="w-full">
            <ButtonGroupText>+380</ButtonGroupText>
            <Input
              type="tel"
              aria-label="Номер телефону"
              placeholder="68 129 99 00"
              autoComplete="tel-national"
              className="flex-1"
            />
            <Button className="border-transparent">Передзвоніть</Button>
          </ButtonGroup>
        </Specimen>
      </div>
    </StyleguideSection>
  );
}
