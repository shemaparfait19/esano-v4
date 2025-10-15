import fs from "fs";
import path from "path";
import crypto from "crypto";

const ROOT = process.cwd();

function walk(dir, ignore = ["node_modules", ".next", ".git", "uploads"]) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    if (ignore.includes(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...walk(full, ignore));
    else files.push(full);
  }
  return files;
}

function hashFile(p) {
  const buf = fs.readFileSync(p);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function readSafe(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

function extractImports(src) {
  const re = /import\s+[\s\S]*?from\s+["']([^"']+)["'];?/g;
  const out = [];
  let m;
  while ((m = re.exec(src))) out.push(m[1]);
  return Array.from(new Set(out));
}

function extractEnv(src) {
  const re = /process\.env\.([A-Z0-9_]+)/g;
  const out = new Set();
  let m;
  while ((m = re.exec(src))) out.add(m[1]);
  return Array.from(out);
}

function extractFirestoreCollections(src) {
  const re = /\bcollection\(\s*["'`]([^"'`]+)["'`]\s*\)/g;
  const out = new Set();
  let m;
  while ((m = re.exec(src))) out.add(m[1]);
  return Array.from(out);
}

function extractApiRoutes(files) {
  const apiRoot = path.join(ROOT, "src", "app", "api");
  const routes = [];
  for (const f of files) {
    if (!f.startsWith(apiRoot)) continue;
    if (!/route\.(ts|js)$/.test(f)) continue;
    const rel = f.replace(apiRoot, "");
    const routePath = rel.replace(/\\/g, "/").replace(/\/route\.(ts|js)$/i, "");
    const parts = routePath.split("/").filter(Boolean);
    // Build Next.js app router endpoint path
    const endpoint = "/api/" + parts.join("/");
    const src = readSafe(f);
    const supports = {
      GET: /export\s+async\s+function\s+GET/.test(src),
      POST: /export\s+async\s+function\s+POST/.test(src),
      PATCH: /export\s+async\s+function\s+PATCH/.test(src),
      PUT: /export\s+async\s+function\s+PUT/.test(src),
      DELETE: /export\s+async\s+function\s+DELETE/.test(src),
    };
    routes.push({
      file: path.relative(ROOT, f),
      endpoint,
      methods: Object.keys(supports).filter((k) => supports[k]),
    });
  }
  return routes.sort((a, b) => a.endpoint.localeCompare(b.endpoint));
}

function extractPages(files) {
  const appRoot = path.join(ROOT, "src", "app");
  const pages = [];
  for (const f of files) {
    if (!f.startsWith(appRoot)) continue;
    if (!/page\.(tsx|jsx|ts|js)$/.test(f)) continue;
    const rel = f.replace(appRoot, "");
    const routePath = rel
      .replace(/\\/g, "/")
      .replace(/\/page\.(tsx|jsx|ts|js)$/i, "");
    const url = routePath || "/";
    pages.push({ file: path.relative(ROOT, f), route: url });
  }
  return pages.sort((a, b) => a.route.localeCompare(b.route));
}

function main() {
  const files = walk(ROOT);
  // Include ALL files (exclude only ignored dirs). We'll parse content only for code-like files.
  const codeFiles = files;
  const manifest = {
    generatedAt: new Date().toISOString(),
    root: path.basename(ROOT),
    packageJson: (() => {
      const p = path.join(ROOT, "package.json");
      const raw = readSafe(p);
      try {
        return JSON.parse(raw);
      } catch {
        return { error: "unreadable" };
      }
    })(),
    nextConfig:
      readSafe(path.join(ROOT, "next.config.ts")) ||
      readSafe(path.join(ROOT, "next.config.js")),
    tsconfig: readSafe(path.join(ROOT, "tsconfig.json")),
    appRoutes: extractPages(codeFiles),
    apiRoutes: extractApiRoutes(codeFiles),
    files: codeFiles.map((f) => {
      const rel = path.relative(ROOT, f);
      const size = fs.statSync(f).size;
      const sha256 = hashFile(f);
      const ext = path.extname(f).toLowerCase();
      const isCodeLike =
        /\.(ts|tsx|js|mjs|cjs|json|md|mdx|css|scss|sass|yml|yaml|toml|txt|rules)$/.test(
          ext
        );
      const content = isCodeLike && size <= 200 * 1024 ? readSafe(f) : "";
      return {
        path: rel,
        size,
        sha256,
        ext,
        imports: /\.(ts|tsx|js|mjs|cjs)$/.test(ext)
          ? extractImports(content)
          : [],
        env: isCodeLike ? extractEnv(content) : [],
        firestoreCollections: isCodeLike
          ? extractFirestoreCollections(content)
          : [],
        content: content || undefined,
      };
    }),
  };
  process.stdout.write(JSON.stringify(manifest, null, 2));
}

main();
