import * as CryptoJS from 'crypto-js';

// Pega a chave mestra do .env
const SECRET_KEY = process.env.ENCRYPTION_SECRET;

if (!SECRET_KEY) {
  throw new Error('❌ ENCRYPTION_SECRET is required. Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
}

if (SECRET_KEY.length < 32) {
  throw new Error('❌ ENCRYPTION_SECRET must be at least 32 characters long for security');
}

export const encryptionService = {

  /**
   * Criptografa um texto (ex: "sk-123...")
   */
  encrypt: (text: string): string => {
    if (!text) {
      return text; // Não faça nada se for nulo ou vazio
    }
    try {
      return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
    } catch (error) {
      console.error("Erro ao criptografar:", error);
      return text; // Retorna o texto original em caso de falha
    }
  },

  /**
   * Descriptografa um "rabisco" (ex: "U2FsdGVkX1...")
   */
  decrypt: (ciphertext: string): string => {
    if (!ciphertext) {
      return ciphertext; // Não faça nada se for nulo ou vazio
    }
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
      const originalText = bytes.toString(CryptoJS.enc.Utf8);
      return originalText;
    } catch (error) {
      console.error("Erro ao descriptografar:", error);
      return ""; // Retorna vazio se a descriptografia falhar
    }
  },

  /**
   * Retorna um placeholder (ex: "sk-...q456") para enviar ao frontend.
   * NUNCA envie a chave descriptografada!
   */
  getPlaceholder: (key: string): string => {
    if (!key) {
      return ""; // Vazio
    }
    if (key.length < 8) {
      return "...(salva)"; // Muito curta
    }
    // Retorna os 4 primeiros e os 4 últimos caracteres
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  }
};
