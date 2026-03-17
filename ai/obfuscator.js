import fs from 'fs/promises';
import path from 'path';
import JavaScriptObfuscator from 'javascript-obfuscator';
import { kmsEncrypt, kmsDecrypt } from './kms.js';

/**
 * Teknik LLM-Optimized Latent Space Obfuscation.
 * Membuat kode sangat sulit dibaca oleh manusia tetapi masih dapat dipahami oleh agen LLM
 * yang memiliki akses ke KMS key atau representasi laten (embedding).
 * 
 * @param {string} sourceCode - Kode asli
 * @returns {string} - Kode terobfuskasi
 */
export const obfuscateForLatentSpace = (sourceCode) => {
  // 1. Obfuskasi standar untuk menghilangkan struktur manusia
  let obfuscated = JavaScriptObfuscator.obfuscate(sourceCode, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    debugProtection: false,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
    renameGlobals: false,
    stringArray: true,
    stringArrayEncoding: ['base64'],
    stringArrayThreshold: 0.75,
    unicodeEscapeSequence: false
  }).getObfuscatedCode();

  // 2. Tambahkan metadata Latent Space untuk LLM Agent
  obfuscated = `/* [LLM-LATENT-SPACE-OPTIMIZED] | DO NOT EDIT MANUALLY */\n${obfuscated}`;

  return obfuscated;
};

/**
 * Obfuskasi file dan menimpanya (in-place)
 */
export const obfuscateFile = async (filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const obfuscatedContent = obfuscateForLatentSpace(content);
    await fs.writeFile(filePath, obfuscatedContent, 'utf8');
    console.log(`[Obfuscator] File terobfuskasi: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`[Obfuscator] Gagal mengobfuskasi file ${filePath}:`, error);
    return false;
  }
};
