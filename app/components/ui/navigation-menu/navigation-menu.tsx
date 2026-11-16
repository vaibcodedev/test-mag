import { ChevronDown } from "lucide-react";
import { NavigationMenu as NavigationMenuPrimitive } from "radix-ui";
import { useRef, type ComponentProps } from "react";

import { cn } from "~/lib/utils";

/** Основа мега-меню «Каталог»: відкривається за hover і з клавіатури. */
export function NavigationMenu({
  className,
  children,
  ...props
}: ComponentProps<typeof NavigationMenuPrimitive.Root>) {
  return (
    <NavigationMenuPrimitive.Root
      data-slot="navigation-menu"
      className={cn("relative flex max-w-max flex-1 items-center justify-center", className)}
      {...props}
    >
      {children}
      <div className="absolute start-0 top-full z-50 flex justify-center pt-2">
        <NavigationMenuPrimitive.Viewport
          data-slot="navigation-menu-viewport"
          className="relative h-(--radix-navigation-menu-viewport-height) w-full origin-top overflow-hidden rounded-lg border border-line bg-surface text-ink shadow-lift transition-[width,height] md:w-(--radix-navigation-menu-viewport-width) data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
        />
      </div>
    </NavigationMenuPrimitive.Root>
  );
}

export function NavigationMenuList({
  className,
  ...props
}: ComponentProps<typeof NavigationMenuPrimitive.List>) {
  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={cn("flex flex-1 list-none items-center gap-1", className)}
      {...props}
    />
  );
}

export function NavigationMenuItem(props: ComponentProps<typeof NavigationMenuPrimitive.Item>) {
  return <NavigationMenuPrimitive.Item data-slot="navigation-menu-item" {...props} />;
}

export const navigationMenuTriggerClassName =
  "group/navigation-menu-trigger focus-ring inline-flex h-11.5 cursor-pointer items-center justify-center gap-2 rounded-md px-4 text-small font-semibold text-ink transition-colors duration-150 hover:bg-page data-open:bg-page [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5";

/**
 * Меню відкривається і за hover, і за кліком. У Radix клік по тригеру перемикає стан, тому
 * після відкриття за hover перший клік меню закривав би: людина навела, клацнула — і меню
 * зникло. Тут перший клік мишею за одне наведення лишає відкрите меню відкритим
 * (preventDefault вимикає обробник Radix), а вже наступний перемикає як зазвичай.
 * Enter і Пробіл (click із detail 0) та дотик працюють без змін.
 */
export function NavigationMenuTrigger({
  className,
  children,
  onClick,
  onPointerEnter,
  ...props
}: ComponentProps<typeof NavigationMenuPrimitive.Trigger>) {
  const clickedInHoverRef = useRef(false);

  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      className={cn(navigationMenuTriggerClassName, className)}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        clickedInHoverRef.current = false;
      }}
      onClick={(event) => {
        onClick?.(event);
        const byPointer = event.detail > 0;
        const isOpen = event.currentTarget.getAttribute("data-state") === "open";
        if (byPointer && isOpen && !clickedInHoverRef.current) event.preventDefault();
        if (byPointer) clickedInHoverRef.current = true;
      }}
      {...props}
    >
      {children}
      <ChevronDown
        aria-hidden="true"
        strokeWidth={2}
        className="size-4 text-ink-2 transition-transform group-data-open/navigation-menu-trigger:rotate-180"
      />
    </NavigationMenuPrimitive.Trigger>
  );
}

export function NavigationMenuContent({
  className,
  ...props
}: ComponentProps<typeof NavigationMenuPrimitive.Content>) {
  return (
    <NavigationMenuPrimitive.Content
      data-slot="navigation-menu-content"
      className={cn(
        "top-0 left-0 w-full p-4 data-[motion^=from-]:animate-in data-[motion^=from-]:fade-in data-[motion^=to-]:animate-out data-[motion^=to-]:fade-out md:absolute md:w-auto",
        className,
      )}
      {...props}
    />
  );
}

export function NavigationMenuLink({
  className,
  ...props
}: ComponentProps<typeof NavigationMenuPrimitive.Link>) {
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-sm px-3 py-2 text-small text-ink focus-ring transition-colors duration-150 hover:bg-page data-active:font-semibold data-active:text-blue [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
        className,
      )}
      {...props}
    />
  );
}
