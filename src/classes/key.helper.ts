/**
 * This file contains helper functions for encoding and decoding keys
 */

/**
 * Interface for the key to integer mapping
 */
export type IKeyMap = Record<string, string | number>;

/**
 * For some CDDL types we use integer as keys to keep the CBOR encoded data small
 * This function converts the data keys to their respective integer values
 *
 * It needs to return MAP because cbor library only then encodes the keys as integers
 *
 * @param data Object that has key value pairs
 * @param keyMap  Map of the keys to integers values
 * @returns Map with integer keys
 */
export function encodeKeys(
  data: object,
  keyMap: IKeyMap,
  allowKeysNotInMap: boolean
): Map<string | number, any> {
  const map = new Map();
  // If we have a mapping, use it to map the data
  // Check if our data is an object
  if (typeof data !== "object") return undefined;

  // Create a set from the keys of the data
  const keys = new Set(Object.keys(data));

  // Add the keys in the correct order to the map
  for (const key in keyMap) {
    // Check if the key exists in the data
    if(data[key] !== undefined) map.set(keyMap[key], data[key]);
    keys.delete(key);
  }

  if (allowKeysNotInMap) {
    // Add other keys as string if they are not existent in the map
    keys.forEach((key) => {
      map.set(key, data[key]);
    });
  }

  return map;
}

/**
 * For some CDDL types we use integer as keys to keep the CBOR encoded data small
 * This function converts the data keys back to their respective string values
 *
 * @param _data Object that has encoded key - value pairs
 * @param keyMap Map of the keys to integer values
 * @returns Object with string keys
 */
export function decodeKeys(
  data: Map<string | number, any> | Record<string | number, any>,
  keyMap: IKeyMap,
  allowKeysNotInMap: boolean
): object {
  // If we have a mapping, use it to map the data
  const result = {};
  // Convert the data to a map if it is not already
  const _data = data instanceof Map ? data : new Map(Object.entries(data));

  // Get all the keys in the data
  const keys = new Set(_data.keys());

  // Add the keys in the correct order
  for (const key in keyMap) {
    if (_data.has(keyMap[key])) result[key] = _data.get(keyMap[key]);
    keys.delete(keyMap[key]);
  }

  if (allowKeysNotInMap) {
    // Add other keys as string if they are not existent in the map
    keys.forEach((key) => {
      result[key] = _data.get(key);
    });
  }

  return result;
}
