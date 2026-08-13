import { encrypt, decrypt, deriveKey, generateSalt } from '@/lib/encryption';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Clé maîtresse pour le chiffrement (à stocker dans variable d'environnement)
 * En production, utiliser un HSM ou Vault. Ici, dérivation depuis MASTER_ENCRYPTION_KEY + user salt.
 */
const MASTER_KEY = process.env.MASTER_ENCRYPTION_KEY || 'dev-master-key-change-in-production';

/**
 * Récupère ou crée la clé de chiffrement utilisateur
 */
export async function getUserEncryptionKey(userId: string): Promise<Uint8Array<ArrayBuffer>> {
  // Récupérer le salt et hash stockés
  const record = await prisma.userEncryptionKey.findUnique({
    where: { userId }
  });

  if (!record) {
    // Première fois : générer salt, dériver clé et stocker
    const salt = generateSalt();
    const key = await deriveKey(MASTER_KEY, salt);
    
    await prisma.userEncryptionKey.create({
      data: {
        userId,
        keyHash: Buffer.from(key).toString('base64'), // Stockage du hash de la clé (pour vérification)
        salt,
      }
    });
    
    return key;
  }

  // Clé existante : re-dériver depuis master key + salt stocké
  const key = await deriveKey(MASTER_KEY, record.salt);
  return key;
}

/**
 * Chiffre une clé API avant sauvegarde
 */
export async function encryptApiKey(apiKey: string, userId: string): Promise<string> {
  const key = await getUserEncryptionKey(userId);
  return encrypt(apiKey, key);
}

/**
 * Déchiffre une clé API pour utilisation
 */
export async function decryptApiKey(encryptedApiKey: string, userId: string): Promise<string> {
  const key = await getUserEncryptionKey(userId);
  return decrypt(encryptedApiKey, key);
}

/**
 * Chiffre tout l'objet AiSettings (provider + apiKey + modelsConfig)
 */
export interface EncryptedAiSettings {
  provider: string;
  encryptedApiKey: string;
  modelsConfig?: string; // JSON stringifié
}

export async function encryptAiSettings(
  provider: string,
  apiKey: string,
  modelsConfig: Record<string, unknown> | undefined,
  userId: string
): Promise<EncryptedAiSettings> {
  return {
    provider,
    encryptedApiKey: await encryptApiKey(apiKey, userId),
    modelsConfig: modelsConfig ? JSON.stringify(modelsConfig) : undefined,
  };
}

/**
 * Déchiffre les settings IA pour utilisation par l'agent
 */
export interface DecryptedAiSettings {
  provider: string;
  apiKey: string;
  modelsConfig?: Record<string, unknown>;
}

export async function decryptAiSettings(
  encryptedSettings: { provider?: string | null; apiKey?: string | null; encryptedApiKey?: string | null; modelsConfig?: any } | null,
  userId: string
): Promise<DecryptedAiSettings> {
  // Fallback to system defaults if user hasn't configured BYOK
  if (!encryptedSettings) {
    return {
      provider: 'openai',
      apiKey: process.env.AI_API_KEY || (process.env.OPENAI_API_KEY !== 'TA_CLE_ICI' ? process.env.OPENAI_API_KEY : undefined) || '',
      modelsConfig: undefined,
    };
  }

  const rawKey = encryptedSettings.encryptedApiKey || encryptedSettings.apiKey || '';
  const provider = encryptedSettings.provider || 'openai';
  let modelsConfigObj: Record<string, unknown> | undefined = undefined;
  
  if (encryptedSettings.modelsConfig) {
    if (typeof encryptedSettings.modelsConfig === 'string') {
      try {
        modelsConfigObj = JSON.parse(encryptedSettings.modelsConfig);
      } catch {
        modelsConfigObj = undefined;
      }
    } else if (typeof encryptedSettings.modelsConfig === 'object') {
      modelsConfigObj = encryptedSettings.modelsConfig as Record<string, unknown>;
    }
  }

  return {
    provider,
    apiKey: rawKey ? await decryptApiKey(rawKey, userId) : '',
    modelsConfig: modelsConfigObj,
  };
}