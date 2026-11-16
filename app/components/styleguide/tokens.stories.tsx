import type { Meta, StoryObj } from "@storybook/react-vite";

import { TokensSection } from "./tokens-section";

/** Кольори, шрифти, шкала, радіуси й відступи з styles/tokens.css. */
const meta = {
  title: "Токени/Дизайн-токени",
  component: TokensSection,
  parameters: { surface: "page" },
} satisfies Meta<typeof TokensSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const All: Story = {
  render: () => (
    <div className="flex flex-col gap-section">
      <TokensSection />
    </div>
  ),
};
