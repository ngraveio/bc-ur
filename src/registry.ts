import { RegistryItemClass } from "./classes/RegistryItem.js";

// TODO: singleton class?
// Add items
// Query items etc...
// When adding items, check if the item is already in the registry
// If it is show warning for overwriting
// Add multiple items at once
// Query items by tag, URType
// Make sure CBOR2 tag registry is updated

export type Registry = { [type: string]: RegistryItemClass } 
export const registry: Registry = {};
