import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeProjectKind, parsePortfolioRoute, projectDetailHref, projectKinds } from "../src/utils/projectNavigation.js";

test("each grid carries its own filter into project links in both languages", () => {
  for (const lang of ["zh", "en"]) {
    for (const kind of projectKinds) {
      const href = projectDetailHref(lang, "flower-stand", kind);
      assert.deepEqual(parsePortfolioRoute(href), {
        path: `/${lang}/project/flower-stand`,
        returnKind: kind
      });
    }
  }
});

test("source survives refresh or opening the same link in a new tab without session state", () => {
  const href = projectDetailHref("zh", "flower-stand", "all");
  assert.equal(parsePortfolioRoute(href).returnKind, "all");
  assert.equal(parsePortfolioRoute(href).returnKind, "all");
});

test("direct project links and legacy grid aliases safely fall back to all", () => {
  assert.equal(parsePortfolioRoute("#/zh/project/flower-stand").returnKind, "all");
  assert.equal(normalizeProjectKind("school"), "all");
  assert.equal(normalizeProjectKind(undefined), "all");
  assert.deepEqual(parsePortfolioRoute(""), { path: "/", returnKind: "all" });
});

test("invalid or external source values cannot become a return destination", () => {
  for (const source of ["", "bad-filter", "https://example.com", "../about", "school"]) {
    assert.equal(parsePortfolioRoute(`#/zh/project/flower-stand?from=${encodeURIComponent(source)}`).returnKind, "all");
  }
});

test("query parameters never become part of the project slug or route path", () => {
  assert.deepEqual(parsePortfolioRoute("#/en/project/flower-stand?other=value&from=product"), {
    path: "/en/project/flower-stand",
    returnKind: "product"
  });
});
