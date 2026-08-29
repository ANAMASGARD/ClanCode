import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const IV_BYTES = 12;
const KEY_BYTES = 32;

function loadDeliveryKey(): Buffer {
  const raw = process.env.PAIRING_DELIVERY_KEY;
  if (raw === undefined || raw.length === 0) {
    throw new Error(
      "PAIRING_DELIVERY_KEY is not set. Generate a 32-byte base64url secret for pairing token delivery.",
    );
  }
  const key = Buffer.from(raw, "base64url");
  if (key.length !== KEY_BYTES) {
    throw new Error(
      `PAIRING_DELIVERY_KEY must decode to ${String(KEY_BYTES)} bytes (base64url).`,
    );
  }
  return key;
}

export type EncryptedDelivery = {
  iv: string;
  ciphertext: string;
  authTag: string;
};

export function encryptDeviceToken(plaintext: string): EncryptedDelivery {
  const key = loadDeliveryKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return {
    iv: iv.toString("base64url"),
    ciphertext: ciphertext.toString("base64url"),
    authTag: authTag.toString("base64url"),
  };
}

export function decryptDeviceToken(delivery: EncryptedDelivery): string {
  const key = loadDeliveryKey();
  const iv = Buffer.from(delivery.iv, "base64url");
  const ciphertext = Buffer.from(delivery.ciphertext, "base64url");
  const authTag = Buffer.from(delivery.authTag, "base64url");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}

export function generateDeliveryKey(): string {
  return randomBytes(KEY_BYTES).toString("base64url");
}
