import admin from 'firebase-admin';

// Initialize Firebase Admin (Singleton)
if (admin.apps.length === 0) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin initialized with service account certificate.');
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT JSON. Falling back to default project init.');
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'typinghero-dummy',
      });
    }
  } else {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'typinghero-dummy',
    });
    console.log('Firebase Admin initialized with projectId:', process.env.FIREBASE_PROJECT_ID || 'typinghero-dummy');
  }
}

export type DecodedFirebaseUser = {
  uid: string;
  email: string;
  name: string;
  picture?: string;
};

/**
 * Verifies a client-provided Firebase ID Token.
 * If Firebase Admin is not authenticated or fails, it falls back to decoding the token directly
 * during local development, ensuring developers can test without production credentials.
 */
export async function verifyFirebaseToken(idToken: string): Promise<DecodedFirebaseUser> {
  if (!idToken) {
    throw new Error('Token is required');
  }

  try {
    // 1. Attempt official Firebase ID Token validation
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      name: decodedToken.name || (decodedToken.email ? decodedToken.email.split('@')[0] : 'Social Hero'),
      picture: decodedToken.picture,
    };
  } catch (err: any) {
    // 2. Dev/Mock fallback validation if credentials are not configured
    const hasServiceAccount = !!process.env.FIREBASE_SERVICE_ACCOUNT;
    const isProd = process.env.NODE_ENV === 'production';

    if (!hasServiceAccount && !isProd) {
      console.warn('Firebase Admin verification failed or is unconfigured. Falling back to decoding JWT payload for development...');
      
      const payload = decodeJwtPayload(idToken);
      if (payload) {
        return {
          uid: payload.uid || payload.user_id || 'mock-uid-' + Math.random().toString(36).substring(7),
          email: payload.email || 'mock-user@example.com',
          name: payload.name || (payload.email ? payload.email.split('@')[0] : 'Mock Hero'),
          picture: payload.picture,
        };
      }
    }
    
    // In production, or if decoding fails, propagate the verification error
    console.error('Firebase token verification error:', err);
    throw new Error(`Token verification failed: ${err.message}`);
  }
}

function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const decoded = Buffer.from(parts[1], 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
