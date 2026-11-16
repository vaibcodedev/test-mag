import type { VariantPickerOption } from "./variant-picker";

/** Демо-опції для сторіс і тестів: пам'ять пігулками, колір кружечками. */
export const DEMO_VARIANT_OPTIONS: VariantPickerOption[] = [
  {
    name: "Пам'ять",
    values: [
      {
        name: "256 ГБ",
        selected: true,
        exists: true,
        available: true,
        to: "/products/iphone-17-pro?Пам'ять=256+ГБ&Колір=Синій+титан",
      },
      {
        name: "512 ГБ",
        selected: false,
        exists: true,
        available: false,
        to: "/products/iphone-17-pro?Пам'ять=512+ГБ&Колір=Синій+титан",
      },
      {
        name: "1 ТБ",
        selected: false,
        exists: false,
        available: false,
        to: "/products/iphone-17-pro",
      },
    ],
  },
  {
    name: "Колір",
    values: [
      {
        name: "Синій титан",
        selected: true,
        exists: true,
        available: true,
        swatch: "#3c4a5e",
        to: "/products/iphone-17-pro?Пам'ять=256+ГБ&Колір=Синій+титан",
      },
      {
        name: "Срібний",
        selected: false,
        exists: true,
        available: true,
        swatch: "#e3e4e5",
        to: "/products/iphone-17-pro?Пам'ять=256+ГБ&Колір=Срібний",
      },
      {
        name: "Космічний помаранчевий",
        selected: false,
        exists: true,
        available: false,
        swatch: "#f77e2d",
        to: "/products/iphone-17-pro?Пам'ять=256+ГБ&Колір=Космічний+помаранчевий",
      },
    ],
  },
];
