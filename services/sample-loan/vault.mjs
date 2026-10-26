import { hex } from "../case-access/crypto.mjs";
const enc = new TextEncoder();
async function key(secret) {
  if (!secret || secret.length < 43)
    throw new Error("SAMPLE_SECRET is required");
  const material = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    "HKDF",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: enc.encode("rminte-sample-loan-v1"),
      info: enc.encode("agreement-snapshots"),
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
const unhex = (s) =>
  Uint8Array.from(s.match(/../g) || [], (v) => parseInt(v, 16));
export async function seal(secret, context, value) {
  const iv = crypto.getRandomValues(new Uint8Array(12)),
    k = await key(secret);
  return (
    hex(iv) +
    "." +
    hex(
      await crypto.subtle.encrypt(
        { name: "AES-GCM", iv, additionalData: enc.encode(context) },
        k,
        enc.encode(JSON.stringify(value)),
      ),
    )
  );
}
export async function open(secret, context, value) {
  if (!value) return null;
  const [iv, cipher] = value.split("."),
    k = await key(secret);
  return JSON.parse(
    new TextDecoder().decode(
      await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: unhex(iv), additionalData: enc.encode(context) },
        k,
        unhex(cipher),
      ),
    ),
  );
}
