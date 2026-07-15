import crypto from 'crypto';

export type UserDocument = {
  _id?: string;
  username: string;
  passwordHash: string;
  avatarId: string;
  createdAt: Date;
};

const JWT_SECRET = process.env.JWT_SECRET || 'typinghero-legendary-secret-key-2026';

// ─── Password Hashing via Native PBKDF2 ─────────────────────────────────────
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;
    const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  } catch {
    return false;
  }
}

// ─── Native JWT Implementation (HS256) ──────────────────────────────────────
function base64UrlEncode(str: string | Buffer): string {
  const base64 = Buffer.isBuffer(str) ? str.toString('base64') : Buffer.from(str).toString('base64');
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

export function signToken(payload: any): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  
  const hmac = crypto.createHmac('sha256', JWT_SECRET);
  hmac.update(`${encodedHeader}.${encodedPayload}`);
  const signature = base64UrlEncode(hmac.digest());
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyToken(token: string): any {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    if (!encodedHeader || !encodedPayload || !signature) return null;
    
    const hmac = crypto.createHmac('sha256', JWT_SECRET);
    hmac.update(`${encodedHeader}.${encodedPayload}`);
    const expectedSignature = base64UrlEncode(hmac.digest());
    
    if (signature !== expectedSignature) return null;
    
    return JSON.parse(base64UrlDecode(encodedPayload));
  } catch {
    return null;
  }
}
