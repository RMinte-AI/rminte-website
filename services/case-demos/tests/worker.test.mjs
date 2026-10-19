import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker.mjs';

test('shared resource service serves different case public directories without CAD-specific branches',async()=>{
  for(const id of ['industrial-modeling','digital-toll']) {
    const paths=[];
    const env={DEMO_ASSETS:{fetch:async request=>{paths.push(new URL(request.url).pathname);return new Response('fixture');}}};
    const response=await worker.fetch(new Request(`https://private.invalid/${id}/public/`),env);
    assert.equal(response.status,200);
    assert.deepEqual(paths,[`/${id}/public/index.html`]);
    assert.equal(response.headers.get('x-frame-options'),'SAMEORIGIN');
    assert.equal(response.headers.get('cache-control'),'private, no-store');
  }
});

test('documentation and private service files cannot be fetched through the shared Worker',async()=>{
  const env={DEMO_ASSETS:{fetch:async()=>{throw new Error('must not reach assets');}}};
  for(const path of ['/industrial-modeling/README.md','/worker.mjs','/industrial-modeling/tests/integration.mjs']) {
    assert.equal((await worker.fetch(new Request('https://private.invalid'+path),env)).status,404);
  }
  assert.equal((await worker.fetch(new Request('https://private.invalid/industrial-modeling/public/',{method:'POST'}),env)).status,405);
});
