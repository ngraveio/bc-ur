import { RegistryItemClass } from "./classes/RegistryItem.js";
import {
  Tag,
} from "./wrappers/cbor2.js";

type Registry = Map<string, RegistryItemClass>;

export class URRegistryClass {
  private static instance: URRegistryClass;
  private registry: Registry = new Map();
  private tagMap: Map<number, string> = new Map();
  private loggingEnabled: boolean;

  private constructor(
    items: RegistryItemClass[] = [],
    loggingEnabled: boolean = true
  ) {
    this.loggingEnabled = loggingEnabled;
    this.addItems(items);
  }

  public static getInstance(
    items: RegistryItemClass[] = [],
    loggingEnabled: boolean = true
  ): URRegistryClass {
    if (!URRegistryClass.instance) {
      URRegistryClass.instance = new URRegistryClass(items, loggingEnabled);
    }
    return URRegistryClass.instance;
  }

  public setLoggingEnabled(enabled: boolean): void {
    this.loggingEnabled = enabled;
  }

  private log(message: string): void {
    if (this.loggingEnabled) {
      console.warn(message);
    }
  }

  public addItem(item: RegistryItemClass): void {
    if (this.registry.has(item.URType)) {
      this.log(
        `Warning: Overwriting existing item with URType: ${item.URType}`
      );
    }
    if (this.tagMap.has(item.tag)) {
      this.log(`Warning: Tag collision detected for tag: ${item.tag}`);
    }
    this.registry.set(item.URType, item);

    // Register to CBOR decoder only if it has a tag
    if (!Number.isNaN(item.tag)) {
      this.tagMap.set(item.tag, item.URType);
      Tag.registerDecoder(item.tag, (tag: Tag, opts: any) => {
        return item.fromCBORData.bind(item)(
          tag.contents,
          item.allowKeysNotInMap,
          opts
        );
      });
    }
  }

  public addItemOnce(item: RegistryItemClass): void {
    // If we already have the item in the registry, do nothing
    if (this.registry.has(item.URType) || this.tagMap.has(item.tag)) {
      // Check if its the same item
      const existingItem = this.registry.get(item.URType);
      if (existingItem !== item) {
        this.log(
          `Warning: Resgistry already has an item with URType: ${item.URType} but it seems to be a different instance`
        );
        this.log(`Existing item: ${existingItem}`);
        this.log(`New item: ${item}`);
      }
      return;
    }

    // Otherwise, add the item
    this.addItem(item);
  }

  public addItems(items: RegistryItemClass[]): void {
    items.forEach((item) => this.addItem(item));
  }

  public queryByTag(tag: number): RegistryItemClass | undefined {
    const URType = this.tagMap.get(tag);
    return URType ? this.registry.get(URType) : undefined;
  }

  public queryByURType(URType: string): RegistryItemClass | undefined {
    return this.registry.get(URType);
  }

  /**
   * Removes an item from the registry based on its URType, tag, or item instance.
   * @param findItem - The item to be removed. It can be an instance of RegistryItemClass, a URType string, or a tag number.
   */
  public removeItem(findItem: RegistryItemClass | string | number): void {
    let foundItem: RegistryItemClass | undefined;
    if (typeof findItem === "string") {
      foundItem = this.queryByURType(findItem);
      if (!foundItem) {
        this.log(`Warning: No item found with URType: ${findItem}`);
        return;
      }
    } else if (typeof findItem === "number") {
      foundItem = this.queryByTag(findItem);
      if (!foundItem) {
        this.log(`Warning: No item found with tag: ${findItem}`);
        return;
      }
    } else {
      // Check if the item is in the registry
      const URType = findItem.URType;
      if (this.registry.has(URType)) {
        foundItem = findItem;
      } else {
        this.log(`Warning: Item not found in registry with type: ${URType}`);
        return;
      }
    }

    // Remove it from registry
    this.registry.delete(foundItem.URType);
    this.tagMap.delete(foundItem.tag);
    Tag.clearDecoder(foundItem.tag);
  }

  public clearRegistry(): void {
    this.registry.forEach((item) => {
      Tag.clearDecoder(item.tag);
    });
    this.registry.clear();
    this.tagMap.clear();
  }

  public getRegistry(): Registry {
    return this.registry;
  }
}

export const UrRegistry = URRegistryClass.getInstance();
