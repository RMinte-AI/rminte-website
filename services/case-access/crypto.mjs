const enc = new TextEncoder();
export const hex = bytes => Array.from(new Uint8Array(bytes), x => x.toString(16).padStart(2,'0')).join('');
const bytes = value => Uint8Array.from(value.match(/../g) || [], x => parseInt(x,16));
export async function digest(value) { return hex(await crypto.subtle.digest('SHA-256', enc.encode(value))); }
async function key(secret, purpose, algorithm, usages) {
 if (!secret || secret.length < 43) throw new Error('CASE_SECRET must contain at least 32 random bytes encoded as base64');
 const material = await crypto.subtle.importKey('raw',enc.encode(secret),'HKDF',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:enc.encode('rminte-case-access-v1'),info:enc.encode(purpose)},material,algorithm,false,usages);
}
export async function passwordMac(secret, username, password) {
 const k=await key(secret,'password-verification',{name:'HMAC',hash:'SHA-256',length:256},['sign']);
 return hex(await crypto.subtle.sign('HMAC',k,enc.encode(`${username}\0${password}`)));
}
export function equal(a,b) { if(a.length!==b.length)return false; let x=0;for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);return x===0; }
export async function encryptPassword(secret, username, password) {
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const k=await key(secret,'password-vault',{name:'AES-GCM',length:256},['encrypt']);
 return `${hex(iv)}.${hex(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:enc.encode(username)},k,enc.encode(password)))}`;
}
export async function decryptPassword(secret, username, cipher) {
 const [iv,data]=cipher.split('.');const k=await key(secret,'password-vault',{name:'AES-GCM',length:256},['decrypt']);
 return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(iv),additionalData:enc.encode(username)},k,bytes(data)));
}
export function randomString(length, alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
 let result=''; const limit=256-256%alphabet.length;
 while(result.length<length){for(const n of crypto.getRandomValues(new Uint8Array(length))){if(n<limit)result+=alphabet[n%alphabet.length];if(result.length===length)break;}}
 return result;
}
export function randomPassword(){let p;do{p=randomString(12)}while(!/[A-Z]/.test(p)||!/[a-z]/.test(p)||!/[0-9]/.test(p));return p;}

// Human-chosen admin passwords use a salted, work-factor hash with a server-side pepper.
export async function hashAdminPassword(secret, username, password, salt=hex(crypto.getRandomValues(new Uint8Array(16)))) {
 const peppered=await passwordMac(secret,username,password);
 const material=await crypto.subtle.importKey('raw',bytes(peppered),'PBKDF2',false,['deriveBits']);
 const hash=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:bytes(salt),iterations:100000},material,256);
 return `pbkdf2-sha256$100000$${salt}$${hex(hash)}`;
}
export async function verifyPassword(secret, username, password, stored) {
 if(stored.startsWith('pbkdf2-sha256$')) {
  if(!/^pbkdf2-sha256\$100000\$[a-f0-9]{32}\$[a-f0-9]{64}$/.test(stored))return false;
  return equal(await hashAdminPassword(secret,username,password,stored.split('$')[2]),stored);
 }
 return equal(await passwordMac(secret,username,password),stored);
}
