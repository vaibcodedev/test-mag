import { Tabs as TabsPrimitive } from "radix-ui";
import { createContext, useContext, type ComponentProps } from "react";

import { cn } from "~/lib/utils";

import { tabsListVariants, tabsTriggerVariants, type TabsVariants } from "./tabs.variants";

type TabsVariant = NonNullable<TabsVariants["variant"]>;

const TabsVariantContext = createContext<TabsVariant>("pills");

export function Tabs({ className, ...props }: ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-6", className)}
      {...props}
    />
  );
}

export function TabsList({
  className,
  variant = "pills",
  ...props
}: ComponentProps<typeof TabsPrimitive.List> & TabsVariants) {
  const resolved = variant ?? "pills";

  return (
    <TabsVariantContext.Provider value={resolved}>
      <TabsPrimitive.List
        data-slot="tabs-list"
        data-variant={resolved}
        className={cn(tabsListVariants({ variant: resolved }), className)}
        {...props}
      />
    </TabsVariantContext.Provider>
  );
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  const variant = useContext(TabsVariantContext);

  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(tabsTriggerVariants({ variant }), className)}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("rounded-sm focus-ring", className)}
      {...props}
    />
  );
}
