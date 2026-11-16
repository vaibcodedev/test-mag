import type { Meta, StoryObj } from "@storybook/react-vite";
import { Link } from "react-router";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination";

const meta = {
  title: "UI/Pagination",
  component: Pagination,
  tags: ["autodocs"],
  parameters: { surface: "page" },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Посилання React Router через asChild. Поточна сторінка — blue. */
export const Middle: Story = {
  render: () => (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious asChild>
            <Link to="?page=2" />
          </PaginationPrevious>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink asChild page={1}>
            <Link to="?page=1" />
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink asChild page={2}>
            <Link to="?page=2" />
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink asChild page={3} isActive>
            <Link to="?page=3" />
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink asChild page={12}>
            <Link to="?page=12" />
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext asChild>
            <Link to="?page=4" />
          </PaginationNext>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
};

/** На першій сторінці «Попередня» вимкнена. */
export const FirstPage: Story = {
  render: () => (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious disabled />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=1" page={1} isActive />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=2" page={2} />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="?page=2" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
};

/** Лише «назад» і «далі»: курсорна пагінація Storefront API не знає номерів сторінок. */
export const PrevNextOnly: Story = {
  render: () => (
    <Pagination>
      <PaginationContent className="gap-3">
        <PaginationItem>
          <PaginationPrevious href="?direction=previous" text="Попередні товари" />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="?direction=next" text="Наступні товари" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
};
