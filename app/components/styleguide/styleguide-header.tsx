import { StyleguideNav } from "./styleguide-nav";

/** Шапка сторінки /styleguide: h1, пояснення та навігація розділами. */
export function StyleguideHeader() {
  return (
    <header className="flex flex-col gap-6">
      <div className="flex max-w-3xl flex-col gap-3">
        <h1 className="text-display text-ink">UI-кіт «Сад»</h1>
        <p className="text-body text-ink-2">
          Токени, компоненти та їхні стани. Це джерело правди для аудиту дизайн-системи: якщо чогось
          немає на цій сторінці, цього не має бути й на сайті.
        </p>
      </div>
      <StyleguideNav />
    </header>
  );
}
