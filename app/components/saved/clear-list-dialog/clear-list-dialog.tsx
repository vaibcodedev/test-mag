import { Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";

export type ClearListDialogProps = {
  /** Текст кнопки, що відкриває діалог: «Очистити обране». */
  triggerLabel: string;
  title: string;
  description: string;
  /** Текст кнопки підтвердження: «Так, очистити». */
  confirmLabel: string;
  onConfirm: () => void;
  className?: string;
};

/**
 * Кнопка очищення списку з підтвердженням: випадкове натискання нічого не видаляє.
 * AlertDialog не закривається кліком повз вікно; фокус спершу стає на «Скасувати».
 */
export function ClearListDialog({
  triggerLabel,
  title,
  description,
  confirmLabel,
  onConfirm,
  className,
}: ClearListDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="secondary" className={className}>
          <Trash2 strokeWidth={2} aria-hidden="true" />
          {triggerLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Trash2 strokeWidth={2} />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Скасувати</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
