const SECTIONS = [
  { id: "colors", label: "Кольори" },
  { id: "type", label: "Шрифти" },
  { id: "sizes", label: "Розміри" },
  { id: "buttons", label: "Button" },
  { id: "labels", label: "Badge, Chip" },
  { id: "wordmark", label: "Wordmark" },
  { id: "commerce", label: "Ціна, рейтинг" },
  { id: "data", label: "Картки, рядки, таблиці" },
  { id: "forms", label: "Поля" },
  { id: "overlays", label: "Панелі, меню" },
  { id: "navigation", label: "Навігація" },
  { id: "product-card", label: "ProductCard" },
];

export function StyleguideNav() {
  return (
    <nav aria-label="Розділи UI-кіта">
      <ul className="flex flex-wrap gap-2">
        {SECTIONS.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="inline-flex h-11 items-center rounded-pill bg-surface px-4 text-small font-semibold text-ink focus-ring transition-colors duration-150 hover:bg-page-hover"
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
