import { Tagged } from "cbor";
import { dataToMapHelper, IRegistryItem, registryType } from "./RegistryItem";

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

enum Keys {
  type = 1,
  network = 2,
}

export class CoinInfo extends registryType({
  tag: 40305,
  type: "coin-info",
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
    // const defaultData: ICoinInfo = {
    //   type: 1,
    //   network: 1,
    //   anahtar: "deneme"
    // };

    // const merged = { ...defaultData, ...data };

    super(data);
  }

  /** 
   * Here we convert our data to a map to keep order and convert keys
   */
  toCBORData_() {
    const map = new Map();

    if(this.data.type) map.set(Keys.type, this.data.type);
    if(this.data.network) map.set(Keys.network, this.data.network);
    if(this.data.anahtar) map.set("anahtar", this.data.anahtar);

    return map;
  }

  toCBORData() {
    return dataToMapHelper(this.data, {
      type: Keys.type,
      network: Keys.network,
      anahtar: "anahtar"
    })
  }


  /**
   * Decode the keys coming from CBOR decoding
   * @param map 
   * @returns 
   */
  static fromCBORData = (map: Map<any, any>): CoinInfo => {
    const input: ICoinInfo = {
      type: map.get(Keys.type),
      network: map.get(Keys.network),
      anahtar: map.get("anahtar")
    };

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