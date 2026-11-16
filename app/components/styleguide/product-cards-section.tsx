import { useState } from "react";

import {
  ProductCard,
  ProductCardSkeleton,
  type ProductCardImage,
} from "~/components/product/product-card";
import { toast } from "~/components/ui/sonner";

import { StyleguideSection } from "./styleguide-section";
import { DEMO_CARDS, withImage } from "./styleguide.data";

const ADD_TO_CART_DEMO_MS = 900;

type ProductCardsSectionProps = {
  /** Фото товарів магазину для демо-карток. */
  images: readonly ProductCardImage[];
};

export function ProductCardsSection({ images }: ProductCardsSectionProps) {
  const [adding, setAdding] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<readonly string[]>([]);
  const [compare, setCompare] = useState<readonly string[]>([]);

  const toggle = (list: readonly string[], handle: string) =>
    list.includes(handle) ? list.filter((item) => item !== handle) : [...list, handle];

  // TODO(етап 4): замінити імітацію на справжнє додавання в кошик через useCartForm().
  const addToCart = (handle: string, title: string) => {
    setAdding(handle);
    window.setTimeout(() => {
      setAdding(null);
      toast.success("Додано в кошик", { description: title });
    }, ADD_TO_CART_DEMO_MS);
  };

  return (
    <StyleguideSection
      id="product-card"
      title="ProductCard"
      description="Усі стани картки: звичайна, знижка, новинка, вживаний, немає в наявності, завантаження. Ціни й назви тут демонстраційні, фото — з магазину."
    >
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-6">
        {DEMO_CARDS.map(({ label, product }, index) => (
          <li key={product.handle} className="flex min-w-0 flex-col gap-2">
            <span className="text-small font-semibold text-muted-foreground">{label}</span>
            <ProductCard
              product={withImage(product, images[index % Math.max(images.length, 1)])}
              adding={adding === product.handle}
              onAddToCart={() => addToCart(product.handle, product.title)}
              wishlisted={wishlist.includes(product.handle)}
              onToggleWishlist={() => setWishlist((list) => toggle(list, product.handle))}
              compared={compare.includes(product.handle)}
              onToggleCompare={() => setCompare((list) => toggle(list, product.handle))}
            />
          </li>
        ))}
        <li className="flex min-w-0 flex-col gap-2">
          <span className="text-small font-semibold text-muted-foreground">Завантаження</span>
          <ProductCardSkeleton />
        </li>
      </ul>
    </StyleguideSection>
  );
}
