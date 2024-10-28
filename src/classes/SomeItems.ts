import { Tagged } from "cbor";
import { dataToMapHelper, IRegistryItem, mapToDataHelper, registryType } from "./RegistryItem";

interface ICborTest {
  'bool'?: boolean;
  'number'?: number;
  'string'?: string;
  'array'?: any[];
  'object'?: object;
  'map'?: Map<any, any>;
  'set'?: Set<any>;
  'undefined'?: undefined;
  'buffer'?: Buffer;
  'date'?: Date;
  'regexp'?: RegExp;
  'url'?: URL;
  'rest'?: any;
}

export class CborTest extends registryType({
  tag: 666,
  type: "CborTest",
  CDDL: ``,
}) {
  constructor(data: ICborTest) {
    super(data);
  }

  static fromCBORData(val: any): CborTest {
    console.log("CborTest fromCBOR called", val);
    return new CborTest(val);
  }
}

interface IUser {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  [key: string]: any;
}


export class User extends registryType({
  tag: 1405,
  type: "user",
  CDDL: `
    user = #6.1405({
        id: uint,
        name: text,
        ? email: text,
        ? phone: text,
        ? address: text
    })
  `,
}) {
  private user: IUser;

  constructor(user: IUser) {
    super(user);
    this.user = user;
  }

  static fromCBORData(val: any): User {
    // Check some values if needed
    console.log("User fromCBOR called", val);
    return new User(val);
  }
}

interface IUserCollection {
  name: string;
  users: User[];
}

const UserCollectionType = {
  tag: 1406,
  type: "user-collection",
  CDDL: `
    user-collection = #6.1406({
      name: text,
      users: [+ #6.1405(user)]
    })
  `,
}

export class UserCollection extends registryType(UserCollectionType) {
  constructor(private userCollection: IUserCollection) {
    super(userCollection);
  }

  static fromCBORData = (val: any): UserCollection => {
    console.log("UserCollection fromCBOR called", val);
    // Check some values
    return new UserCollection(val);
  }
}

interface ICoinInfo {
  type?: number;
  network?: number;
  anahtar?: string;
}


export class CoinInfo extends registryType({
  tag: 40305,
  type: "coin-info",
  keyMap: {
    type: 1,
    network: 2,
    anahtar: "anahtar"
  },
  CDDL:`
    coininfo = #6.40305({
        ? type: uint .default 1, ; values from [SLIP44](https://github.com/satoshilabs/slips/blob/master/slip-0044.md) with high bit turned off
        ? network: int .default 1 ; coin-specific identifier for testnet
        ? anahtar: text .default "deneme"
    })

    type = 1
    network = 2
`
}) {
  constructor(data: ICoinInfo) {
    super(data);
  }

  /** 
   * Here we convert our data to a map to keep order and convert keys
   */

  toCBORData() {
    return super.toCBORData();
  }


  /**
   * Decode the keys coming from CBOR decoding
   * @param map 
   * @returns 
   */
  static fromCBORData = (map: Map<any, any>): CoinInfo => {
    const input: ICoinInfo = mapToDataHelper(map, CoinInfo.keyMap)

    return new CoinInfo(input);
  } 

}

export class myText extends registryType({
  tag: 777,
  type: "myText",
  CDDL:`
    myText = text
`
}) {

  constructor(data: string) {
    super(data);
  }

  static fromCBORData = (val: any): myText => {
    return new myText(val);
  } 

}