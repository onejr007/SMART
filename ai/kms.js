import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Dalam skenario nyata, ini akan menggunakan AWS KMS, Google Cloud KMS, atau HashiCorp Vault.
// Untuk keperluan demonstrasi, kita menggunakan enkripsi AES-256-GCM lokal dengan master key dari environment.

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;

// Dapatkan atau buat master key
const getMasterKey = () => {
  let key = process.env.KMS_MASTER_KEY;
  if (!key) {
    console.warn('[KMS] Warning: KMS_MASTER_KEY tidak ditemukan di .env. Menggunakan kunci fallback.');
    key = 'fallback-master-key-32-chars-long!'; // Harus 32 byte untuk aes-256
  }
  
  // Pastikan kunci 32 byte
  if (key.length < 32) {
    key = key.padEnd(32, '0');
  } else if (key.length > 32) {
    key = key.substring(0, 32);
  }
  
  return key;
};

/**
 * Mengenkripsi teks (seperti API Keys, Tokens, Payload) menggunakan KMS.
 * @param {string} text - Teks yang akan dienkripsi
 * @returns {string} - String heksadesimal yang berisi salt, iv, tag, dan ciphertext
 */
export const kmsEncrypt = (text) => {
  try {
    if (!text) return text;
    
    const masterKey = getMasterKey();
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const key = crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha256');
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    
    // Gabungkan semuanya menjadi satu string hex
    return Buffer.concat([salt, iv, tag, encrypted]).toString('hex');
  } catch (error) {
    console.error('[KMS] Encryption error:', error);
    throw new Error('Gagal mengenkripsi data via KMS');
  }
};

/**
 * Mendekripsi data yang telah dienkripsi oleh KMS.
 * @param {string} encryptedTextHex - Teks terenkripsi (hex string)
 * @returns {string} - Teks asli
 */
export const kmsDecrypt = (encryptedTextHex) => {
  try {
    if (!encryptedTextHex) return encryptedTextHex;
    
    const masterKey = getMasterKey();
    const buffer = Buffer.from(encryptedTextHex, 'hex');
    
    const salt = buffer.subarray(0, SALT_LENGTH);
    const iv = buffer.subarray(SALT_LENGTH, TAG_POSITION);
    const tag = buffer.subarray(TAG_POSITION, TAG_POSITION + TAG_LENGTH);
    const encrypted = buffer.subarray(TAG_POSITION + TAG_LENGTH);
    
    const key = crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha256');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    return decipher.update(encrypted) + decipher.final('utf8');
  } catch (error) {
    console.error('[KMS] Decryption error:', error);
    throw new Error('Gagal mendekripsi data via KMS');
  }
};
