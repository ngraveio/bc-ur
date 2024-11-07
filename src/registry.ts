import { CborTest, CoinInfo, myText, User, UserCollection } from "./classes/SomeItems.js";
import { RegistryItemClass } from "./classes/RegistryItem.js";

export const registry: { [type: string]: RegistryItemClass } = {
  "user": User,
  "user-collection": UserCollection,
  "CborTest": CborTest,
  "coininfo": CoinInfo,
  "myText": myText,
};