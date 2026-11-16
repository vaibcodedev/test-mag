import type { Meta, StoryObj } from "@storybook/react-vite";
import { Scale, ShoppingCart, User } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { toast } from "~/components/ui/sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";

import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";

const meta = {
  title: "UI/Sheet, Dialog, Menu, Toast",
  component: Sheet,
  tags: ["autodocs"],
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CartSheet: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary">
          <ShoppingCart aria-hidden="true" />
          Кошик
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Кошик</SheetTitle>
          <SheetDescription>1 товар на 64 999 ₴</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <p className="text-body text-ink-2">iPhone 17 Pro 256 ГБ, синій титан.</p>
        </SheetBody>
        <SheetFooter>
          <Button size="lg">Оформити замовлення</Button>
          <SheetClose asChild>
            <Button variant="ghost">Продовжити покупки</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const ConfirmDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">Очистити кошик</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Очистити кошик?</DialogTitle>
          <DialogDescription>
            З кошика зникнуть усі 3 товари. Обране та порівняння залишаться.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Залишити товари</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="ink">Очистити кошик</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const AccountMenu: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary">
          <User aria-hidden="true" />
          Кабінет
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Олена Коваль</DropdownMenuLabel>
        <DropdownMenuItem>Мої замовлення</DropdownMenuItem>
        <DropdownMenuItem>Обране</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Вийти</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

export const TooltipOnIcon: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="secondary" size="icon" aria-label="Порівняння">
          <Scale aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Порівняння: 2 товари</TooltipContent>
    </Tooltip>
  ),
};

export const Toast: Story = {
  render: () => (
    <Button
      onClick={() =>
        toast.success("Додано в кошик", { description: "iPhone 17 Pro 256 ГБ, синій титан" })
      }
    >
      <ShoppingCart aria-hidden="true" />
      Показати toast
    </Button>
  ),
};
