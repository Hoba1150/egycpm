import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits auth tag

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET_KEY || "cpm_secure_32_byte_aes_key_cpm_2026!";
  return crypto.createHash("sha256").update(String(secret)).digest();
}

/**
 * Encrypt sensitive plaintext (like game account passwords) with AES-256-GCM
 */
export function encryptData(text: string | null | undefined): string | null {
  if (!text) return null;
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    const authTag = cipher.getAuthTag().toString("hex");
    
    // Format: iv:authTag:encrypted
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Encryption process encountered an error.");
  }
}

/**
 * Decrypt ciphertext with AES-256-GCM
 */
export function decryptData(ciphertext: string | null | undefined): string | null {
  if (!ciphertext) return null;
  try {
    const parts = ciphertext.split(":");
    if (parts.length !== 3) {
      // Legacy or plain fallback if not formatted
      return ciphertext;
    }

    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    return "[Encrypted - Decryption Failed / Key Changed]";
  }
}
