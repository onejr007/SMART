import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

/**
 * Membuat hash dari kode untuk verifikasi.
 */
const hashSource = (content) => {
  return crypto.createHash('sha256').update(content).digest('hex');
};

/**
 * Mekanisme Self-Evolving untuk memodifikasi kode framework sendiri.
 * Ditambahkan sistem Sandbox Execution (Security Recommendation #1).
 * 
 * @param {string} relativeFilePath - Jalur file yang akan dimodifikasi
 * @param {string} instruction - Instruksi evolusi/perubahan
 * @returns {object} { success, newHash }
 */
export const evolveCode = async (relativeFilePath, instruction) => {
  try {
    const targetPath = path.resolve(PROJECT_ROOT, relativeFilePath);
    
    // Keamanan: pastikan file berada di dalam project root
    if (!targetPath.startsWith(PROJECT_ROOT)) {
      throw new Error('Evolusi kode tidak diizinkan di luar direktori proyek');
    }

    // SIMULASI SANDBOX: Sebelum menerapkan perubahan, kita bisa memvalidasi 
    // apakah instruksi mengandung pola berbahaya (XSS, RCE, dll)
    const dangerousPatterns = [/process\./, /require\(/, /import\(/, /eval\(/, /Function\(/];
    if (dangerousPatterns.some(pattern => pattern.test(instruction))) {
        console.error(`[Sandbox] Dangerous pattern detected in evolution instruction: ${instruction}`);
        return { success: false, error: 'Security violation: Dangerous code pattern detected' };
    }

    let currentCode = '';
    try {
      currentCode = await fs.readFile(targetPath, 'utf8');
      console.log(`[Self-Evolving] Membaca file ${relativeFilePath}`);
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.log(`[Self-Evolving] File ${relativeFilePath} tidak ada, akan dibuat.`);
      } else {
        throw err;
      }
    }

    // SIMULASI PROSES AGEN LLM (Kode yang Menulis Kode)
    // Dalam implementasi penuh, Anda akan memanggil OpenAI/Anthropic/LLM lokal
    // dengan `currentCode` dan `instruction` untuk mendapatkan `newCode`.
    console.log(`[Self-Evolving] Menjalankan instruksi: "${instruction}"`);
    
    // MOCK: Proses evolusi (Untuk saat ini, kita tambahkan komentar otomatis jika diminta)
    let evolvedCode = currentCode;
    
    if (instruction.includes('add logging')) {
      evolvedCode = currentCode.replace(
        /function\s+(\w+)\s*\((.*?)\)\s*\{/g,
        'function $1($2) {\n  console.log(`[Evolved-Log] Executing $1 with args:`, arguments);'
      );
    } else if (instruction.includes('obfuscate')) {
      // Diserahkan ke fungsi obfuskasi terpisah
      evolvedCode = `// OBFUSCATED via LLM Latent Space\n${currentCode}`;
    } else {
      // Modifikasi default: menambahkan cap waktu evolusi
      evolvedCode = `/* Self-Evolved at ${new Date().toISOString()} | Instruction: ${instruction} */\n${currentCode}`;
    }

    // SAFE EVOLVING: Buat backup file asli sebelum ditimpa
    const backupPath = `${targetPath}.bak`;
    if (currentCode) {
      await fs.writeFile(backupPath, currentCode, 'utf8');
      console.log(`[Self-Evolving] Backup dibuat di ${backupPath}`);
    }

    // Tulis balik ke sistem file
    await fs.writeFile(targetPath, evolvedCode, 'utf8');
    
    const newHash = hashSource(evolvedCode);
    console.log(`[Self-Evolving] Berhasil memodifikasi ${relativeFilePath} (Hash: ${newHash})`);
    
    return {
      success: true,
      newHash
    };

  } catch (error) {
    console.error(`[Self-Evolving] Gagal mengevolusi file ${relativeFilePath}:`, error);
    return {
      success: false,
      newHash: null
    };
  }
};
