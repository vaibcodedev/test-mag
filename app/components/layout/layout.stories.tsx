import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heart } from "lucide-react";

import { EmptyState } from "~/components/layout/empty-state";
import { Footer } from "~/components/layout/footer";
import { MegaMenu } from "~/components/layout/mega-menu";
import { SearchBar } from "~/components/layout/search-bar";
import { Section, SectionHeader } from "~/components/layout/section";
import { TopBar } from "~/components/layout/top-bar";
import { Button } from "~/components/ui/button";
import { CATALOG_LINKS } from "~/lib/content/site";

/**
 * Каркас сторінки. Header і BottomBar залежать від стану кошика,
 * тому дивитися їх зручніше на самому сайті.
 */
const meta = {
  title: "Layout/Каркас",
  parameters: { surface: "page" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const TopBarStory: Story = { name: "TopBar", render: () => <TopBar /> };

export const CatalogMegaMenu: Story = {
  render: () => (
    <div className="min-h-96 rounded-lg bg-surface p-4">
      <MegaMenu categories={CATALOG_LINKS} />
    </div>
  ),
};

export const Search: Story = {
  render: () => (
    <div className="max-w-xl rounded-lg bg-surface p-4">
      <SearchBar />
    </div>
  ),
};

export const SectionWithHeader: Story = {
  render: () => (
    <Section id="demo" contained={false}>
      <SectionHeader
        sectionId="demo"
        title="Каталог техніки Apple"
        description="Усе є в шоурумі у Вінниці або приїде завтра."
        link={{ title: "Увесь каталог", to: "/collections" }}
      />
      <div className="rounded-lg bg-surface p-6 text-body text-ink-2">Вміст секції</div>
    </Section>
  ),
};

export const Empty: Story = {
  render: () => (
    <EmptyState
      icon={<Heart strokeWidth={2} />}
      title="В обраному поки порожньо"
      description="Натисніть сердечко на картці товару, і він з'явиться тут."
      action={<Button>Перейти до каталогу</Button>}
    />
  ),
};

export const FooterStory: Story = { name: "Footer", render: () => <Footer /> };
