import { makeMessage } from "../src/helpers/utils.js";
import { InvalidChecksumError } from "../src/errors.js";

import { registryItemFactory } from "../src/classes/RegistryItem";
import { UrRegistry } from "../src/registry";

import { UrFountainEncoder } from "../src/classes/UrFountainEncoder";
import { UrFountainDecoder } from "../src/classes/UrFountainDecoder";
import { UR } from "../src/classes/UR.js";

export class MockRegistryItem extends registryItemFactory({
  tag: 998,
  URType: "custom1",
  CDDL: ``,
}) {}

export class MockRegistryItem2 extends registryItemFactory({
  tag: 999,
  URType: "custom2",
  CDDL: ``,
}) {}

describe("Fountain Transcoder", () => {
  beforeAll(() => {
    // Add the MockRegistryItem to the registry
    UrRegistry.addItem(MockRegistryItem);
    UrRegistry.addItem(MockRegistryItem2);
  });

  afterAll(() => {
    // Clear the registry
    UrRegistry.removeItem(MockRegistryItem);
    UrRegistry.removeItem(MockRegistryItem2);
  });

  describe("FountainUrTranscoder", () => {
    test("should create 3 fragments when payloadlength is 13 and min/max fragment size is 5, with default redundancy of 0", () => {
      const registryItem = new MockRegistryItem({ name: "Pieter" });
      const fragmentLength = 5;
      const fountainEncoder = new UrFountainEncoder(registryItem, fragmentLength, fragmentLength);

      const payloadLength = fountainEncoder._messageLength;
      const expectedFragmentLength = Math.ceil(payloadLength / fragmentLength);

      const fountainFragments = fountainEncoder.getAllPartsUr();
      expect(fountainFragments.length).toEqual(expectedFragmentLength);
    });
    test("should have twice the amount of fragments for a ratio of 1", () => {
      const registryItem = new MockRegistryItem({ name: "Pieter" });
      const fragmentLength = 5;
      const fountainEncoder = new UrFountainEncoder(
        registryItem,
        fragmentLength,
        fragmentLength
      );

      const ratio = 1;
      const payloadLength = fountainEncoder._messageLength;
      const expectedFragmentLength = Math.ceil(payloadLength / fragmentLength) * 2;

      const fountainFragments = fountainEncoder.getAllPartsUr(ratio);
      expect(fountainFragments.length).toEqual(expectedFragmentLength);
    });
    test.only("should be able to fountain encode/decode the payload", () => {
      const registryItem = new MockRegistryItem({ name: "Pieter" });
      
      const fountainEncoder = new UrFountainEncoder(registryItem, 10, 5);
      const fountainFragments = fountainEncoder.getAllPartsUr();

      const fountainDecoder = new UrFountainDecoder(fountainFragments);
      const decoded = fountainDecoder.resultUr.decode();

      expect(decoded.data).toEqual(registryItem.data);
    });
    test("should be able to fountain encode/decode the payload with a small maxFragmentLength", () => {
      const message = makeMessage(30);
      const registryItem = new MockRegistryItem(message);
      const maxFragmentLength = 1;
      const fountainEncoder = new UrFountainEncoder(
        registryItem,
        maxFragmentLength,
        maxFragmentLength
      );
      
      const fountainFragments = fountainEncoder.getAllPartsUr();
      
      const fountainDecoder = new UrFountainDecoder(fountainFragments);
      const decoded = fountainDecoder.resultUr.decode();

      expect(decoded.data).toEqual(registryItem.data);
    });

    test("should be able to encode and decode cbor payload", () => {
      const message = makeMessage(250);
      const registryItem = new MockRegistryItem(message);
      const fountainEncoder = new UrFountainEncoder(registryItem, 50, 5, 5);
      
      const fountainFragments = fountainEncoder.getAllPartsUr(5);
      
      const fountainDecoder = new UrFountainDecoder(fountainFragments);
      const decoded = fountainDecoder.resultUr.decode();

      expect(decoded.data).toEqual(registryItem.data);
    });
  });

  describe("FountainEncoder", () => {

    describe("finds fragment length", () => {
      const registryItem = new MockRegistryItem(null);
      const fountainEncoder = new UrFountainEncoder(registryItem);

      const messageLength = 12345;
      const minFragmentLength = 1005;
      const maxFragmentLength = 1955;
      const fragmentLength = fountainEncoder.fragmentLenghtFinder(
        messageLength,
        maxFragmentLength,
        minFragmentLength,
      );

      test("fragments are within bounds", () => {
        expect(fragmentLength).toBeLessThan(maxFragmentLength);
        expect(fragmentLength).toBeGreaterThan(minFragmentLength);
      });
      test("last fragment is within bounds", () => {
        expect(messageLength % fragmentLength).toBeGreaterThan(
          minFragmentLength
        );
        expect(messageLength % fragmentLength).toBeLessThan(maxFragmentLength);
      });
    });

    test("is complete", () => {
      const message = makeMessage(256);
      const registryItem = new MockRegistryItem(message);

      const encoder = new UrFountainEncoder(registryItem, 30);
      let generatedParts = 0;
      let part: UR;

      while (!encoder.isComplete()) {
        part = encoder.nextPartUr();
        generatedParts += 1;
      }

      //@ts-ignore
      expect(part.seqLength).toBe(generatedParts);
    });

    test("using nextpart keeps generating multipart Ur's", () => {
      const registryItem = new MockRegistryItem({ name: "Pieter" });

      const fountainEncoder = new UrFountainEncoder(registryItem, 10, 10);
      const count = 10;
      const parts: UR[] = [];
      for (let index = 0; index < count; index++) {
        const part = fountainEncoder.nextPartUr();
        parts.push(part);
      }
      expect(parts.length).toEqual(count);
      
      const fountainDecoder = new UrFountainDecoder(parts);
      const decoded = fountainDecoder.resultUr.decode();
      expect(decoded.data).toEqual(registryItem.data);
    });
    test("encoded ur should be equal to input ur", () => {
      const registryItem = new MockRegistryItem({ name: "Pieter" });
      const fountainEncoder = new UrFountainEncoder(registryItem, 10, 10);
      const parts: UR[] = [];
      
      const minimumCount = fountainEncoder.getPureFragmentCount();
      
      for (let index = 0; index < minimumCount; index++) {
        const part = fountainEncoder.nextPartUr();
        parts.push(part);
      }
      
      const fountainDecoder = new UrFountainDecoder(parts);
      const decoded = fountainDecoder.resultUr.decode();

      expect(decoded.data).toEqual(registryItem.data);
      expect(decoded.type.URType).toEqual(registryItem.type.URType);
      expect(decoded.type.tag).toEqual(registryItem.type.tag);
    });

    test("should not be able to decode when the generated fragments are too little", () => {
      const registryItem = new MockRegistryItem({ name: "Pieter" });
      const fountainEncoder = new UrFountainEncoder(registryItem, 5, 5);
      const count = 1;
      const parts: UR[] = [];
      
      for (let index = 0; index < count; index++) {
        const part = fountainEncoder.nextPartUr();
        parts.push(part);
      }

      const decoder = new UrFountainDecoder(parts);
      expect(decoder.done).toEqual(false);
    });
  });

  describe("FountainDecoder", () => {

    test("Should be able to encode/decode when the payload is an object", () => {
      const registryItem = new MockRegistryItem({
        text: "hello world",
      });

      const fountainEncoder = new UrFountainEncoder(registryItem);
      const fountainDecoder = new UrFountainDecoder();

      do {
        const part = fountainEncoder.nextPartUr();
        fountainDecoder.receivePartUr(part);
      } while (!fountainDecoder.done);

      expect(fountainDecoder.isSuccessful()).toEqual(true);
      const result = fountainDecoder.getDecodedData();
      expect(result.data).toEqual(registryItem.data);
    });

    test("fountainEncoder nextPartUr() should restart at seqNum 1 when the seqnum is bigger than uint32", () => {
      const registryItem = new MockRegistryItem({ name: "Pieter" });

      let _seqNum = 4294967295; // Maximum value for uint32
      const fountainEncoder = new UrFountainEncoder(
        registryItem,
        10,
        10,
        _seqNum
      );

      const part1 = fountainEncoder.nextPartUr();
      const part2 = fountainEncoder.nextPartUr();

      expect(part1.seqNum).toBe(1);
      expect(part2.seqNum).toBe(2);
    });

    test("Should be able to encode/decode a simple string with default values", () => {
      const registryItem = new MockRegistryItem("thisIsATest");
      const fountainEncoder = new UrFountainEncoder(registryItem);
      const fountainDecoder = new UrFountainDecoder();

      do {
        const part = fountainEncoder.nextPartUr();
        fountainDecoder.receivePartUr(part);
      } while (!fountainDecoder.done);

      expect(fountainDecoder.isSuccessful()).toEqual(true);
      const result = fountainDecoder.getDecodedData();
      expect(result.data).toEqual(registryItem.data);
    });
    test("Should be able to encode/decode a text", () => {
      const message = `The standard Lorem Ipsum passage, used since the 1500s
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
    
    Section 1.10.32 of "de Finibus Bonorum et Malorum", written by Cicero in 45 BC
    "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?"
    
    1914 translation by H. Rackham
    "But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system, and expound the actual teachings of the great explorer of the truth, the master-builder of human happiness. No one rejects, dislikes, or avoids pleasure itself, because it is pleasure, but because those who do not know how to pursue pleasure rationally encounter consequences that are extremely painful. Nor again is there anyone who loves or pursues or desires to obtain pain of itself, because it is pain, but because occasionally circumstances occur in which toil and pain can procure him some great pleasure. To take a trivial example, which of us ever undertakes laborious physical exercise, except to obtain some advantage from it? But who has any right to find fault with a man who chooses to enjoy a pleasure that has no annoying consequences, or one who avoids a pain that produces no resultant pleasure?"
    
    Section 1.10.33 of "de Finibus Bonorum et Malorum", written by Cicero in 45 BC
    "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat."
    
    1914 translation by H. Rackham
    "On the other hand, we denounce with righteous indignation and dislike men who are so beguiled and demoralized by the charms of pleasure of the moment, so blinded by desire, that they cannot foresee the pain and trouble that are bound to ensue; and equal blame belongs to those who fail in their duty through weakness of will, which is the same as saying through shrinking from toil and pain. These cases are perfectly simple and easy to distinguish. In a free hour, when our power of choice is untrammelled and when nothing prevents our being able to do what we like best, every pleasure is to be welcomed and every pain avoided. But in certain circumstances and owing to the claims of duty or the obligations of business it will frequently occur that pleasures have to be repudiated and annoyances accepted. The wise man therefore always holds in these matters to this principle of selection: he rejects pleasures to secure other greater pleasures, or else he endures pains to avoid worse pains."`;
      const registryItem = new MockRegistryItem(message);
      const maxFragmentLength = 500;
      const fountainEncoder = new UrFountainEncoder(
        registryItem,
        maxFragmentLength
      );
      const fountainDecoder = new UrFountainDecoder();
      do {
        const part = fountainEncoder.nextPartUr();
        fountainDecoder.receivePartUr(part);
      } while (!fountainDecoder.done);

      expect(fountainDecoder.isSuccessful()).toEqual(true);
      expect(fountainDecoder.getDecodedData().data).toEqual(
        registryItem.data
      );
    });
    test("Should be able to encode/decode a text even if it's passed in a single ur", () => {
      const message = `The standard Lorem Ipsum passage, used since the 1500s
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
    
    Section 1.10.32 of "de Finibus Bonorum et Malorum", written by Cicero in 45 BC
    "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?"
    
    1914 translation by H. Rackham
    "But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system, and expound the actual teachings of the great explorer of the truth, the master-builder of human happiness. No one rejects, dislikes, or avoids pleasure itself, because it is pleasure, but because those who do not know how to pursue pleasure rationally encounter consequences that are extremely painful. Nor again is there anyone who loves or pursues or desires to obtain pain of itself, because it is pain, but because occasionally circumstances occur in which toil and pain can procure him some great pleasure. To take a trivial example, which of us ever undertakes laborious physical exercise, except to obtain some advantage from it? But who has any right to find fault with a man who chooses to enjoy a pleasure that has no annoying consequences, or one who avoids a pain that produces no resultant pleasure?"
    
    Section 1.10.33 of "de Finibus Bonorum et Malorum", written by Cicero in 45 BC
    "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat."
    
    1914 translation by H. Rackham
    "On the other hand, we denounce with righteous indignation and dislike men who are so beguiled and demoralized by the charms of pleasure of the moment, so blinded by desire, that they cannot foresee the pain and trouble that are bound to ensue; and equal blame belongs to those who fail in their duty through weakness of will, which is the same as saying through shrinking from toil and pain. These cases are perfectly simple and easy to distinguish. In a free hour, when our power of choice is untrammelled and when nothing prevents our being able to do what we like best, every pleasure is to be welcomed and every pain avoided. But in certain circumstances and owing to the claims of duty or the obligations of business it will frequently occur that pleasures have to be repudiated and annoyances accepted. The wise man therefore always holds in these matters to this principle of selection: he rejects pleasures to secure other greater pleasures, or else he endures pains to avoid worse pains."`;
      const registryItem = new MockRegistryItem(message);
      const singleEncodedUR = registryItem.toUr();
      const fountainDecoder = new UrFountainDecoder();
      do {
        fountainDecoder.receivePartUr(singleEncodedUR);
      } while (!fountainDecoder.done);

      expect(fountainDecoder.isSuccessful()).toEqual(true);
      expect(fountainDecoder.getDecodedData().data).toEqual(
        registryItem.data
      );
    });
    test("Should accept a simple ur", () => {
      const message = makeMessage(30);
      const registryItem = new MockRegistryItem(message);
      const singleEncodedUR = registryItem.toUr();
      const fountainDecoder = new UrFountainDecoder();

      fountainDecoder.receivePartUr(singleEncodedUR);
      expect(fountainDecoder.done).toEqual(true);
    });
    test("Should be able to encode/decode a buffer", () => {
      const message = makeMessage(250);
      const registryItem = new MockRegistryItem(message);
      const singleEncodedUR = registryItem.toUr();
      const fountainDecoder = new UrFountainDecoder();

      do {
        fountainDecoder.receivePartUr(singleEncodedUR);
      } while (!fountainDecoder.done);

      expect(fountainDecoder.isSuccessful()).toEqual(true);
      expect(fountainDecoder.getDecodedData().data).toEqual(
        registryItem.data
      );
    });
    test("Should be able to encode/decode a buffer with a small fragment length", () => {
      const message = makeMessage(30);
      const registryItem = new MockRegistryItem(message);
      const maxFragmentLength = 1;
      const fountainEncoder = new UrFountainEncoder(
        registryItem,
        maxFragmentLength,
        maxFragmentLength
      );
      const fountainDecoder = new UrFountainDecoder();

      do {
        const part = fountainEncoder.nextPartUr();
        fountainDecoder.receivePartUr(part);
      } while (!fountainDecoder.done);

      expect(fountainDecoder.isSuccessful()).toBe(true);
      expect(fountainDecoder.getDecodedData().data).toEqual(
        registryItem.data
      );
    });
    test("Should be able to encode/decode a buffer", () => {
      const message = makeMessage(250);
      const registryItem = new MockRegistryItem(message);
      const maxFragmentLength = 50;
      const fountainEncoder = new UrFountainEncoder(
        registryItem,
        maxFragmentLength
      );
      const fountainDecoder = new UrFountainDecoder();

      do {
        const part = fountainEncoder.nextPartUr();
        fountainDecoder.receivePartUr(part);
      } while (!fountainDecoder.done);

      expect(fountainDecoder.isSuccessful()).toEqual(true);
      expect(fountainDecoder.getDecodedData().data).toEqual(
        registryItem.data
      );
    });
    test("Should keep the registryType while decoding", () => {
      const message = makeMessage(250);
      const registryItem = new MockRegistryItem(message);
      const maxFragmentLength = 100;
      const fountainEncoder = new UrFountainEncoder(
        registryItem,
        maxFragmentLength
      );
      const fountainDecoder = new UrFountainDecoder();

      do {
        const part = fountainEncoder.nextPartUr();
        fountainDecoder.receivePartUr(part);
      } while (!fountainDecoder.done);

      expect(fountainDecoder.isSuccessful()).toEqual(true);
      const decodedUR = fountainDecoder.getDecodedData();
      expect(decodedUR.type).toEqual(registryItem.type);
      expect(decodedUR.data).toEqual(registryItem.data);
    });
  });

  describe("GetProgress", () => {
    test("Should get the expected and recieved parts as an array of indexes", () => {
      const message = makeMessage(300);
      const registryItem = new MockRegistryItem(message);
      //Will generate 4 parts, based on the 300 sized message and additional ur characters
      const fountainEncoder = new UrFountainEncoder(registryItem, 100, 10);
      const fountainDecoder = new UrFountainDecoder();

      for (let index = 0; index <= 1; index++) {
        const part = fountainEncoder.nextPartUr();
        fountainDecoder.receivePartUr(part);
      }

      // const expected = fountainDecoder.getExpectedPartIndexes();
      const received = fountainDecoder.decodedBlocks;
      const progressPercentage = fountainDecoder.getProgress();

      // expect(expected).toEqual([0, 1, 2, 3]);
      expect(received).toEqual([1, 1, 0, 0]);
      expect(progressPercentage).toEqual(0.5);
    });
  });

  describe("Passing wrong encoded data into the FountainDecoder", () => {

    test("Should ignore ur parts that have a different ur type", () => {
      const registryItem = new MockRegistryItem(makeMessage(40));
      const registryItem2 = new MockRegistryItem2(makeMessage(20));
      const differentFragments = new UrFountainEncoder(registryItem2, 5, 5).getAllPartsUr();

      const fountainEncoder = new UrFountainEncoder(registryItem, 5, 5);
      const fountainDecoder = new UrFountainDecoder();

      for (
        let index = 0;
        !fountainDecoder.done;
        index++
      ) {
        let part;
        if (index < 2 || !differentFragments[index]) {
          part = fountainEncoder.nextPartUr();
        } else if (!!differentFragments[index]) {
          part = differentFragments[index];
        }
        fountainDecoder.receivePartUr(part);
      }
      const result = fountainDecoder.getDecodedData();
      expect(result.data).toEqual(registryItem.data);
    });
    test("Should ignore ur parts that have a different sequenceLength then the first read QR code", () => {
      const registryItem = new MockRegistryItem(makeMessage(40));
      const registryItem2 = new MockRegistryItem(makeMessage(20));
      const differentFragments = new UrFountainEncoder(registryItem2, 5, 5).getAllPartsUr();
      const fountainEncoder = new UrFountainEncoder(registryItem, 5, 5);
      const fountainDecoder = new UrFountainDecoder();

      for (
        let index = 0;
        !fountainDecoder.done;
        index++
      ) {
        let part;
        if (index < 2 || !differentFragments[index]) {
          part = fountainEncoder.nextPartUr();
        } else if (!!differentFragments[index]) {
          part = differentFragments[index];
        }
        fountainDecoder.receivePartUr(part);
      }
      const result = fountainDecoder.getDecodedData();
      expect(result.data).toEqual(registryItem.data);
    });
    test("Should ignore ur parts that have a different payload then the first read QR code. This is checked by the checksum", () => {
      const registryItem = new MockRegistryItem(makeMessage(40));
      const registryItem2 = new MockRegistryItem(makeMessage(40, "Pieter"));
      const differentFragments = new UrFountainEncoder(registryItem2, 5, 5).getAllPartsUr();
      const fountainEncoder = new UrFountainEncoder(registryItem, 5, 5);
      const fountainDecoder = new UrFountainDecoder();

      for (
        let index = 0;
        !fountainDecoder.done;
        index++
      ) {
        let part;
        if (index < 2 || !differentFragments[index]) {
          part = fountainEncoder.nextPartUr();
        } else if (!!differentFragments[index]) {
          part = differentFragments[index];
        }
        fountainDecoder.receivePartUr(part);
      }
      const result = fountainDecoder.getDecodedData();
      expect(result.data).toEqual(registryItem.data);
    });
    test("Should ignore ur parts of the second ur, that have a different ur types and return the correct result", () => {
      const registryItem = new MockRegistryItem(makeMessage(40));
      const registryItem2 = new MockRegistryItem2(makeMessage(20));

      const fountainEncoder = new UrFountainEncoder(registryItem, 5, 5);
      const fragments1 = fountainEncoder.getAllPartsUr();
      const fragments2 = fountainEncoder.getAllPartsUr(2);
      // insert elements of the second ur fragments into the first one
      fragments1.splice(1, 0, ...fragments2.slice(0, 3));
      
      const fountainDecoder = new UrFountainDecoder(fragments1);
      const result = fountainDecoder.resultUr.decode();

      expect(result.data).toEqual(registryItem.data);
    });
  });
});
