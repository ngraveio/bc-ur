import { registryItemFactory } from "./classes/RegistryItem.js";

// Define a nested registry items
interface IUser {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  [key: string]: any;
}
export class User extends registryItemFactory({
  tag: 111,
  URType: "user",
  CDDL: `
          user = #6.111({
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

  verifyInput(input: any) {
    let reasons: Error[] = [];

    if (!input.id) {
      reasons.push(new Error("ID is required"));
    } else {
      if (typeof input.id !== "number") {
        reasons.push(new Error("ID should be a number"));
      }
    }

    if (!input.name) {
      reasons.push(new Error("Name is required"));
    } else {
      if (typeof input.name !== "string") {
        reasons.push(new Error("Name should be a string"));
      }
    }

    const valid = reasons.length === 0;
    return { valid, reasons };
  }
}

// Parent class
interface IUserCollection {
  name: string;
  users: User[];
}

const UserCollectionType = {
  tag: 112,
  URType: "user-collection",
  CDDL: `
          user-collection = #6.112({
            name: text,
            users: [+ #6.112(user)]
          })
        `,
};

export class UserCollection extends registryItemFactory(UserCollectionType) {
  constructor(private userCollection: IUserCollection) {
    super(userCollection);
  }

  verifyInput(input: any) {
    let reasons: Error[] = [];

    if (!input.name) {
      reasons.push(new Error("Name is required"));
    }

    if (typeof input.name !== "string") {
      reasons.push(new Error("Name should be a string"));
    }

    if (input.users) {
      // Check its array
      if (!Array.isArray(input.users)) {
        reasons.push(new Error("Users should be an array"));
      } else {
        input.users.forEach((user: any) => {
          if (!(user instanceof User)) {
            reasons.push(new Error("Users should be an array of User"));
          }
        });
      }
    }

    const valid = reasons.length === 0;
    return { valid, reasons };
  }
}
