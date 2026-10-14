import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const base = 'http://127.0.0.1:8788';
const credentials = await readFile(new URL('../.local/admin-login.txt', import.meta.url), 'utf8');
const username = credentials.match(/用户名：(.*)/)[1], password = credentials.match(/密码：(.*)/)[1];
const route = '/api/resources/industrial-modeling/demo';
async function call(path, cookie = '', method = 'GET', data) {
  return fetch(base + path, {method, headers: {Origin: base, Cookie: cookie, ...(data ? {'Content-Type': 'application/json'} : {})}, body: data ? JSON.stringify(data) : undefined});
}
const assetPaths = ['/index.html?embed=1', '/app.js', '/viewer.js', '/embed.js', '/style.css', '/drawing-mosaic.svg', '/vendor/three.module.js', '/vendor/three.core.min.js', '/vendor/OrbitControls.js'];
for (const path of ['', ...assetPaths]) assert.equal((await call(route + path)).status, 401, `anonymous ${path}`);
const login = await call('/api/login', '', 'POST', {username, password});
assert.equal(login.status, 200);
const admin = login.headers.get('set-cookie').split(';')[0];
const created = await call('/api/admin/users', admin, 'POST', {});
assert.equal(created.status, 201);
const user = await created.json();
try {
  const signed = await call('/api/login', '', 'POST', user);
  assert.equal(signed.status, 200);
  const cookie = signed.headers.get('set-cookie').split(';')[0];
  assert.equal((await call(route + '/app.js', cookie)).status, 403);
  assert.equal((await call('/api/admin/users/' + user.id, admin, 'PATCH', {can_demo: true, can_download: false})).status, 200);
  assert.equal((await call(route, cookie, 'HEAD')).status, 200);
  for (const path of assetPaths) {
    const result = await call(route + path, cookie);
    assert.equal(result.status, 200, path);
    assert.match(result.headers.get('cache-control'), /no-store/);
    assert.equal(result.headers.get('x-frame-options'), 'SAMEORIGIN');
    const body = await result.text();
    if (path.startsWith('/index')) {
      assert.match(body, /预设演示剧情/);
      assert.match(body, /\.\/app.js/);
    }
    if (path.endsWith('.js')) assert.match(result.headers.get('content-type'), /javascript/);
  }
  assert.equal((await call(route + '/missing.js', cookie)).status, 404);
  assert.equal((await call('/api/resources/industrial-modeling/download', cookie)).status, 403);
  assert.equal((await call('/industrial-modeling/index.html', cookie)).status, 404, 'not a public site asset');
  await call('/api/admin/users/' + user.id, admin, 'PATCH', {can_demo: false, can_download: false});
  for (const path of assetPaths) assert.equal((await call(route + path, cookie)).status, 403, `revoked ${path}`);
  console.log('PASS: anonymous/denied/revoked assets blocked; authorised HTML, modules, drawing and HEAD work; missing assets and independent download permissions preserved.');
} finally {
  await call('/api/admin/users/' + user.id, admin, 'DELETE');
  await call('/api/logout', admin, 'POST');
}
