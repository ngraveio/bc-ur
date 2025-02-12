# BC-UR

A JavaScript/TypeScript library implementing BC-UR encoding, based on the [C++ reference implementation](https://github.com/BlockchainCommons/bc-ur). It provides robust tools for encoding, decoding, and transmitting data through URs (Uniform Resources).

---

## Features

- 🔑 **Registry System**: Built-in support for CBOR tag registration and extendable registry items.
- 📜 **UR as Communication Layer**: Simplified encoding/decoding from CBOR tags to registry items using UR.
- 🚀 **Fountain Encoder/Decoder**: Reliable multipart UR support for lossy or air-gapped environments.
- 🌐 **Dual Packaging**: Native support for ESM and CJS modules.
- 🛠️ **CBOR2 Integration**: Enhanced CBOR encoding/decoding capabilities.

---

## Table of Contents

- [BC-UR](#bc-ur)
  - [Features](#features)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
    - [Encoding and Decoding with Registry Items](#encoding-and-decoding-with-registry-items)
  - [What is UR?](#what-is-ur)
    - [Key Benefits of UR](#key-benefits-of-ur)
    - [Single-Part UR](#single-part-ur)
    - [Multipart UR (MUR)](#multipart-ur-mur)
  - [Registry Items](#registry-items)
    - [Overview](#overview)
    - [Factory Function API](#factory-function-api)
    - [Quick Start Example](#quick-start-example)
    - [Key Features](#key-features)
  - [Registry System](#registry-system)
  - [UR Class](#ur-class)
    - [Class Features](#class-features)
    - [Data Pipeline](#data-pipeline)
  - [Multipart UR (MUR) - Animated QR codes](#multipart-ur-mur---animated-qr-codes)
    - [Quick Start](#quick-start-1)
  - [Technical Choices](#technical-choices)
  - [Contributing](#contributing)
  - [Building the Project](#building-the-project)
  - [License](#license)

---

## Installation

```bash
yarn add @ngraveio/bc-ur
```

---

## Quick Start
> ⚠️ **Warning**: `Buffer` instances are encoded and decoded as `Uint8Array` for compatibility. Convert `Uint8Array` back to `Buffer` using `Buffer.from(uint8Array)` in the `postCbor` function. See the [example](#3-postcbor) below for details.


### Encoding and Decoding with Registry Items

The quickest way to get started is by working with registry items. Registry items allow you to define, encode, and decode structured data using URs.

#### Encode a Registry Item to a UR

```ts
import { registryItemFactory, UR, UrRegistry } from '@ngraveio/bc-ur';

// Create a registry item for a user
const User = registryItemFactory({
  tag: 111,
  URType: 'user',
  keyMap: { id: 1, name: 2 },
  CDDL: ``,
});

// Register the User item to the global registry
UrRegistry.addItem(User);

// Instantiate the user item
const user = new User({ id: 123, name: 'John Doe' });

// Encode the registry item as a UR
const userUr = user.toUr();
console.log(userUr.toString());
// Output: ur:user/oeidiniecskgiejthsjnihisgejlisjtcxfyjlihjldnbwrl
```

#### Decode a UR to a Registry Item

```ts
// Decode the UR back to a registry item
const decodedUr = UR.fromString(userUr.toString());
const decodedUser = decodedUr.decode();
console.log(decodedUser.data);
// Output: { id: 123, name: 'John Doe' }
```

---

## What is UR?

**Uniform Resource (UR)** is a structured format for encoding binary data with types. It is designed for interoperability across systems and ensures compatibility with QR codes and other transport layers. UR leverages alphanumeric encoding modes to address limitations in native binary encoding support. It takes advantage of QR Codes *"alphanumeric"* mode to transfer binary data because the native binary encoding mode of QR codes is not consistently supported by [readers](https://stackoverflow.com/questions/37996101/storing-binary-data-in-qr-codes).

### Key Benefits of UR

- **Interoperability**: URs are designed to be compatible across different systems and platforms, ensuring seamless data exchange.
- **Binary Data Compatibility**: Encodes binary data in a standardized way that can be transmitted via QR codes or URLs.
- **Error Resistance**: Supports multipart encoding to handle lossy transmission environments.
- **Type-Based Encoding**: Includes type information for easier interpretation and decoding.
- **Human-Readable**: Uses bytewords encoding to make the data more human-readable and less error-prone.
- **Extensibility**: New types and structures can be added to the UR ecosystem without breaking existing implementations.
- **Security**: Ensures data integrity and authenticity through checksums and other mechanisms.

**Resources:**
- [UR Overview](https://developer.blockchaincommons.com/ur/)
- [BC-UR Research Paper](https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2020-005-ur.md)

### Single-Part UR

A single-part UR encodes a single data payload, including its type and content.

#### Format

```
ur:<type>/<message (bytewords)>
```

#### Example

```
ur:seed/oyadhdeynteelblrcygldwvarflojtcywyjytpdkfwprylienshnjnpluypmamtkmybsjkspvseesawmrltdlnlgkplfbkqzzoglfeoyaegslobemohs
```

### Multipart UR (MUR)

A multipart UR breaks large data into smaller fragments for transmission, ensuring reliability over lossy channels like QR code scanning.

#### Format

```
ur:<type>/<seq>/<fragment (bytewords)>
```

- `<seq>`: Indicates the sequence number and total parts (e.g., `1-3` for part 1 of 3).
- `<fragment>`: Contains a portion of the encoded data.

#### Example

```
ur:seed/1-3/lpadaxcsencylobemohsgmoyadhdeynteelblrcygldwvarflojtcywyjydmylgdsa
```

---

## Registry Items

### Overview

Registry Items are specialized classes that encode and decode data into CBOR and UR formats. They simplify encoding processes by providing structure and validation.

### Factory Function API

You can create a Registry Item using the `registryItemFactory` function. This function requires the following parameters:

- `tag`: A unique CBOR tag used to encode and decode the data.
- `URType`: The name of the item used in UR-encoded data.
- `CDDL`: (Optional) Defines the structure of the data.
- `keyMap`: (Optional) Maps keys to integers to reduce the size of encoded CBOR data.
- `allowKeysNotInMap`: (Optional) Whether to allow keys not defined in the `keyMap`.

### Quick Start Example

```ts
import { registryItemFactory, UrRegistry } from '@ngraveio/bc-ur';

// Create a Registry Item
const SimpleItem = registryItemFactory({
  tag: 999,
  URType: 'simple',
  CDDL: '',
});

// Register the item to the UR registry
UrRegistry.addItem(SimpleItem);

// Instantiate the item
const item = new SimpleItem({ id: 123, name: 'John Doe' });

// Access properties available to class instances
console.log(item.type.tag);      // 999
console.log(item.type.URType);   // 'simple'
console.log(item.data);          // { id: 123, name: 'John Doe' }

// Access static properties available to the class
console.log(SimpleItem.tag);      // 999
console.log(SimpleItem.URType);   // 'simple'
```

### Key Features

#### Key Mapping (`keyMap`)

Mapping keys to integers reduces the size of encoded CBOR data by replacing string keys with smaller numeric values.

Example:

```ts
const MappedItem = registryItemFactory({
  tag: 200,
  URType: 'mapped',
  CDDL: ``,
  keyMap: { id: 1, name: 2 },
});
const item = new MappedItem({ id: 123, name: 'John Doe' });
const itemUr = item.toUr();
// get the cbor encoded value
const encoded = itemUr.getPayloadHex();
console.log(encoded); // a201187b02684a6f686e20446f65
// {1: 123, 2: "John Doe"}
```

Encoded CBOR will use `1` for `id` and `2` for `name`, reducing size.

#### Allow Keys Not in Map (`allowKeysNotInMap`)

By default, only keys in the `keyMap` are encoded. Setting `allowKeysNotInMap` to `true` includes additional keys.

Example:

```ts
const FlexibleItem = registryItemFactory({
  tag: 201,
  URType: 'flexible',
  keyMap: { id: 1 },
  allowKeysNotInMap: true,
  CDDL: ``,
});
const item = new FlexibleItem({ id: 123, extraKey: 'extraValue' });
// CBOR will include `extraKey` in the encoded data.
```

#### Validation (`verifyInput`)

The `verifyInput` method validates input data before encoding or decoding.

Example:

```ts
class ValidatedItem extends registryItemFactory({
  tag: 300,
  URType: 'validated',
  CDDL: ``,
}) {
  verifyInput(input) {
    const reasons = [];
    if (!input.id) reasons.push(new Error('ID is required'));
    return { valid: reasons.length === 0, reasons };
  }
}
const item = new ValidatedItem({ id: 123 });
const invalidItem = new ValidatedItem({}); // Throws validation errors
```

#### Overriding Methods

Some methods can be overridden for custom behavior:

- `fromCBORData`: Customizes how decoded CBOR is passed to the constructor.
- `preCBOR`: Modifies data before CBOR encoding.
- `postCBOR`: Processes data after CBOR decoding.

### Examples for Overriding Methods

#### 1. `fromCBORData`

This method customizes how decoded CBOR is passed to the constructor. It’s especially useful when the class expects multiple parameters instead of an object.

```ts
class CustomItem extends registryItemFactory({
  tag: 400,
  URType: 'custom',
  CDDL: ``,
}) {
  constructor(type, network) {
    super({ type, network });
  }

  static fromCBORData(val: any) {
    // Call the base method to handle keymap processing
    const data = this.postCBOR(val);
    return new this(data.type, data.network);
  }
}
```

#### 2. `preCBOR`

This method modifies data before it is encoded into CBOR. Use it to adjust the structure or perform preprocessing.

```ts
class PreProcessedItem extends registryItemFactory({
  tag: 401,
  URType: 'pre-processed',
  CDDL: ``,
}) {
  preCBOR() {
    // Add a timestamp before encoding
    const processedData = { ...this.data, timestamp: Date.now() };

    // Call the base method to handle keymap processing
    // If no argument is provided to preCBOR it will use `this.data`
    return super.preCBOR(processedData);
  }
}
const item = new PreProcessedItem({ id: 123 });
const ur = item.toUr();
const cbor = ur.toCBOR(); // Includes the `timestamp` field
```

#### 3. `postCBOR`

This method processes data after decoding CBOR, allowing for custom transformations or validation.

```ts
class PostProcessedItem extends registryItemFactory({
  tag: 402,
  URType: 'post-processed',
  CDDL: ``,
}) {
  static postCBOR(decodedData) {
    // Call the base method to handle keymap processing
    const processedData = super.postCBOR(decodedData);
    // Transform a field after decoding
    processedData.name = processedData.name.toUpperCase();
    processedData.bytes = Buffer.from(processedData.bytes);
    return processedData;
  }
}
const encodedData = new UR(PostProcessedItem);
const decodedData = encodedData.decode();
console.log(decodedData.data.name); // Name will be transformed to uppercase
```

#### Nested Registry Items

Registry items can reference other registry items, allowing for nested or composite data structures. The CBOR decoder will automatically convert child items to registry items before passing them to the parent registry item. Therefore, you don't need to override the `fromCBORData` function.

Example:

```ts
const AddressItem = registryItemFactory({
  tag: 500,
  URType: 'address',
  CDDL: ``,
  keyMap: { street: 1, city: 2 },
});

// Add the AddressItem to the registry
UrRegistry.addItem(AddressItem);

class UserWithAddress extends registryItemFactory({
  tag: 501,
  URType: 'user-with-address',
  CDDL: ``,
  keyMap: { name: 1, address: 2 },
}) {
  constructor(name, address) {
    super({ name, address });
    this.address = address;
  }

  verifyInput(input: any) {
    let reasons: Error[] = [];

    if (!input.name) {
      reasons.push(new Error("Name is required"));
    } else if (typeof input.name !== "string") {
      reasons.push(new Error("Name should be a string"));
    }

    if (!input.address) {
      reasons.push(new Error("Address is required"));
    } else if (!(input.address instanceof AddressItem)) {
      reasons.push(new Error("Address should be an instance of AddressItem"));
    }

    const valid = reasons.length === 0;
    return { valid, reasons };
  }
}
// Add the UserWithAddress item to the registry
UrRegistry.addItem(UserWithAddress);

const address = new AddressItem({ street: 'Main St', city: 'Metropolis' });
const user = new UserWithAddress('John Doe', address);
const userUr = user.toUr();
console.log(userUr.toString());
```

---

## Registry System

The Registry System allows you to define, encode, and decode structured data using URs. It also updates the CBOR registry so that CBOR tags can be directly converted into Registry Items.

### Adding New Items

You can add new items to the registry using the `UrRegistry.addItem` method. This method takes a Registry Item class as an argument.

**Example:**

```ts
import { registryItemFactory, UrRegistry } from '@ngraveio/bc-ur';

// Define a new Registry Item
const CustomItem = registryItemFactory({
  tag: 999,
  URType: 'custom',
  CDDL: ``,
});

// Add the item to the registry
UrRegistry.addItem(CustomItem);

// Instantiate the item
const item = new CustomItem({ id: 123, name: 'John Doe' });

// Encode the item as a UR
const itemUr = item.toUr();
console.log(itemUr.toString());
// Output: ur:custom/oeidiniecskgiejthsjnihisgejlisjtcxfyjlihjldnbwrl
```

### Querying Items

You can query items from the registry using the `UrRegistry.queryByTag` or `UrRegistry.queryByURType` methods. These methods take a tag or UR type as an argument and return the corresponding Registry Item class.

**Example:**

```ts
import { UrRegistry } from '@ngraveio/bc-ur';

// Query an item by tag
const CustomItemClass = UrRegistry.queryByTag(999);
const customItem = new CustomItemClass({ id: 123, name: 'John Doe' });
console.log(customItem.data);
// Output: { id: 123, name: 'John Doe' }

// Query an item by UR type
const CustomItemClassByType = UrRegistry.queryByURType('custom');
const customItemByType = new CustomItemClassByType({ id: 123, name: 'John Doe' });
console.log(customItemByType.data);
// Output: { id: 123, name: 'John Doe' }
```

### CBOR Integration

The Registry System also updates the CBOR registry so that CBOR tags can be directly converted into Registry Items. This allows for seamless encoding and decoding of CBOR data.

**Example:**

```ts
import { CborEncoding, UrRegistry, registryItemFactory } from '@ngraveio/bc-ur';

// Define a new Registry Item
const CustomItem = registryItemFactory({
  tag: 999,
  URType: 'custom',
  CDDL: ``,
});

// Add the item to the registry
UrRegistry.addItem(CustomItem);

// Instantiate the item
const item = new CustomItem({ id: 123, name: 'John Doe' });

// Create a new CBOR encoder instance
const cborEncoder = new CborEncoding();

// Encode the item as CBOR
const cborData = cborEncoder.encode(item);
console.log(cborData);

// Decode the CBOR data back into a Registry Item
const decodedItem = cborEncoder.decode(cborData);
console.log(decodedItem.data);
// Output: { id: 123, name: 'John Doe' }
```

---

## UR Class

The `UR` class is used to encode and decode data into Uniform Resource (UR) format. It provides methods for encoding data into UR format, decoding UR strings back into data, and working with multipart URs.

### Class Features

#### Constructor

The constructor can create a `UR` instance from either a `RegistryItem` or an object conforming to the `IUr` interface.

Example:

```ts
import { UR, registryItemFactory } from '@ngraveio/bc-ur';

const User = registryItemFactory({
  tag: 111,
  URType: 'user',
  keyMap: { id: 1, name: 2 },
  CDDL: ``,
});

const user = new User({ id: 123, name: 'John Doe' });
const userUr = new UR(user);
console.log(userUr.toString());
// Output: ur:user/oeidiniecskgiejthsjnihisgejlisjtcxfyjlihjldnbwrl
```

#### `toString()`

Returns the UR string representation of the instance.

Example:

```ts
console.log(userUr.toString());
// Output: ur:user/oeidiniecskgiejthsjnihisgejlisjtcxfyjlihjldnbwrl
```

#### `decode()`

Decodes the UR payload back into the original data.

Example:

```ts
const decodedData = userUr.decode();
console.log(decodedData);
// Output: { id: 123, name: 'John Doe' }
```

#### `getPayloadBytewords()`

Returns the payload in bytewords format.

Example:

```ts
const bytewords = userUr.getPayloadBytewords();
console.log(bytewords);
// Output: oeidiniecskgiejthsjnihisgejlisjtcxfyjlihjldnbwrl
```

#### `getPayloadHex()`

Returns the payload in hexadecimal format.

Example:

```ts
const hex = userUr.getPayloadHex();
console.log(hex);
// Output: a2626964187b646e616d65684a6f686e20446f65
```

#### `getPayloadCbor()`

Returns the payload in CBOR format.

Example:

```ts
const cbor = userUr.getPayloadCbor();
console.log(cbor);
// Output: Uint8Array([162, 98, 105, 100, 24, 123, 100, 110, 97, 109, 101, 104, 74, 111, 104, 110, 32, 68, 111, 101])
```

#### `toRegistryItem()`

Converts the UR instance back into a `RegistryItem`.

Example:

```ts
const registryItem = userUr.toRegistryItem();
console.log(registryItem.data);
// Output: { id: 123, name: 'John Doe' }
```

### Data Pipeline

The data pipeline is used to encode data into UR format and decode UR strings back into data. It consists of several stages: CBOR encoding, hex encoding, bytewords encoding, and UR encoding.

#### Encoding

For encoding data in UR, it goes through the following steps:

1. **[CBOR Encoding](https://cbor.io/)**: The data is encoded in CBOR format and converted to a binary representation.
2. **Hex Encoding**: The binary data is converted to a hexadecimal string.
3. **[Bytewords Encoding](https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2020-012-bytewords.md)**: The hexadecimal string is converted to a bytewords string, and a CRC32 checksum is added.
4. **[UR Encoding](https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2020-005-ur.md)**: The bytewords string is wrapped in a UR string.

#### Pipeline Example

1. **CBOR Encoding**:

```ts
const cborEncoded = UR.pipeline.encode(testPayload, { until: EncodingMethodName.hex });
```

**Result:**

```
new Uint8Array([162, 98, 105, 100, 24, 123, 100, 110, 97, 109, 101, 104, 74, 111, 104, 110, 32, 68, 111, 101])
```

**CBOR Commented:**

```
A2                     # map(2)
   62                  # text(2)
      6964             # "id"
   18 7B               # unsigned(123)
   64                  # text(4)
      6E616D65         # "name"
   68                  # text(8)
      4A6F686E20446F65 # "John Doe"
```

2. **Hex Encoding**:

```ts
const hexEncoded = UR.pipeline.encode(testPayload, { until: EncodingMethodName.bytewords });
```

```
a2626964187b646e616d65684a6f686e20446f65
```

3. **Bytewords Encoding**:

```ts
const bytewordsEncoded = UR.pipeline.encode(testPayload);
```

```
oeidiniecskgiejthsjnihisgejlisjtcxfyjlihjldnbwrl
```

4. **UR Encoding**:

```ts
const userUR = UR.fromBytewords({ type: "user", payload: bytewordsEncoded });
userUR.toString();
```

```
ur:user/oeidiniecskgiejthsjnihisgejlisjtcxfyjlihjldnbwrl
```

#### Decoding

When decoding, it will follow the reverse order in the pipeline.

1. **UR Decoding**
2. **Bytewords Decoding**
3. **Hex Decoding**
4. **CBOR Decoding**

#### Example

1. **UR Decoding**:

```ts
const ur = UR.fromString('ur:user/oeidiniecskgiejthsjnihisgejlisjtcxfyjlihjldnbwrl');
```

Getting bytewords from UR is easy:

```ts
const bytewords = ur.getPayloadBytewords();
```

```
oeidiniecskgiejthsjnihisgejlisjtcxfyjlihjldnbwrl
```

2. **Bytewords Decoding**:

```ts
const hexString = UR.pipeline.decode(bytewords, { until: EncodingMethodName.hex });
```

```
a2626964187b646e616d65684a6f686e20446f65
```

3. **Hex Decoding**:

```ts
const cborBuffer = UR.pipeline.decode(bytewords, { until: EncodingMethodName.cbor });
```

```
Uint8Array([162, 98, 105, 100, 24, 123, 100, 110, 97, 109, 101, 104, 74, 111, 104, 110, 32, 68, 111, 101])
```

4. **CBOR Decoding**:

```ts
const decoded = ur.decode();
```

Would give us:

```json
{"id": 123, "name": "John Doe"}
```

---

## Multipart UR (MUR) - Animated QR codes

Multipart URs use **Fountain Codes** to ensure reliable transmission of large datasets. They are needed when the data is too large to be transmitted in a single message or when the transmission medium is lossy, and some of the encoded symbols may be lost in transit. This is especially useful for passing big data like PSBT (Partially Signed Bitcoin Transactions) objects.

**Resources:**
- [Animated QR Codes](https://developer.blockchaincommons.com/animated-qrs/)
- [Multipart UR Research Paper](https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2024-001-multipart-ur.md)

### Quick Start

#### Encoding Multipart URs

```ts
import { UR, UrFountainEncoder } from '@ngraveio/bc-ur';

const testPayload = {
  "id": "123",
  "name": "John Doe"
};

const userUr = UR.fromData({ type: "user", payload: testPayload });
// Now we are going to create a fountain encoder which can generate an indefinite number of parts.
// Because the fountain encoder has a state, we need to create a new decoder for each new UR object
const encoder = new UrFountainEncoder(userUr, 5); // maxFragmentLength: 5

// Get all fragments at once
const fragments = encoder.getAllPartsUr(2); // Ratio of fountain parts compared to original parts

// [
//   ur:user/1-2/lpadaobbcyjldnbwrlgeoeidiniecskgiejthsjnykwlbbst
//   ur:user/2-2/lpaoaobbcyjldnbwrlgeihisgejlisjtcxfyjlihfmtnlaqz
//   ur:user/3-2/lpaxaobbcyjldnbwrlgeihisgejlisjtcxfyjlihwletaewp
//   ur:user/4-2/lpaaaobbcyjldnbwrlgeoeidiniecskgiejthsjnsbianlki
// ]

// For QR:

// Keep generating new parts, until a condition is met; for example, the user exits the page, or clicks "DONE"
while (!stop) {
  // get the next part in the sequence
  let part = encoder.nextPart().toString();

  // Get the UR string part that contains data from the original UR data
  // the part looks like this:
  // ur:user/3-2/lpaxaobbcyjldnbwrlgeihisgejlisjtcxfyjlihwletaewp

  displayPart(part);
}
```

#### Decoding Multipart URs

If you have all the parts, you can decode them into the original UR object at once:

```ts
import { UrFountainDecoder } from '@ngraveio/bc-ur';

// If we have all the fragments, we can decode them into the original UR object
const decoder = new UrFountainDecoder(fragments);
const resultUr = decoder.resultUr;
// 'ur:user/oeidiniecskgiejthsjnihisgejlisjtcxfyjlihjldnbwrl'
const decoded = resultUr.decode();
// {"id":123,"name":"John Doe"}
```

**FOR QR:**
For continuous decoding:

```ts
import { UrFountainDecoder } from '@ngraveio/bc-ur';

// Create the decoder object
const decoder = new UrFountainDecoder();

do {
  // Scan the part from a QRCode
  // the part should look like this:
  // ur:user/3-2/lpaxaobbcyjldnbwrlgeihisgejlisjtcxfyjlihwletaewp
  const part = scanQRCode();

  // Read the part and set expected type and fragment count
  decoder.receivePartUr(part);

  // check if all the necessary parts have been received to successfully decode the message

  // Display progress
  console.log(`Progress: ${decoder.getProgress() * 100}%`);
  console.log(`Estimated Completion: ${decoder.estimatedPercentComplete() * 100}%`);
} while (!decoder.isComplete());

// If no error has been found
if (decoder.isSuccessful()) {
  // Get the UR representation of the original single part UR
  const ur = decoder.resultUR;
  // decoder.resultUR.decode();
  // 'ur:user/oeidiniecskgiejthsjnihisgejlisjtcxfyjlihjldnbwrl'

  // Decode ur into the original data
  const decoded = decoder.getDecodedData();
  // {"id":123,"name":"John Doe"}

  // Reset decoder state so we can start reading a new UR
  decoder.reset();
} else {
  // log and handle the error
  console.log('Error found while decoding', decoder.error);
  handleError(decoder.error);
}
```

### Fountain Codes

Fountain codes are a class of erasure codes used in network communications. They generate an infinite number of encoded symbols from a given source symbol, allowing for reliable transmission even in lossy environments.

**Resources:**
- [Multipart UR Research Paper](https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2024-001-multipart-ur.md)

### API Details

The `UrFountainEncoder` and `UrFountainDecoder` classes provide methods for encoding and decoding Multipart URs. Below are the details and usage examples for these classes.

#### UrFountainEncoder

The `UrFountainEncoder` class is used to encode data into Multipart URs. It takes the following input values:

- `ur`: The UR instance to be encoded.
- `maxFragmentLength`: The maximum size of the CBOR data encoded in the UR. This determines the size of one UR, and the size of the QR code will increase depending on it. However, it is not the direct size; instead, more data is added on top of that size. Default is 100.
- `minFragmentLength`: The minimum size of the CBOR data encoded in the UR. Default is 10.
- `firstSeqNum`: The starting sequence number. The encoder will give you direct parts of the original UR until the sequence number reaches the total number of fragments. Then it will start to spit out mixed blocks or fragments using the fountain encoder. This ensures that you don't have to wait for the original part to repeat, and every next fountain part contains a few of the original parts. You can get lucky and decode the whole original payload without waiting to re-read all the parts again if you miss a QR code. Default is 0.

**Example Usage:**

```ts
import { UR, UrFountainEncoder } from '@ngraveio/bc-ur';

const testPayload = {
  "id": "123",
  "name": "John Doe"
};

const userUr = UR.fromData({ type: "user", payload: testPayload });
const encoder = new UrFountainEncoder(userUr, 5); // maxFragmentLength: 5, minFragmentLength: 10, firstSeqNum: 0

while (!stop) {
  let part = encoder.nextPart().toString();
  displayPart(part);
}
```

#### UrFountainDecoder

The `UrFountainDecoder` class is used to decode Multipart URs. It tracks the state of the decoder, including the parts that have been seen and decoded. When the first part is received, it sets the expected type and values. If subsequent parts do not match these expected values, they are skipped. To start decoding a new UR, you need to call the `reset` method.

**State Tracking:**

- `seenBlocks`: Bitmap array of seen blocks.
- `decodedBlocks`: Bitmap array of decoded blocks.
- `processedPartsCount`: Keeps track of how many parts have been processed.

**Example Usage:**

```ts
import { UrFountainDecoder } from '@ngraveio/bc-ur';

const decoder = new UrFountainDecoder();

do {
  const part = scanQRCode();
  decoder.receivePartUr(part);

  // Display progress
  console.log(`Progress: ${decoder.getProgress() * 100}%`);
  console.log(`Estimated Completion: ${decoder.estimatedPercentComplete() * 100}%`);
  console.log(`Decoded parts`, decoder.decodedBlocks);
} while (!decoder.isComplete());

if (decoder.isSuccessful()) {
  const ur = decoder.resultUR;
  const decoded = decoder.getDecodedData();
  decoder.reset();
} else {
  console.log('Error found while decoding', decoder.error);
  handleError(decoder.error);
}
```

**References:**
- [UrFountainEncoder.ts](./src/classes/UrFountainEncoder.ts)
- [UrFountainDecoder.ts](./src/classes/UrFountainDecoder.ts)
- [fountain.new.test.ts](./tests/fountain.new.test.ts)

---

## Technical Choices

### Dual Packaging

This library is distributed in two formats: **ESM (ECMAScript Module)** and **CommonJS (CJS)**. The default version is ESM, which is utilized in the examples provided above.

```
dist
├── esm
│   ├── index.js
│   ├── package.json
├── commonjs
│   ├── index.js
│   ├── package.json
└── package.json
```


Each `package.json` file within the subdirectories specifies the corresponding `type` property: `"module"` for ESM and `"commonjs"` for CJS. This enables Node.js to correctly interpret the file type based on the `.js` extension.

The **CommonJS** format is included for backward compatibility with older versions of Node.js. However, it is **not recommended** for use in browser environments.

Due to the library’s reliance on the **ESM-only** [CBOR2](https://github.com/hildjj/cbor2) library, the CommonJS version is created using **Rollup**. This process bundles the CBOR2 library into a single file and converts it to the CommonJS format.

To mitigate the [Dual Package Hazard](https://nodejs.org/docs/latest-v18.x/api/packages.html#dual-package-hazard), the ESM version of this library also uses a bundled version of the CBOR2 library. This ensures consistency by maintaining a single source of truth for CBOR tag definitions.

**Important Note:**
> Adding CBOR types via the CBOR2 library will not affect the BC-UR library, as the BC-UR library uses the bundled version of CBOR2.


More details about CBOR2 and dual packaging here: https://github.com/hildjj/cbor2/pull/57

---

### Libraries used
Because of compatibility issues with the original packages
 - `uint8array-extras` https://github.com/sindresorhus/uint8array-extras
 - `@keystonehq/alias-sampling` https://www.npmjs.com/package/@keystonehq/alias-sampling

 They are included in the source code of this project.

### React-Native
React native uses *commonjs* versions by default and its Hermes engine does not support `TextDecoder` as of (React Native 77) yet.
That is why we have `./src/index-react-native.ts` that includes a `TextDecoder` polyfill.

## Contributing

We welcome contributions to this project! Please follow these steps to contribute:

1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Make your changes and commit them with clear and concise messages.
4. Push your changes to your forked repository.
5. Create a pull request to the main repository.

Please ensure your code follows the project's coding standards and includes appropriate tests.

---

## Building the Project

You need to have Node.js **version 20** or higher installed on your system to *pack* the project.

- `yarn`
- `yarn build`
- `yarn test`
- `yarn pack`

The build is using Rollup to convert ESM only packages to CommonJS.
You will find those in
- `src/wrappers`:
  - `cbor2`

Rollup inject the ESM converted to CommonJs version of the CBOR2 library into the CommonJS version of the BC-UR library.

In order to prevent the dual package hazard, the ESM version of the BC-UR library is also using the bundled version of the CBOR2 library.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.


