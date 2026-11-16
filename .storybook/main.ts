import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: ["../app/components/**/*.mdx", "../app/components/**/*.stories.tsx"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  core: {
    disableTelemetry: true,
    builder: {
      name: "@storybook/builder-vite",
      options: {
        // Окремий конфіг: основний vite.config.ts піднімає плагіни Oxygen і React Router,
        // які Storybook не потрібні й ламають його збірку.
        viteConfigPath: ".storybook/vite.config.ts",
      },
    },
  },
  // Іконки та favicon із public/ доступні в історіях за тими самими адресами.
  staticDirs: ["../public"],
};

export default config;
