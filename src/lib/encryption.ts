import CryptoJS from "crypto-js";

export const encryptData = (data: string): string => {
    try {
        const key = import.meta.env.VITE_ENCRYPTION_KEY;
        if (!key) {
            throw new Error("Encryption key not found in environment variables");
        }
        return CryptoJS.AES.encrypt(data, key).toString();
    } catch (error) {
        console.error("Encryption error:", error);
        throw new Error("Failed to encrypt data");
    }
};

export const decryptData = (encryptedData: string): string => {
    try {
        const key = import.meta.env.VITE_ENCRYPTION_KEY;
        if (!key) {
            throw new Error("Encryption key not found in environment variables");
        }
        const bytes = CryptoJS.AES.decrypt(encryptedData, key);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error("Decryption error:", error);
        throw new Error("Failed to decrypt data");
    }
};
