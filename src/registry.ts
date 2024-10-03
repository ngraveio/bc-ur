import { CryptoPortfolioMetadata } from "./classes/CryptoPortfolioMetadata";
import { RegistryItem } from "./classes/RegistryItem";

export const registry: { [type: string]: RegistryItem } = {
  "crypto-portfolio-metadata": new CryptoPortfolioMetadata(),
};

export const getRegistryTags = () =>
  Object.keys(registry).reduce((tags, key) => {
    const RegistryClass = registry[key].fromCBOR();
    return { ...tags, ...RegistryClass };
  }, {});
