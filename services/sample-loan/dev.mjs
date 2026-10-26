// Disposable website Worker + D1/R2 and the actual PDF pipeline driven by local Chromium.
// No Cloudflare account, production bindings, email or bank operations are used.
import { mkdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { startServer } from "../../scripts/ci/serve.mjs";
import { runJob, repairJobs } from "./jobs.mjs";
const root = resolve(fileURLToPath(new URL("../..", import.meta.url))),
  port = Number(process.env.SAMPLE_DEV_PORT || 8798);
mkdirSync(join(root, "output/ci"), { recursive: true });
const server = await startServer(root, port, undefined, { withBindings: true }),
  fixture = join(server.runtime, "services/case-access");
let interval,
  busy = false;
async function stop() {
  clearInterval(interval);
  await server.stop();
}
try {
  const env = {
    ...server.bindings,
    DOCUMENT_ASSETS: {
      fetch: async (request) => {
        const name = new URL(request.url).pathname.slice(1);
        if (
          ![
            "manifest.json",
            "loan-sc.woff2",
            "loan-ext.woff2",
            "logo.svg",
          ].includes(name)
        )
          return new Response("Not found", { status: 404 });
        return new Response(
          readFileSync(new URL("document-assets/" + name, import.meta.url)),
        );
      },
    },
  };
  const count = await env.CASE_DB.prepare(
    "SELECT COUNT(*) AS n FROM users WHERE is_owner=1",
  ).first();
  if (count.n !== 1)
    throw new Error(
      "Local PDF consumer is not connected to the website fixture database",
    );
  const consume = async () => {
    if (busy) return;
    busy = true;
    try {
      await repairJobs(env);
      const { results } = await env.CASE_DB.prepare(
        "SELECT id FROM sample_jobs WHERE status IN ('queued','retry_wait','pending_assets') AND next_attempt_at<=? LIMIT 5",
      )
        .bind(new Date().toISOString())
        .all();
      for (const job of results)
        await runJob(env, job.id, { launch: () => chromium.launch() });
    } catch (e) {
      console.error("Local PDF consumer:", e.code || e.name);
    } finally {
      busy = false;
    }
  };
  interval = setInterval(consume, 3000);
  await consume();
  console.log(`Local sample loans: ${server.url}/cases/`);
  console.log(
    `Temporary local login: ${join(fixture, ".local/admin-login.txt")}`,
  );
  console.log(
    "Data is isolated and is removed when this process stops. PDF runs in local Chromium, not Cloudflare Browser Run.",
  );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.once(signal, async () => {
      await stop();
      process.exit();
    });
} catch (e) {
  await stop();
  throw e;
}
