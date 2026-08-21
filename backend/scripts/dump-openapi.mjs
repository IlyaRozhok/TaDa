// Dump the OpenAPI spec from a RUNNING dev backend into backend/openapi.json.
//
//   npm run dev            # in one terminal (needs the local database)
//   npm run openapi:dump   # in another
//
// The spec is assembled by Nest at boot, so there is no way to produce it
// without the application context — and the application context connects to
// the database. Dumping from the running server keeps the script trivial and
// guarantees the file matches what the server actually serves.
//
// The committed openapi.json is a SNAPSHOT, refreshed manually whenever the
// API surface changes; frontend `npm run gen:api` turns it into TypeScript
// types. Keeping it in git means the frontend can regenerate without booting
// the backend, and diffs of the spec show up in review.
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const port = process.env.PORT ?? "5001";
const url = `http://localhost:${port}/api/docs-json`;
const out = join(dirname(fileURLToPath(import.meta.url)), "..", "openapi.json");

const res = await fetch(url);
if (!res.ok) {
  console.error(`GET ${url} -> ${res.status}. Is the dev backend running?`);
  process.exit(1);
}

const spec = await res.json();
await writeFile(out, `${JSON.stringify(spec, null, 2)}\n`);
console.log(`Wrote ${out}`);
