import type {
  DecodeOptions,
  EncodeOptions,
//@ts-ignore
} from 'cbor2' with { 'resolution-mode': 'import' };

//@ts-ignore
import { decode, encode, Tag } from 'cbor2';
//@ts-ignore
import { registerEncoder } from 'cbor2/encoder';

export { decode, encode, Tag, registerEncoder };
export type { DecodeOptions, EncodeOptions };