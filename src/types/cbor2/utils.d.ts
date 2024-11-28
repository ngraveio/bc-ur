/**
 * These are all internal utility functions for cbor2.  They are only exported
 * so that the web playground can use them.
 *
 * NO API backward compatibility is promised for these functions.  They are
 * not a part of the public interface, and changes here will not affect the
 * semver status of a changeset.  Use at your own risk.
 * @module
 */
/**
 * Convert hex string to Uint8Array.
 *
 * @param str Hex string.
 * @returns Array with contents decoded as hex from str.
 */
declare function hexToU8(str: string): Uint8Array;
/**
 * Convert a Uint8Array to a hex string.
 *
 * @param u8 Array to convert.
 * @returns Hex string.
 */
declare function u8toHex(u8: Uint8Array): string;
/**
 * Concatenate multiple Uint8Arrays into a single buffer.
 *
 * @param u8s Zero or more arrays to concatenate.
 * @returns Combined array.
 */
declare function u8concat(u8s: Uint8Array[]): Uint8Array;
/**
 * Convert from Base64 to bytes in an unexciting way.
 * From https://developer.mozilla.org/en-US/docs/Glossary/Base64
 * which goes through an intermediate string form.  Bleh.
 *
 * @param base64 Base64-encoded string.
 * @returns String decoded into bytes.
 */
declare function base64ToBytes(base64: string): Uint8Array;
/**
 * Decode Base64url string to bytes.
 *
 * @param base64url Base64url-encoded string.
 * @returns Bytes.
 */
declare function base64UrlToBytes(base64url: string): Uint8Array;
/**
 * Is the current system big-endian?  Tested for, rather than using a node
 * built-in.
 *
 * @returns True if system is big-endian.
 */
declare function isBigEndian(): boolean;
/**
 * Convert a string to a U+xxxx notation for debugging.
 *
 * @param str String to convert
 * @returns "U+0000 U+0001"
 */
declare function stringToHex(str: string): string;

export { base64ToBytes, base64UrlToBytes, hexToU8, isBigEndian, stringToHex, u8concat, u8toHex };
