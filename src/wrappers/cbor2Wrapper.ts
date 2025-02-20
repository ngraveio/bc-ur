import type {
  DecodeOptions,
  EncodeOptions,
  CommentOptions,
//@ts-ignore
} from 'cbor2' with { 'resolution-mode': 'import' };

//@ts-ignore
import { decode, encode, Tag, comment, diagnose } from 'cbor2';
//@ts-ignore
import { registerEncoder } from 'cbor2/encoder';

export { decode, encode, Tag, registerEncoder, comment, diagnose };
export type { DecodeOptions, EncodeOptions, CommentOptions };