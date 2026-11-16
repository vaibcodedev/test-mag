import type { Meta, StoryObj } from "@storybook/react-vite";

import { DEMO_PREDICTIVE_EMPTY, DEMO_PREDICTIVE_RESULT } from "~/components/search/search.fixtures";
import { Command } from "~/components/ui/command";
import { popoverSurfaceClassName } from "~/components/ui/popover-surface";

import { PredictiveList } from "./predictive-list";
import { buildPredictiveOptions } from "./predictive-options";

const RESULTS = buildPredictiveOptions(DEMO_PREDICTIVE_RESULT.items, {
  idPrefix: "story",
  resultTerm: "iphone",
  typedTerm: "iphone",
});

const NO_RESULTS = buildPredictiveOptions(DEMO_PREDICTIVE_EMPTY.items, {
  idPrefix: "story",
  resultTerm: "zzzz",
  typedTerm: "zzzz",
});

/** Значення cmdk без вибраного рядка: порожнє значення cmdk замінює першим рядком. */
const NO_ACTIVE = "-";

/**
 * Список підказок без поля пошуку. Живий варіант із запитами до магазину —
 * у шапці сайту та на сторінці /search. Список стоїть у Command (cmdk), як і на сайті:
 * вибір мишею працює, вибраний рядок задає аргумент active.
 */
const meta = {
  title: "Search/PredictiveList",
  component: PredictiveList,
  tags: ["autodocs"],
  parameters: { surface: "page" },
  args: { status: "success", options: RESULTS },
  decorators: [
    (Story, { parameters }) => (
      <Command
        shouldFilter={false}
        defaultValue={(parameters.active as string | undefined) ?? NO_ACTIVE}
        className="h-auto max-w-xl overflow-visible bg-transparent"
      >
        <div className={popoverSurfaceClassName}>
          <Story />
        </div>
      </Command>
    ),
  ],
} satisfies Meta<typeof PredictiveList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Results: Story = {};

/** Вибір стрілками: рядок підсвічено, поле тримає aria-activedescendant. */
export const ActiveOption: Story = { parameters: { active: "story-product-0" } };

/** Перший запит ще в дорозі. */
export const Loading: Story = { args: { status: "loading", options: NO_RESULTS } };

/** Набирають далі: попередні підказки лишаються, але тьмяні. */
export const LoadingWithStaleResults: Story = { args: { status: "loading" } };

export const Empty: Story = { args: { options: NO_RESULTS } };

export const Failed: Story = { args: { status: "error", options: NO_RESULTS } };
