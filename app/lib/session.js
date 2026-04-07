import { SignJWT, jwtVerify, EncryptJWT, jwtDecrypt } from 'jose';
import { cookies } from 'next/headers';

// Session cookie name
const SESSION_COOKIE = 'bb_session';

// Secret key untuk enkripsi — harus 32 bytes untuk AES-256
// Di production, gunakan env var: process.env.SESSION_SECRET
function getSecretKey() {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
        // Fallback untuk development (deterministik, 32 chars)
        const fallback = 'branch-tracker-dev-secret-32byte';
        return new TextEncoder().encode(fallback);
    }
    // Pastikan minimal 32 bytes
    const raw = secret.padEnd(32, '0').slice(0, 32);
    return new TextEncoder().encode(raw);
}

/**
 * Simpan credentials ke server-side HttpOnly encrypted cookie.
 * Dipanggil dari server action atau route handler saat save.
 */
export async function saveSession(credentials) {
    const secretKey = getSecretKey();

    // JWE: JSON Web Encryption (AES-256-GCM) — isi tidak bisa dibaca browser
    const token = await new EncryptJWT(credentials)
        .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
        .setIssuedAt()
        .setExpirationTime('12h')
        .encrypt(secretKey);

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
        httpOnly: true, // Tidak bisa dibaca oleh JavaScript browser
        secure: process.env.NODE_ENV === 'production', // HTTPS only di production
        sameSite: 'strict', // CSRF protection
        maxAge: 60 * 60 * 12, // 12 jam  
        path: '/',
    });

    return { success: true };
}

/**
 * Baca dan decrypt credentials dari HttpOnly cookie.
 * Dipanggil dari API route handler di server.
 */
export async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) return null;

    try {
        const secretKey = getSecretKey();
        const { payload } = await jwtDecrypt(token, secretKey);
        return payload;
    } catch (err) {
        console.error('[Session] Failed to decrypt session cookie:', err?.message);
        return null;
    }
}

/**
 * Hapus session cookie (logout).
 */
export async function clearSession() {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
    return { success: true };
}
