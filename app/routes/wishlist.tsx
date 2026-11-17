import { WishlistView } from "~/components/saved/wishlist-view";

export function meta() {
  return [
    { title: "Обране — Ionov Store" },
    {
      name: "description",
      content:
        "Товари, які ви зберегли в Ionov Store: порівняйте ціни й додайте в кошик одним натисканням.",
    },
    { name: "robots", content: "noindex" },
  ];
}

export default function Wishlist() {
  return (
    <main id="main-content" tabIndex={-1} className="flex-1 py-12 outline-none">
      <WishlistView />
    </main>
  );
}
