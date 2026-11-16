import { PredictiveSearch } from "~/components/search/predictive-search";

/**
 * Поле пошуку в шапці з підказками predictive search.
 * Працює і без JavaScript: це звичайна GET-форма на /search?q=…
 */
export function SearchBar({ className }: { className?: string }) {
  return (
    <div data-slot="search-bar" className={className}>
      <PredictiveSearch fieldClassName="border-transparent bg-page hover:border-line" />
    </div>
  );
}
