import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("products/:handle", "routes/product.tsx"),
  route("collections", "routes/collections.tsx"),
  route("collections/:handle", "routes/collection.tsx"),
  route("cart", "routes/cart.tsx"),
  route("search", "routes/search.tsx"),
  route("account", "routes/account.tsx"),
  route("robots.txt", "routes/robots.ts"),
  route("sitemap.xml", "routes/sitemap.ts"),
  route("pages/:handle", "routes/page.tsx"),
  route("blogs/:blog", "routes/blog.tsx"),
  route("blogs/:blog/:handle", "routes/article.tsx"),
  route("styleguide", "routes/styleguide.tsx"),
  route("wishlist", "routes/wishlist.tsx"),
  route("compare", "routes/compare.tsx"),
  route("api/saved-products", "routes/api.saved-products.ts"),
  route("*", "routes/catchall.tsx"),
] satisfies RouteConfig;
