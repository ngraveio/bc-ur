import { TagFunction } from "cbor/types/lib/tagged";
import { CborTest, CoinInfo, myText, User, UserCollection } from "./classes/SomeItems";
import { RegistryItemClass } from "./classes/RegistryItem";

export const registry: { [type: string]: RegistryItemClass } = {
  "user": User,
  "user-collection": UserCollection,
  "CborTest": CborTest,
  "coininfo": CoinInfo,
  "myText": myText,
};

// Get tags and decoders for the 2nd registry
export function allDecoders() {
  const myRegistry: { [tag: number]: TagFunction} = {};
  // Return a map of tag and decoder
  Object.values(registry).forEach((item) => {
    myRegistry[item.tag] = item.fromCBORData
  });

  return myRegistry;
}

export function allEncoders() {
  
}