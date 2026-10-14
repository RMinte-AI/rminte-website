// Private service only: no workers.dev, preview URL or public route.
export default {
  async fetch(request, env) {
    if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', {status: 405});
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/industrial-modeling/')) return new Response('Not found', {status: 404});
    if (url.pathname === '/industrial-modeling/') url.pathname += 'index.html';
    const response = await env.DEMO_ASSETS.fetch(new Request(url, {method: request.method}));
    const headers = new Headers(response.headers);
    headers.set('X-Frame-Options', 'SAMEORIGIN');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Cache-Control', 'private, no-store');
    return new Response(response.body, {status: response.status, headers});
  }
};
