import { RegistryItemClass } from "./classes/RegistryItem.js";
import { Tag } from "cbor2/tag";

export type Registry = Map<string, RegistryItemClass>;

export class URRegistry {
  private registry: Registry = new Map();
  private tagMap: Map<number, string> = new Map();
  private loggingEnabled: boolean;

  constructor(items: RegistryItemClass[] = [], loggingEnabled: boolean = true) {
    this.loggingEnabled = loggingEnabled;
    this.addItems(items);
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
    this.tagMap.set(item.tag, item.URType);
    Tag.registerDecoder(item.tag, (tag: Tag, opts: any) => {
      return item.fromCBORData.bind(item)(tag.contents, opts);
    });
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
   * @param item - The item to be removed. It can be an instance of RegistryItemClass, a URType string, or a tag number.
   */
  public removeItem(item: RegistryItemClass | string | number): void {
    if (typeof item === "string") {
      // If the item is a URType string, remove the corresponding item
      if (this.registry.has(item)) {
        const removedItem = this.registry.get(item);
        this.registry.delete(item);
        if (removedItem) {
          const tag = removedItem.tag;
          this.tagMap.delete(tag);
        }
      } else {
        this.log(`Warning: No item found with URType: ${item}`);
      }
    } else if (typeof item === "number") {
      // If the item is a tag number, remove the corresponding item
      const URType = this.tagMap.get(item);
      if (URType) {
        this.registry.delete(URType);
        this.tagMap.delete(item);
      } else {
        this.log(`Warning: No item found with tag: ${item}`);
      }
    } else {
      // If the item is an instance of RegistryItemClass, remove it based on its URType
      const URType = item.URType;
      if (this.registry.has(URType)) {
        this.registry.delete(URType);
        const tag = item.tag;
        this.tagMap.delete(tag);
      } else {
        this.log(`Warning: No item found with URType: ${URType}`);
      }
    }
  }

  public clearRegistry(): void {
    this.registry.clear();
    this.tagMap.clear();
  }

  public getRegistry(): Registry {
    return this.registry;
  }
}

export const globalUrRegistry = new URRegistry();
