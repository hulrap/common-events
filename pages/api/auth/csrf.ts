import type { NextApiRequest, NextApiResponse } from 'next';
import { generateToken, signToken } from '@/lib/csrf';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const token = generateToken();
    const signedToken = signToken(token);

    // Set the cookie
    // HttpOnly: Not accessible via JS (good for security)
    // Secure: Only sent over HTTPS (in prod)
    // SameSite: Strict (prevents sending with cross-site requests)
    const isProd = process.env.NODE_ENV === 'production';

    res.setHeader(
        'Set-Cookie',
        `csrf-token=${signedToken}; Path=/; HttpOnly; SameSite=Lax; ${isProd ? 'Secure;' : ''}`
    );

    // Return the raw token to the client so it can be sent in the header
    res.status(200).json({ csrfToken: token });
}
