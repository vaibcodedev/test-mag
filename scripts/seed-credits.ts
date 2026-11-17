/**
 * Збирає docs/image-credits.md із маніфесту зображень (scripts/seed-images.json).
 * Запуск: node --experimental-strip-types scripts/seed-credits.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { PRODUCTS } from "./seed-catalog.ts";
import { IMAGE_MANIFEST } from "./seed-images.ts";
import { creditsMarkdown } from "./seed-media.ts";

const directory = join(import.meta.dirname, "..", "docs");
mkdirSync(directory, { recursive: true });
writeFileSync(join(directory, "image-credits.md"), creditsMarkdown(PRODUCTS, IMAGE_MANIFEST));
console.log(`docs/image-credits.md: зображень ${IMAGE_MANIFEST.images.length}`);
