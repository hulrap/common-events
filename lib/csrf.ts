import { createHash, randomBytes } from 'crypto';

// Secret key for signing cookies - in production this should be an env var
// For now we'll use a fallback if not present, but log a warning
const CSRF_SECRET = process.env.CSRF_SECRET || 'fallback-secret-key-change-me-in-prod';

if (process.env.NODE_ENV === 'production' && !process.env.CSRF_SECRET) {
    console.warn('WARNING: CSRF_SECRET is not set in production environment!');
}

export function generateToken(): string {
    return randomBytes(32).toString('hex');
}

export function signToken(token: string): string {
    const hash = createHash('sha256')
        .update(`${token}${CSRF_SECRET}`)
        .digest('hex');
    return `${token}.${hash}`;
}

export function verifyToken(signedToken: string): string | null {
    if (!signedToken || !signedToken.includes('.')) {
        return null;
    }

    const [token, hash] = signedToken.split('.');
    const expectedHash = createHash('sha256')
        .update(`${token}${CSRF_SECRET}`)
        .digest('hex');

    if (hash === expectedHash) {
        return token;
    }

    return null;
}
