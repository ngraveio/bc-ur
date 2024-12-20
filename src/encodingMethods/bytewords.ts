import assert from "assert";
import { getCRCHex, partition, split } from "../utils.js";
import { uint8ArrayToHex, hexToUint8Array } from "../wrappers/uint8array.js";

const bytewords =
  "ableacidalsoapexaquaarchatomauntawayaxisbackbaldbarnbeltbetabiasbluebodybragbrewbulbbuzzcalmcashcatschefcityclawcodecolacookcostcruxcurlcuspcyandarkdatadaysdelidicedietdoordowndrawdropdrumdulldutyeacheasyechoedgeepicevenexamexiteyesfactfairfernfigsfilmfishfizzflapflewfluxfoxyfreefrogfuelfundgalagamegeargemsgiftgirlglowgoodgraygrimgurugushgyrohalfhanghardhawkheathelphighhillholyhopehornhutsicedideaidleinchinkyintoirisironitemjadejazzjoinjoltjowljudojugsjumpjunkjurykeepkenokeptkeyskickkilnkingkitekiwiknoblamblavalazyleaflegsliarlimplionlistlogoloudloveluaulucklungmainmanymathmazememomenumeowmildmintmissmonknailnavyneednewsnextnoonnotenumbobeyoboeomitonyxopenovalowlspaidpartpeckplaypluspoempoolposepuffpumapurrquadquizraceramprealredorichroadrockroofrubyruinrunsrustsafesagascarsetssilkskewslotsoapsolosongstubsurfswantacotasktaxitenttiedtimetinytoiltombtoystriptunatwinuglyundouniturgeuservastveryvetovialvibeviewvisavoidvowswallwandwarmwaspwavewaxywebswhatwhenwhizwolfworkyankyawnyellyogayurtzapszerozestzinczonezoom";
let bytewordsLookUpTable: number[] = [];
const BYTEWORDS_NUM = 256;
const BYTEWORD_LENGTH = 4;
const MINIMAL_BYTEWORD_LENGTH = 2;

export enum STYLES {
  STANDARD = "standard",
  URI = "uri",
  MINIMAL = "minimal",
}

const getWord = (index: number): string => {
  return bytewords.slice(
    index * BYTEWORD_LENGTH,
    index * BYTEWORD_LENGTH + BYTEWORD_LENGTH
  );
};

const getMinimalWord = (index: number): string => {
  const byteword = getWord(index);

  return `${byteword[0]}${byteword[BYTEWORD_LENGTH - 1]}`;
};

const addCRC = (string: string): string => {
  const crc = getCRCHex(hexToUint8Array(string));

  return `${string}${crc}`;
};

const encodeWithSeparator = (word: string, separator: string): string => {
  const crcAppendedWord = addCRC(word);
  const crcWordArray = hexToUint8Array(crcAppendedWord);
  const result = crcWordArray.reduce(
    (result: string[], w) => [...result, getWord(w)],
    []
  );

  return result.join(separator);
};

const encodeMinimal = (word: string): string => {
  const crcAppendedWord = addCRC(word);
  const crcWordArray = hexToUint8Array(crcAppendedWord);
  const result = crcWordArray.reduce(
    (result, w) => result + getMinimalWord(w),
    ""
  );

  return result;
};

