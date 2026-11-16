import assert from "node:assert/strict";
import test from "node:test";

import routes from "../app/routes.ts";
import { loader } from "../app/routes/robots.ts";

const ORIGIN = "https://sad.example";

async function readRobotsTxt() {
  const response = loader({ request: new Request(`${ORIGIN}/robots.txt`) });
  const body = await response.text();
  const groups = new Map<string, string[]>();
  const sitemaps: string[] = [];
  let current: string[] | undefined;
  for (const line of body.split("\n")) {
    if (line === "" || line.startsWith("#")) continue;
    const separator = line.indexOf(":");
    const field = line.slice(0, separator);
    const value = line.slice(separator + 1).trim();
    if (field === "User-agent") {
      assert.equal(groups.has(value), false, `duplicate group for ${value}`);
      current = [];
      groups.set(value, current);
    } else if (field === "Disallow" && current) {
      current.push(value);
    } else if (field === "Sitemap") {
      sitemaps.push(value);
    } else {
      assert.fail(`unexpected robots.txt line: ${line}`);
    }
  }
  return { response, groups, sitemaps };
}

test("registers the route at /robots.txt", () => {
  assert.ok(
    routes.some((route) => route.path === "robots.txt" && route.file === "routes/robots.ts"),
    "routes.ts must register routes/robots.ts at robots.txt",
  );
});

test("serves robots.txt as cacheable plain text", async () => {
  const { response } = await readRobotsTxt();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "text/plain; charset=utf-8");
  assert.equal(response.headers.get("cache-control"), "public, max-age=86400");
});

test("keeps crawlers off cart, account, checkout handoffs, and Hydrogen endpoints", async () => {
  const { groups } = await readRobotsTxt();

  assert.deepEqual(groups.get("*"), [
    "/admin",
    "/cart",
    "/account",
    "/checkout",
    "/buy/",
    "/api/",
    "/__shopify",
    "/search",
    "/styleguide",
    "/wishlist",
    "/compare",
    "/collections/*?*sort_by=",
    "/collections/*?*filter.",
  ]);
});

test("points crawlers at the sitemap with an absolute URL from the request origin", async () => {
  const { sitemaps } = await readRobotsTxt();

  assert.deepEqual(sitemaps, [`${ORIGIN}/sitemap.xml`]);
  assert.ok(
    routes.some((route) => route.path === "sitemap.xml" && route.file === "routes/sitemap.ts"),
    "the Sitemap line needs a registered sitemap.xml route",
  );
});

test("gives AdsBot its own group without blocking collection landing pages", async () => {
  const { groups } = await readRobotsTxt();

  assert.deepEqual(groups.get("adsbot-google"), ["/cart", "/account", "/checkout", "/search"]);
  assert.equal(groups.size, 2);
});
