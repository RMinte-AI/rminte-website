import { rows, stmt } from "./store.mjs";
import { iso } from "./domain.mjs";
export async function enqueuePending(env, requestId = null) {
  if (!env.SAMPLE_JOBS) return;
  const jobs = await rows(
    env,
    `SELECT id FROM sample_jobs WHERE status IN ('queued','retry_wait','pending_assets') AND next_attempt_at<=? ${requestId ? "AND request_id=?" : ""} AND (last_enqueued_at IS NULL OR last_enqueued_at<?) LIMIT 20`,
    [
      iso(),
      ...(requestId ? [requestId] : []),
      new Date(Date.now() - 60000).toISOString(),
    ],
  );
  for (const j of jobs) {
    await env.SAMPLE_JOBS.send({ jobId: j.id });
    await stmt(env, "UPDATE sample_jobs SET last_enqueued_at=? WHERE id=?", [
      iso(),
      j.id,
    ]).run();
  }
}