const decodeWord = (word: string, wordLength: number): string => {
  assert(
    word.length === wordLength,
    "Invalid Bytewords: word.length does not match wordLength provided"
  );

  const dim = 26;

  // Since the first and last letters of each Byteword are unique,
  // we can use them as indexes into a two-dimensional lookup table.
  // This table is generated lazily.
  if (bytewordsLookUpTable.length === 0) {
    const array_len = dim * dim;
    bytewordsLookUpTable = [...new Array(array_len)].map(() => -1);

    for (let i = 0; i < BYTEWORDS_NUM; i++) {
      const byteword = getWord(i);
      let x = byteword[0].charCodeAt(0) - "a".charCodeAt(0);
      let y = byteword[3].charCodeAt(0) - "a".charCodeAt(0);
      let offset = y * dim + x;
      bytewordsLookUpTable[offset] = i;
    }
  }

  // If the coordinates generated by the first and last letters are out of bounds,
  // or the lookup table contains -1 at the coordinates, then the word is not valid.
  let x = word[0].toLowerCase().charCodeAt(0) - "a".charCodeAt(0);
  let y =
    word[wordLength == 4 ? 3 : 1].toLowerCase().charCodeAt(0) -
    "a".charCodeAt(0);

  assert(
    0 <= x && x < dim && 0 <= y && y < dim,
    "Invalid Bytewords: invalid word"
  );

  let offset = y * dim + x;
  let value = bytewordsLookUpTable[offset];

  assert(value !== -1, "Invalid Bytewords: value not in lookup table");

  // If we're decoding a full four-letter word, verify that the two middle letters are correct.
  if (wordLength == BYTEWORD_LENGTH) {
    const byteword = getWord(value);
    let c1 = word[1].toLowerCase();
    let c2 = word[2].toLowerCase();

    assert(
      c1 === byteword[1] && c2 === byteword[2],
      "Invalid Bytewords: invalid middle letters of word"
    );
  }

  // Successful decode.
  return value.toString(16).padStart(2, "0");
};

/**
 * Decode a string of Bytewords into a hex string.
 * @param string string of Bytewords. e.g. "lpamchcfatttcyclehgsdphdhgehfghkkkdl..."
 * @param separator e.g. " " or "-" or "" or any other separator
 * @param wordLength e.g. 4 or 2 or any other length
 * @returns hex string
 */
const _decode = (
  string: string,
  separator: string,
  wordLength: number
): string => {
  // Split the string into words. e.g. ["lp", "am", "ch", "cf", "at", "tt", "cy", "cl", "eh", "gs", "dp", "hd", "hg", "eh", "fg", "hk", "kk", "dl", ...]
  const words =
    wordLength == BYTEWORD_LENGTH
      ? string.split(separator)
      : partition(string, 2);

  // Decode each word. e.g. ["85", "06", "17", "19", "07", "d1", "1a", "21", "31", "4c", "2d", "58", "57", "31", "46", "59", "79", "2f", ...]
  const decodedWords = words.map((word: string) =>
    decodeWord(word, wordLength)
  );

  // e.g. "8506171907d11a21314c2d5857314659792f..."
  const decodedString = decodedWords.join("");

  // 4 bytes for checksum, at least 1 byte for body
  assert(
    decodedString.length >= 5,
    "Invalid Bytewords: invalid decoded string length"
  );

  // decoded string consists of `body` and `checksum`
  const decodedArray = hexToUint8Array(decodedString);
  const [body, bodyChecksum] = split(decodedArray, 4);
  const checksum = getCRCHex(body); // convert to hex

  assert(checksum === uint8ArrayToHex(bodyChecksum), "Invalid Checksum");

  return uint8ArrayToHex(body);
};

/**
 * Decode a string of bytewords into a hex string.
 * @param string string of Bytewords
 * @param style style of Bytewords
 * @returns hex string
 */
export const decode = (
  string: string,
  style: STYLES = STYLES.MINIMAL
): string => {
  switch (style) {
    case STYLES.STANDARD:
      return _decode(string, " ", BYTEWORD_LENGTH);
    case STYLES.URI:
      return _decode(string, "-", BYTEWORD_LENGTH);
    case STYLES.MINIMAL:
      return _decode(string, "", MINIMAL_BYTEWORD_LENGTH);
    default:
      throw new Error(`Invalid style ${style}`);
  }
};

/**
 * Encodes a string (hex representation of a buffer) into bytewords.
 * @param string string to encode.
 * @param style style to use for the encoding.
 * @returns the byteword encoded string
 */
export const encode = (
  string: string,
  style: STYLES = STYLES.MINIMAL
): string => {
  switch (style) {
    case STYLES.STANDARD:
      return encodeWithSeparator(string, " ");
    case STYLES.URI:
      return encodeWithSeparator(string, "-");
    case STYLES.MINIMAL:
      return encodeMinimal(string);
    default:
      throw new Error(`Invalid style ${style}`);
  }
};

export default {
  decode,
  encode,
  STYLES,
};
