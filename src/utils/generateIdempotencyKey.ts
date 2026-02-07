/**
 * Generates a unique idempotency key for order creation.
 * Uses the Web Crypto API's randomUUID() which is standard in modern browsers.
 */
export const generateIdempotencyKey = (): string => {
    return crypto.randomUUID();
};
