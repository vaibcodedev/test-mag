import { AspectRatio as AspectRatioPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

/** Тримає пропорції блока: фото товару 1/1, банер 16/9. Місце зайняте ще до завантаження фото. */
export function AspectRatio(props: ComponentProps<typeof AspectRatioPrimitive.Root>) {
  return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />;
}
