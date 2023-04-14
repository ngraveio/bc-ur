import { Ur } from "../src/classes/Ur";
import { NgraveTranscoder } from "../src/classes/Transcoder";
import { makeCborUr, makeMessage, makeMessageUR } from "./utils";

describe("FountainDecoder", () => {
  const { fountainDecoderCreator, fountainEncoderCreator } =
    new NgraveTranscoder();

    test("Should be able to encode/decode when the payload is an object", () => {
      const ur = new Ur({text: "hello world"});;
      const fountainEncoder = fountainEncoderCreator(ur);
      const fountainDecoder = fountainDecoderCreator();
  
      do {
        const part = fountainEncoder.nextPart();
        fountainDecoder.receivePart(part);
      } while (!fountainDecoder.isUrDecoderCompleteOrHasError());
  
      expect(fountainDecoder.isSuccess()).toEqual(true);
      const result = fountainDecoder.getUrResult();
      expect(result.payload).toEqual(ur.payload)
    });

    test("Should be able to encode/decode a simple string with default values", () => {
      const ur = new Ur("thisIsATest");;
      const fountainEncoder = fountainEncoderCreator(ur);
      const fountainDecoder = fountainDecoderCreator();
  
      do {
        const part = fountainEncoder.nextPart();
        fountainDecoder.receivePart(part);
      } while (!fountainDecoder.isUrDecoderCompleteOrHasError());
  
      expect(fountainDecoder.isSuccess()).toEqual(true);
      const result = fountainDecoder.getUrResult();
      expect(result.payload).toEqual(ur.payload)
    });
  test("Should be able to encode/decode a text", () => {
    const testUr = new Ur(`The standard Lorem Ipsum passage, used since the 1500s
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
    
    Section 1.10.32 of "de Finibus Bonorum et Malorum", written by Cicero in 45 BC
    "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?"
    
    1914 translation by H. Rackham
    "But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system, and expound the actual teachings of the great explorer of the truth, the master-builder of human happiness. No one rejects, dislikes, or avoids pleasure itself, because it is pleasure, but because those who do not know how to pursue pleasure rationally encounter consequences that are extremely painful. Nor again is there anyone who loves or pursues or desires to obtain pain of itself, because it is pain, but because occasionally circumstances occur in which toil and pain can procure him some great pleasure. To take a trivial example, which of us ever undertakes laborious physical exercise, except to obtain some advantage from it? But who has any right to find fault with a man who chooses to enjoy a pleasure that has no annoying consequences, or one who avoids a pain that produces no resultant pleasure?"
    
    Section 1.10.33 of "de Finibus Bonorum et Malorum", written by Cicero in 45 BC
    "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat."
    
    1914 translation by H. Rackham
    "On the other hand, we denounce with righteous indignation and dislike men who are so beguiled and demoralized by the charms of pleasure of the moment, so blinded by desire, that they cannot foresee the pain and trouble that are bound to ensue; and equal blame belongs to those who fail in their duty through weakness of will, which is the same as saying through shrinking from toil and pain. These cases are perfectly simple and easy to distinguish. In a free hour, when our power of choice is untrammelled and when nothing prevents our being able to do what we like best, every pleasure is to be welcomed and every pain avoided. But in certain circumstances and owing to the claims of duty or the obligations of business it will frequently occur that pleasures have to be repudiated and annoyances accepted. The wise man therefore always holds in these matters to this principle of selection: he rejects pleasures to secure other greater pleasures, or else he endures pains to avoid worse pains."`,{type: "test"});
    const maxFragmentLength = 500;
    const fountainEncoder = fountainEncoderCreator(testUr, maxFragmentLength);
    const fountainDecoder = fountainDecoderCreator();
    do {
      const part = fountainEncoder.nextPart();
      fountainDecoder.receivePart(part);
    } while (!fountainDecoder.isUrDecoderCompleteOrHasError());

    expect(fountainDecoder.isSuccess()).toEqual(true);
    expect(fountainDecoder.getDecodedResult()).toEqual(testUr);
  });
  test('Should be able to encode/decode a buffer with a small fragment length', () => {
    const message = makeMessage(30);
    const ur = new Ur(message);
    const maxFragmentLength = 1;
    const fountainEncoder = fountainEncoderCreator(ur, maxFragmentLength,maxFragmentLength);
    const fountainDecoder = fountainDecoderCreator();

    do {
      const part = fountainEncoder.nextPart();
      fountainDecoder.receivePart(part);
    } while (!fountainDecoder.isUrDecoderCompleteOrHasError())

    expect(fountainDecoder.isSuccess()).toBe(true);
    expect(fountainDecoder.getDecodedResult()).toEqual(ur);
  });
  test("Should be able to encode/decode a buffer", () => {
    const ur = makeCborUr(250);
    const maxFragmentLength = 50;
    const fountainEncoder = fountainEncoderCreator(ur, maxFragmentLength);
    const fountainDecoder = fountainDecoderCreator();

    do {
      const part = fountainEncoder.nextPart();
      fountainDecoder.receivePart(part);
    } while (!fountainDecoder.isUrDecoderCompleteOrHasError());

    expect(fountainDecoder.isSuccess()).toEqual(true);
    expect(fountainDecoder.getDecodedResult()).toEqual(ur);
    const result = fountainDecoder.getUrResult();
    expect(result).toEqual(ur)
  });
  test("Should keep the registryType while decoding", () => {
    const test = makeCborUr(250, { type: "custom-crypto" });
    const maxFragmentLength = 100;
    const fountainEncoder = fountainEncoderCreator(test, maxFragmentLength);
    const fountainDecoder = fountainDecoderCreator();

    do {
      const part = fountainEncoder.nextPart();
      fountainDecoder.receivePart(part);
    } while (!fountainDecoder.isUrDecoderCompleteOrHasError());

    expect(fountainDecoder.isSuccess()).toEqual(true);
    const decoded = fountainDecoder.getDecodedResult();
    const decodedUR = Ur.fromUr(decoded.payload, {...decoded.registryType});
    expect(decodedUR.type).toEqual(test.registryType.type);
    expect(decodedUR.payload).toEqual(test.payload);
  });
});
