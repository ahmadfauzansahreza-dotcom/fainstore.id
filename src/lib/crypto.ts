import crypto from "crypto";

/**
 * Enkripsi/dekripsi kredensial akun game (username/email, password, recovery data)
 * sebelum disimpan ke kolom *_Enc di model GameAccount.
 *
 * Wajib set ACCOUNT_CREDENTIALS_ENCRYPTION_KEY (32 byte, base64) di environment.
 * Generate contoh key baru dengan: openssl rand -base64 32
 */

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const raw = process.env.ACCOUNT_CREDENTIALS_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("ACCOUNT_CREDENTIALS_ENCRYPTION_KEY belum diset di environment variables.");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("ACCOUNT_CREDENTIALS_ENCRYPTION_KEY harus berupa 32 byte (base64).");
  }
  return key;
}

export function encryptCredential(plainText: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Format: iv.authTag.ciphertext, semuanya base64.
  return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(".");
}

export function decryptCredential(encoded: string): string {
  const key = getKey();
  const [ivB64, authTagB64, cipherTextB64] = encoded.split(".");
  if (!ivB64 || !authTagB64 || !cipherTextB64) {
    throw new Error("Format kredensial terenkripsi tidak valid.");
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(authTagB64, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(cipherTextB64, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
