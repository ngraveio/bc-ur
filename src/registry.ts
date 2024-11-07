import { CborTest, CoinInfo, myText, User, UserCollection } from "./classes/SomeItems.js";
import { RegistryItemClass } from "./classes/RegistryItem.js";

// TODO: singleton class?
// Add items
// Query items etc...
export type Registry = { [type: string]: RegistryItemClass } 
export const registry: Registry = {
  "user": User,
  "user-collection": UserCollection,
  "CborTest": CborTest,
  "coininfo": CoinInfo,
  "myText": myText,
};
