import FountainEncoder, { FountainEncoderPart } from './fountainEncoder';
import bytewords from './bytewords';
import UR from './ur';

export default class UREncoder {
  private ur: UR;
  private fountainEncoder: FountainEncoder;

  constructor(
    _ur: UR,
    maxFragmentLength?: number,
    firstSeqNum?: number,
    minFragmentLength?: number,
  ) {
    this.ur = _ur;
    this.fountainEncoder = new FountainEncoder(_ur.cbor, maxFragmentLength, firstSeqNum, minFragmentLength);
  }

  public get fragmentsLength() { return this.fountainEncoder.fragmentsLength; }
  public get fragments() { return this.fountainEncoder.fragments; }
  public get messageLength() { return this.fountainEncoder.messageLength; }
  public get cbor() { return this.ur.cbor; }

  public encodeWhole(): string[] {
    return [...new Array(this.fragmentsLength)].map(() => this.nextPart())
  }

  public nextPart(): string {
    const part = this.fountainEncoder.nextPart();

    if (this.fountainEncoder.isSinglePart()) {
      return UREncoder.encodeSinglePart(this.ur);
    }
    else {
      return UREncoder.encodePart(this.ur.type, part)
    }
  }

  private static encodeUri(scheme: string, pathComponents: string[]): string {
    const path = pathComponents.join('/');
    return [scheme, path].join(':')
  }

  private static encodeUR(pathComponents: string[]): string {
    return UREncoder.encodeUri('ur', pathComponents);
  }

  private static encodePart(type: string, part: FountainEncoderPart): string {
    const seq = `${part.seqNum}-${part.seqLength}`;
    const body = bytewords.encode(part.cbor().toString('hex'), bytewords.STYLES.MINIMAL);

    return UREncoder.encodeUR([type, seq, body])
  }

  public static encodeSinglePart(ur: UR): string {
    const body = bytewords.encode(ur.cbor.toString('hex'), bytewords.STYLES.MINIMAL);

    return UREncoder.encodeUR([ur.type, body])
  }
}