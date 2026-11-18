import { Avatar as AvatarPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

import { avatarVariants, type AvatarVariants } from "./avatar.variants";

export type AvatarProps = ComponentProps<typeof AvatarPrimitive.Root> & AvatarVariants;

/** Аватар автора відгуку чи консультанта: фото, а поки його немає — ініціали. */
export function Avatar({ className, size = "md", tone = "ink", ...props }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      data-tone={tone}
      className={cn(avatarVariants({ size, tone }), className)}
      {...props}
    />
  );
}

export function AvatarImage({ className, ...props }: ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full rounded-pill object-cover", className)}
      {...props}
    />
  );
}

/** Ініціали: «ОК» для «Олена Коваль». Колір і тло бере від Avatar. */
export function AvatarFallback({
  className,
  ...props
}: ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn("flex size-full items-center justify-center rounded-pill", className)}
      {...props}
    />
  );
}

/** Позначка в кутку аватара: «перевірений покупець», «онлайн». */
export function AvatarBadge({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        "absolute end-0 bottom-0 z-10 inline-flex size-4 items-center justify-center rounded-pill border-2 border-surface bg-blue text-on-accent select-none group-data-[size=sm]/avatar:size-3 [&>svg]:size-2.5 group-data-[size=sm]/avatar:[&>svg]:hidden",
        className,
      )}
      {...props}
    />
  );
}

/** Кілька аватарів внапуск. Обвідка кольору surface розділяє сусідні кола. */
export function AvatarGroup({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        "group/avatar-group flex -space-x-2 *:data-[slot=avatar]:border-2 *:data-[slot=avatar]:border-surface",
        className,
      )}
      {...props}
    />
  );
}

/** Лічильник решти: «+12». */
export function AvatarGroupCount({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        "relative flex size-11 shrink-0 items-center justify-center rounded-pill border-2 border-surface bg-page text-small font-semibold text-ink tabular-nums group-has-data-[size=lg]/avatar-group:size-13 group-has-data-[size=sm]/avatar-group:size-8 group-has-data-[size=sm]/avatar-group:text-caption",
        className,
      )}
      {...props}
    />
  );
}
