import type { Meta, StoryObj } from "@storybook/react-vite";
import { SavedLoadError } from "./saved-load-error";

const meta = {
  title: "Saved/SavedLoadError",
  component: SavedLoadError,
  parameters: { surface: "page" },
  args: { onRetry: () => {} },
} satisfies Meta<typeof SavedLoadError>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
