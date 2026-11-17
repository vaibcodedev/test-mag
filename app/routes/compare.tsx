import { CompareView } from "~/components/saved/compare-view";

export function meta() {
  return [{ title: "Порівняння — Ionov Store" }, { name: "robots", content: "noindex" }];
}

export default function Compare() {
  return (
    <main id="main-content" tabIndex={-1} className="flex-1 py-12 outline-none">
      <CompareView />
    </main>
  );
}
