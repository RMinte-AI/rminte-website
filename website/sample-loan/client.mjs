export async function api(
  path,
  {
    data,
    method = data ? "POST" : "GET",
    key,
    signal,
    body,
    headers = {},
  } = {},
) {
  let response, result;
  try {
    response = await fetch(path, {
      method,
      credentials: "same-origin",
      signal,
      headers: {
        ...(data ? { "Content-Type": "application/json" } : {}),
        ...(key ? { "Idempotency-Key": key } : {}),
        ...headers,
      },
      body: data ? JSON.stringify(data) : body,
    });
    result = await response.json();
  } catch (e) {
    if (e.name === "AbortError") throw e;
    throw new Error("服务暂时不可用，请稍后重试");
  }
  if (!response.ok) {
    const e = new Error(result.error || "操作未完成");
    Object.assign(e, {
      status: response.status,
      code: result.code,
      fieldErrors: result.fieldErrors,
    });
    throw e;
  }
  return result;
}
export function retryableCommand() {
  let saved = null;
  return (data) => {
    const content = JSON.stringify(data);
    if (saved?.content !== content)
      saved = { content, key: crypto.randomUUID() };
    return saved.key;
  };
}
