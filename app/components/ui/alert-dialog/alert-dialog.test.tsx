import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "~/components/ui/button";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";

function renderDialog(handlers: { onConfirm?: () => void; onCancel?: () => void } = {}) {
  return render(
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="secondary">Очистити кошик</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Очистити кошик?</AlertDialogTitle>
          <AlertDialogDescription>З кошика зникнуть усі 3 товари.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handlers.onCancel}>Залишити товари</AlertDialogCancel>
          <AlertDialogAction variant="ink" onClick={handlers.onConfirm}>
            Видалити все
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>,
  );
}

const open = () => userEvent.click(screen.getByRole("button", { name: "Очистити кошик" }));

describe("AlertDialog", () => {
  it("відкривається з заголовком і описом", async () => {
    renderDialog();

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();

    await open();
    const dialog = screen.getByRole("alertdialog", { name: "Очистити кошик?" });

    expect(dialog).toHaveAccessibleDescription("З кошика зникнуть усі 3 товари.");
    expect(dialog).toHaveClass("rounded-lg", "bg-surface");
  });

  it("підтвердження викликає дію і закриває вікно", async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    renderDialog({ onConfirm, onCancel });

    await open();
    await userEvent.click(screen.getByRole("button", { name: "Видалити все" }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("скасування закриває вікно без дії", async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    renderDialog({ onConfirm, onCancel });

    await open();
    await userEvent.click(screen.getByRole("button", { name: "Залишити товари" }));

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("фокус спершу стає на скасування, Escape закриває вікно", async () => {
    renderDialog();

    await open();

    expect(screen.getByRole("button", { name: "Залишити товари" })).toHaveFocus();

    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("кнопки побудовані на варіантах Button", async () => {
    renderDialog();

    await open();

    expect(screen.getByRole("button", { name: "Видалити все" })).toHaveClass("bg-ink", "h-11.5");
    expect(screen.getByRole("button", { name: "Залишити товари" })).toHaveClass("bg-page");
  });
});
