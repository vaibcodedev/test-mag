import type { ComponentProps } from "react";

import { fieldClassName } from "~/components/ui/input";
import { cn } from "~/lib/utils";

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(fieldClassName, "field-sizing-content min-h-24 py-3", className)}
      {...props}
    />
  );
}
