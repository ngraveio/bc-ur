import { EncodingMethodName } from "../enums/EncodingMethodName.js";
import { IEncodingMethod } from "../interfaces/IEncodingMethod.js";

interface pipelineConfig {
  from?: EncodingMethodName;
  until?: EncodingMethodName;
  [key: string]: any;
}

export class EncodingPipeline<T, U> implements IEncodingMethod<T, U> {
  private _name: EncodingMethodName = EncodingMethodName.pipe;
  private _encodingMethods: IEncodingMethod<any, any>[];

  constructor(encodingMethods: IEncodingMethod<any, any>[]) {
    this._encodingMethods = encodingMethods;
  }

  get name(): EncodingMethodName {
    return this._name;
  }  

  get encodingMethods() {
    return this._encodingMethods;
  }

  get decodingMethods() {
    return this._encodingMethods.slice().reverse();
  }
  
  encode<O = U>(payload: T, config: pipelineConfig = {from:undefined, until:undefined}): O {
    let encodedValue: any = payload;
    let fromIndex = 0;
    let untilIndex = this.encodingMethods.length;

    const { from, until, ...rest } = config;

    // Find the index of the specified start and until encoding methods
    if(from) {
      fromIndex = this.encodingMethods.findIndex((method) => method.name === from);
      if(fromIndex === -1) {
        throw new Error(`Encoding method ${from} not found`);
      }
    }

    if(until) {
      untilIndex = this.encodingMethods.findIndex((method) => method.name === until);
      if(untilIndex === -1) {
        throw new Error(`Encoding method ${until} not found`);
      }
    }

    if(fromIndex > untilIndex) {
      throw new Error("Invalid encoding method range");
    }

    // Apply each encoding method in sequence until the specified encoding method or the end
    for (let i = fromIndex; i < untilIndex; i++) {
      encodedValue = this.encodingMethods[i].encode(encodedValue, rest);
    }
    return encodedValue;
  }  

  decode<O = T>(payload: U, config: pipelineConfig = {from:undefined, until:undefined}): O {
    let decodedValue: any = payload;
    let fromIndex = 0;
    let untilIndex = this.decodingMethods.length;

    const { from, until, ...rest } = config;

    // Find the index of the specified start and until encoding methods
    if(from) {
      fromIndex = this.decodingMethods.findIndex((method) => method.name === from);
      if(fromIndex === -1) {
        throw new Error(`Encoding method ${from} not found`);
      }
    }

    if(until) {
      untilIndex = this.decodingMethods.findIndex((method) => method.name === until);
      if(untilIndex === -1) {
        throw new Error(`Encoding method ${until} not found`);
      }
    }

    if(fromIndex > untilIndex) {
      throw new Error("Invalid encoding method range");
    }

    // Apply each encoding method in sequence until the specified encoding method or the end
    for (let i = fromIndex; i < untilIndex; i++) {
      decodedValue = this.decodingMethods[i].decode(decodedValue, rest);
    }

    return decodedValue;
  }

  getMethod(methodName: EncodingMethodName): IEncodingMethod<any, any> {
    return this.encodingMethods.find((method) => method.name === methodName);
  }

}