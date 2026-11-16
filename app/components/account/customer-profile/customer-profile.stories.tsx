import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "~/components/ui/button";

import { CustomerProfile } from "./customer-profile";

const meta = {
  title: "Account/CustomerProfile",
  component: CustomerProfile,
  parameters: { surface: "page" },
  args: {
    firstName: "Олена",
    lastName: "Коваленко",
    email: "olena@example.com",
    actions: <Button variant="secondary">Вийти з кабінету</Button>,
  },
} satisfies Meta<typeof CustomerProfile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Покупець ще не вказав ім'я. */
export const WithoutName: Story = { args: { firstName: null, lastName: null } };
