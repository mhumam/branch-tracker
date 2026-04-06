'use client';

// Simple encryption helper using Base64 with a salt
// Note: This is for obfuscation to prevent "plain sight" in browser tools.
// For production grade security, a backend session is required.

const SALT = 'br-tracker-v3-secure-salt';

export const encrypt = (text) => {
    if (!text) return null;
    try {
        const saltedText = SALT + text;
        const encoded = btoa(unescape(encodeURIComponent(saltedText)));
        return encoded;
    } catch (e) {
        console.error('Encryption failed', e);
        return null;
    }
};

export const decrypt = (encoded) => {
    if (!encoded) return null;
    try {
        const decoded = decodeURIComponent(escape(atob(encoded)));
        if (decoded.startsWith(SALT)) {
            return decoded.substring(SALT.length);
        }
        return null;
    } catch (e) {
        console.error('Decryption failed', e);
        return null;
    }
};

export const encryptJSON = (data) => {
    if (!data) return null;
    return encrypt(JSON.stringify(data));
};

export const decryptJSON = (encoded) => {
    if (!encoded) return null;
    const decrypted = decrypt(encoded);
    if (!decrypted) return null;
    try {
        return JSON.parse(decrypted);
    } catch (e) {
        console.error('JSON Decryption failed', e);
        return null;
    }
};
