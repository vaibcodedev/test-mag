import { WishlistView } from "~/components/saved/wishlist-view";

export function meta() {
  return [{ title: "Обране — Ionov Store" }, { name: "robots", content: "noindex" }];
}

export default function Wishlist() {
  return (
    <main id="main-content" tabIndex={-1} className="flex-1 py-12 outline-none">
      <WishlistView />
    </main>
  );
}
