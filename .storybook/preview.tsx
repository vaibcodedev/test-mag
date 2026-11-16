import type { Preview } from "@storybook/react-vite";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";

import { Toaster } from "../app/components/ui/sonner";
import { TooltipProvider } from "../app/components/ui/tooltip";

import "../app/styles/app.css";

/** Тло, на якому компонент живе на сайті. Задається в історії: parameters.surface. */
const SURFACES = {
  page: "bg-page text-ink",
  surface: "bg-surface text-ink",
  ink: "bg-ink text-surface",
} as const;

type Surface = keyof typeof SURFACES;

/**
 * Історії живуть у data-router: без нього не працюють <Form>, useNavigate і подібне.
 * Роутер створюється один раз, а вміст історії приходить через контекст, тож зміна args
 * у панелі Controls оновлює компонент і не скидає його стан.
 */
const StoryContent = createContext<ReactNode>(null);

function StoryOutlet() {
  return useContext(StoryContent);
}

function StoryRouter({ children }: { children: ReactNode }) {
  const router = useMemo(() => createMemoryRouter([{ path: "*", Component: StoryOutlet }]), []);

  return (
    <StoryContent.Provider value={children}>
      <RouterProvider router={router} />
    </StoryContent.Provider>
  );
}

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    controls: { expanded: true },
    options: {
      storySort: { order: ["Токени", "UI", "Product", "Layout", "Home"] },
    },
    a11y: { test: "todo" },
  },
  decorators: [
    (Story, context) => {
      const surface = (context.parameters.surface as Surface | undefined) ?? "surface";

      return (
        <StoryRouter>
          <TooltipProvider>
            <div lang="uk" className={`${SURFACES[surface]} min-h-24 p-6 font-sans`}>
              <Story />
            </div>
            <Toaster />
          </TooltipProvider>
        </StoryRouter>
      );
    },
  ],
};

export default preview;
