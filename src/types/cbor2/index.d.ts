import { D as DecodeOptions } from './options-QQFLweAY.js';
export { C as CommentOptions, b as DecodeStreamOptions, c as DecodeValue, a as Decodeable, g as DiagnosticSizes, E as EncodeOptions, M as MtAiValue, P as Parent, d as ParentConstructor, e as RequiredCommentOptions, R as RequiredDecodeOptions, f as RequiredEncodeOptions, h as Simple, S as Sliceable, T as TagNumber, i as TaggedValue, j as ToCBOR, k as Writer, W as WriterOptions } from './options-QQFLweAY.js';
export { version } from './version.js';
export { DecodeStream, ValueGenerator } from './decodeStream.js';
export { decode } from './decoder.js';
export { diagnose } from './diagnostic.js';
export { comment } from './comment.js';
export { cdeEncodeOptions, dcborEncodeOptions, defaultEncodeOptions, encode, encodedNumber } from './encoder.js';
export { Tag } from './tag.js';
export { getEncoded, saveEncoded, saveEncodedLength, unbox } from './box.js';
import './sorts.js';
import './constants.js';

declare const cdeDecodeOptions: DecodeOptions;
declare const dcborDecodeOptions: DecodeOptions;
declare const defaultDecodeOptions: Required<DecodeOptions>;

export { DecodeOptions, cdeDecodeOptions, dcborDecodeOptions, defaultDecodeOptions };
