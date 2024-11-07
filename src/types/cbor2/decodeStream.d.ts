import { M as MtAiValue, S as Sliceable, b as DecodeStreamOptions } from './options-QQFLweAY.js';
import './sorts.js';

type ValueGenerator = Generator<MtAiValue, undefined, undefined>;
/**
 * Decode bytes into a stream of events describing the CBOR read from the
 * bytes.  Currently requires a full single CBOR value, with no extra bytes in
 * the input.
 */
declare class DecodeStream implements Sliceable {
    #private;
    static defaultOptions: Required<DecodeStreamOptions>;
    constructor(src: Uint8Array | string, opts?: DecodeStreamOptions);
    toHere(begin: number): Uint8Array;
    /**
     * Get the stream of events describing the CBOR item.  Yields Value tuples.
     *
     * @throws On invalid input or extra data in input.
     * @example
     * ```js
     * const s = new DecodeStream(buffer);
     * for (const [majorType, additionalInfo, value] of s) {
     *  ...
     * }
     * ```
     */
    [Symbol.iterator](): ValueGenerator;
}

export { DecodeStream, type ValueGenerator };
