import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import type { ComponentProps } from "react";

import { menuItemClassName, menuSeparatorClassName } from "~/components/ui/popover-surface";
import { cn } from "~/lib/utils";

export type CommandProps = ComponentProps<typeof CommandPrimitive> & {
  /**
   * Без вигляду панелі: ні тла, ні радіуса, ні обрізання. Для випадку, коли Command лише
   * обгортає стороннє поле (пошук у шапці), а список живе окремо в Popover.
   */
  unstyled?: boolean;
};

/** Основа predictive search: поле, список підказок, навігація стрілками. */
export function Command({ className, unstyled = false, ...props }: CommandProps) {
  return (
    <CommandPrimitive
      data-slot="command"
      data-unstyled={unstyled || undefined}
      className={cn(
        unstyled
          ? "relative text-ink outline-none"
          : "flex size-full flex-col overflow-hidden rounded-md bg-surface text-ink",
        className,
      )}
      {...props}
    />
  );
}

export function CommandInput({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div
      data-slot="command-input-wrapper"
      // Кільце всередину: зовнішню тінь обрізав би overflow-hidden у Command.
      className="flex h-14 items-center gap-3 border-b border-line px-4 has-focus-visible:inset-ring-3 has-focus-visible:inset-ring-blue has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-transparent"
    >
      <Search aria-hidden="true" strokeWidth={2} className="size-5 shrink-0 text-ink-2" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          "h-full w-full min-w-0 bg-transparent text-body text-ink outline-none placeholder:text-muted-foreground disabled:opacity-45",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export function CommandList({ className, ...props }: ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn("max-h-96 scroll-py-1.5 overflow-x-hidden overflow-y-auto p-1.5", className)}
      {...props}
    />
  );
}

export function CommandEmpty({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn("px-3 py-8 text-center text-small text-muted-foreground", className)}
      {...props}
    />
  );
}

/** Рядок «шукаємо…» у списку, поки підказки вантажаться. Має role="progressbar" від cmdk. */
export function CommandLoading({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Loading> & { className?: string }) {
  return (
    <div data-slot="command-loading" className={cn("text-small text-muted-foreground", className)}>
      <CommandPrimitive.Loading {...props} />
    </div>
  );
}

export function CommandGroup({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-caption [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function CommandItem({ className, ...props }: ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        menuItemClassName,
        "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-45 data-[selected=true]:bg-page",
        className,
      )}
      {...props}
    />
  );
}

export function CommandSeparator({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn(menuSeparatorClassName, className)}
      {...props}
    />
  );
}
