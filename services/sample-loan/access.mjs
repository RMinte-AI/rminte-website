export async function sampleAccess(user, env) {
  if (
    !user ||
    user.disabled_at ||
    user.must_change_password ||
    user.role !== "admin"
  )
    return { canManage: false };
  if (user.is_owner) return { canManage: true };
  // Installed explicitly with the sample-loan migration, never inferred from case grants.
  const grant = await env.CASE_DB.prepare(
    "SELECT user_id FROM sample_admin_grants WHERE user_id=? AND revoked_at IS NULL",
  )
    .bind(user.id)
    .first();
  return { canManage: !!grant };
}
export const liveAccessSQL = `EXISTS (SELECT 1 FROM users u JOIN sessions s ON s.user_id=u.id WHERE u.id=? AND s.token_hash=? AND s.expires_at>? AND u.role='admin' AND u.disabled_at IS NULL AND u.must_change_password=0 AND EXISTS (SELECT 1 FROM access_settings WHERE id=1 AND ready=1) AND (u.is_owner=1 OR EXISTS (SELECT 1 FROM sample_admin_grants g WHERE g.user_id=u.id AND g.revoked_at IS NULL)))`;
