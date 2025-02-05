/**
 *  This is for react-native compatibility
 *  In Expo SDK 51 (React Native 74), Hermes supports TextEncoder natively but not TextDecoder.
 *  Latest version of Expo 52 has added TextDecoder support for Hermes. But it is still unsupported in React Native 77,
 * 
 *  So lets inject TextDecoder polyfill for React Native if it is not supported
 */
import "@bacons/text-decoder/install";