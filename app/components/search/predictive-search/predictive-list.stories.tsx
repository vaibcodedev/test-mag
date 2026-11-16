import type { Meta, StoryObj } from "@storybook/react-vite";

import { DEMO_PREDICTIVE_EMPTY, DEMO_PREDICTIVE_RESULT } from "~/components/search/search.fixtures";

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

/**
 * Список підказок без поля пошуку. Живий варіант із запитами до магазину —
 * у шапці сайту та на сторінці /search.
 */
const meta = {
  title: "Search/PredictiveList",
  component: PredictiveList,
  tags: ["autodocs"],
  parameters: { surface: "page" },
  args: { listId: "story-predictive-list", status: "success", options: RESULTS, activeId: null },
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PredictiveList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Results: Story = {};

/** Вибір стрілками: рядок підсвічено, поле тримає aria-activedescendant. */
export const ActiveOption: Story = { args: { activeId: "story-product-0" } };

/** Перший запит ще в дорозі. */
export const Loading: Story = { args: { status: "loading", options: NO_RESULTS } };

/** Набирають далі: попередні підказки лишаються, але тьмяні. */
export const LoadingWithStaleResults: Story = { args: { status: "loading" } };

export const Empty: Story = { args: { options: NO_RESULTS } };

export const Failed: Story = { args: { status: "error", options: NO_RESULTS } };
