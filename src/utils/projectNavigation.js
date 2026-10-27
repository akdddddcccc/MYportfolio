export const projectKinds = ["all", "visual", "ui", "product", "others", "unpublished", "vibe-coding"];

export function normalizeProjectKind(kind) {
  return projectKinds.includes(kind) ? kind : "all";
}

export function parsePortfolioRoute(hash) {
  const [path, query = ""] = hash.replace(/^#/, "").split("?");
  return {
    path: path || "/",
    returnKind: normalizeProjectKind(new URLSearchParams(query).get("from"))
  };
}

export function projectDetailHref(lang, slug, fromKind) {
  return `#/${lang}/project/${slug}?from=${normalizeProjectKind(fromKind)}`;
}
