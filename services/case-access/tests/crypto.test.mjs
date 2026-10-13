import test from 'node:test';
import assert from 'node:assert/strict';
import {randomPassword,encryptPassword,decryptPassword,passwordMac} from '../crypto.mjs';
const secret='a'.repeat(43);
test('generated credentials follow all required character constraints',()=>{const all=new Set();for(let i=0;i<1000;i++){const p=randomPassword();assert.match(p,/^[A-Za-z0-9]{12}$/);assert.match(p,/[A-Z]/);assert.match(p,/[a-z]/);assert.match(p,/[0-9]/);all.add(p);}assert.equal(all.size,1000);});
test('vault is bound to username and encryption uses fresh IVs',async()=>{const p=randomPassword(),a=await encryptPassword(secret,'rminte-a',p),b=await encryptPassword(secret,'rminte-a',p);assert.notEqual(a,b);assert.equal(await decryptPassword(secret,'rminte-a',a),p);await assert.rejects(()=>decryptPassword(secret,'rminte-b',a));await assert.rejects(()=>decryptPassword('b'.repeat(43),'rminte-a',a));});
test('password verification is bound to user and secret',async()=>{assert.notEqual(await passwordMac(secret,'rminte-a','Password12xx'),await passwordMac(secret,'rminte-b','Password12xx'));assert.notEqual(await passwordMac(secret,'rminte-a','Password12xx'),await passwordMac('b'.repeat(43),'rminte-a','Password12xx'));});
test('admin password salts, verification and legacy compatibility',async()=>{
 const {hashAdminPassword,verifyPassword}=await import('../crypto.mjs');
 const a=await hashAdminPassword(secret,'admin','new-admin-password-123'),b=await hashAdminPassword(secret,'admin','new-admin-password-123');
 assert.notEqual(a,b);assert.ok(await verifyPassword(secret,'admin','new-admin-password-123',a));
 assert.equal(await verifyPassword(secret,'admin','wrong-password',a),false);
 assert.equal(await verifyPassword(secret,'other','new-admin-password-123',a),false);
 assert.ok(await verifyPassword(secret,'admin','Generated123',await passwordMac(secret,'admin','Generated123')));
});
