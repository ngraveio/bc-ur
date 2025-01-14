import { makeMessage } from "../src/helpers/utils";
import { uint8ArrayToHex } from "uint8array-extras";
import { Ur } from "../src/new_classes/Ur";
import { FountainEncoder } from "../src/new_classes/FountainEncoder"
import { FountainDecoder } from "../src/new_classes/FountainDecoder"
import { UrFountainEncoder } from "../src/new_classes/UrFountainEncoder";
import { UrFountainDecoder } from "../src/new_classes/UrFountainDecoder";


function make_message_ur(len: number, seed?: string): Ur {
  const message = makeMessage(len, seed);
  // Encode this bytes as cbor then as bytewords
  const ur = Ur.fromData({type: "bytes", payload: message});
  return ur;
}

describe("Fountain Encoder", () => {

  const expectedParts = [
    "8501091901001a0167aa07581d916ec65cf77cadf55cd7f9cda1a1030026ddd42e905b77adc36e4f2d3c",
    "8502091901001a0167aa07581dcba44f7f04f2de44f42d84c374a0e149136f25b01852545961d55f7f7a",
    "8503091901001a0167aa07581d8cde6d0e2ec43f3b2dcb644a2209e8c9e34af5c4747984a5e873c9cf5f",
    "8504091901001a0167aa07581d965e25ee29039fdf8ca74f1c769fc07eb7ebaec46e0695aea6cbd60b3e",
    "8505091901001a0167aa07581dc4bbff1b9ffe8a9e7240129377b9d3711ed38d412fbb4442256f1e6f59",
    "8506091901001a0167aa07581d5e0fc57fed451fb0a0101fb76b1fb1e1b88cfdfdaa946294a47de8fff1",
    "8507091901001a0167aa07581d73f021c0e6f65b05c0a494e50791270a0050a73ae69b6725505a2ec8a5",
    "8508091901001a0167aa07581d791457c9876dd34aadd192a53aa0dc66b556c0c215c7ceb8248b717c22",
    "8509091901001a0167aa07581d951e65305b56a3706e3e86eb01c803bbf915d80edcd64d4d0000000000",
    "850a091901001a0167aa07581d330f0f33a05eead4f331df229871bee733b50de71afd2e5a79f196de09",
    "850b091901001a0167aa07581d3b205ce5e52d8c24a52cffa34c564fa1af3fdffcd349dc4258ee4ee828",
    "850c091901001a0167aa07581ddd7bf725ea6c16d531b5f03254783803048ca08b87148daacd1cd7a006",
    "850d091901001a0167aa07581d760be7ad1c6187902bbc04f539b9ee5eb8ea6833222edea36031306c01",
    "850e091901001a0167aa07581d5bf4031217d2c3254b088fa7553778b5003632f46e21db129416f65b55",
    "850f091901001a0167aa07581d73f021c0e6f65b05c0a494e50791270a0050a73ae69b6725505a2ec8a5",
    "8510091901001a0167aa07581db8546ebfe2048541348910267331c643133f828afec9337c318f71b7df",
    "8511091901001a0167aa07581d23dedeea74e3a0fb052befabefa13e2f80e4315c9dceed4c8630612e64",
    "8512091901001a0167aa07581dd01a8daee769ce34b6b35d3ca0005302724abddae405bdb419c0a6b208",
    "8513091901001a0167aa07581d3171c5dc365766eff25ae47c6f10e7de48cfb8474e050e5fe997a6dc24",
    "8514091901001a0167aa07581de055c2433562184fa71b4be94f262e200f01c6f74c284b0dc6fae6673f"
  ]  


  test("should encode a message", () => {
    const message = makeMessage(100);
    expect(message).toBeDefined();
  });


  test("Buffer encoder", () => {
    const message = makeMessage(256);
    const mesHex = uint8ArrayToHex(message);

    const encoder = new FountainEncoder(message, 30);
    let fragments:string[] = []
    // Call encoder.nextPart() for 20 times
    for (let i = 0; i < 20; i++) {
      const fragment = encoder.nextPart();
      const hex = uint8ArrayToHex(fragment);
      fragments.push(hex);
    }


    expect(fragments).toEqual(expectedParts);
  })


});

describe("Fountain Encoder Ur", () => {

  const expectedPartsUr = [
    "ur:bytes/1-9/lpadascfadaxcywenbpljkhdcahkadaemejtswhhylkepmykhhtsytsnoyoyaxaedsuttydmmhhpktpmsrjtdkgslpgh",
    "ur:bytes/2-9/lpaoascfadaxcywenbpljkhdcagwdpfnsboxgwlbaawzuefywkdplrsrjynbvygabwjldapfcsgmghhkhstlrdcxaefz",
    "ur:bytes/3-9/lpaxascfadaxcywenbpljkhdcahelbknlkuejnbadmssfhfrdpsbiegecpasvssovlgeykssjykklronvsjksopdzmol",
    "ur:bytes/4-9/lpaaascfadaxcywenbpljkhdcasotkhemthydawydtaxneurlkosgwcekonertkbrlwmplssjtammdplolsbrdzcrtas",
    "ur:bytes/5-9/lpahascfadaxcywenbpljkhdcatbbdfmssrkzmcwnezelennjpfzbgmuktrhtejscktelgfpdlrkfyfwdajldejokbwf",
    "ur:bytes/6-9/lpamascfadaxcywenbpljkhdcackjlhkhybssklbwefectpfnbbectrljectpavyrolkzczcpkmwidmwoxkilghdsowp",
    "ur:bytes/7-9/lpatascfadaxcywenbpljkhdcavszmwnjkwtclrtvaynhpahrtoxmwvwatmedibkaegdosftvandiodagdhthtrlnnhy",
    "ur:bytes/8-9/lpayascfadaxcywenbpljkhdcadmsponkkbbhgsoltjntegepmttmoonftnbuoiyrehfrtsabzsttorodklubbuyaetk",
    "ur:bytes/9-9/lpasascfadaxcywenbpljkhdcajskecpmdckihdyhphfotjojtfmlnwmadspaxrkytbztpbauotbgtgtaeaevtgavtny",
    "ur:bytes/10-9/lpbkascfadaxcywenbpljkhdcahkadaemejtswhhylkepmykhhtsytsnoyoyaxaedsuttydmmhhpktpmsrjtwdkiplzs",
    "ur:bytes/11-9/lpbdascfadaxcywenbpljkhdcahelbknlkuejnbadmssfhfrdpsbiegecpasvssovlgeykssjykklronvsjkvetiiapk",
    "ur:bytes/12-9/lpbnascfadaxcywenbpljkhdcarllaluzmdmgstospeyiefmwejlwtpedamktksrvlcygmzemovovllarodtmtbnptrs",
    "ur:bytes/13-9/lpbtascfadaxcywenbpljkhdcamtkgtpknghchchyketwsvwgwfdhpgmgtylctotzopdrpayoschcmhplffziachrfgd",
    "ur:bytes/14-9/lpbaascfadaxcywenbpljkhdcapazewnvonnvdnsbyleynwtnsjkjndeoldydkbkdslgjkbbkortbelomueekgvstegt",
    "ur:bytes/15-9/lpbsascfadaxcywenbpljkhdcaynmhpddpzmversbdqdfyrehnqzlugmjzmnmtwmrouohtstgsbsahpawkditkckynwt",
    "ur:bytes/16-9/lpbeascfadaxcywenbpljkhdcawygekobamwtlihsnpalnsghenskkiynthdzotsimtojetprsttmukirlrsbtamjtpd",
    "ur:bytes/17-9/lpbyascfadaxcywenbpljkhdcamklgftaxykpewyrtqzhydntpnytyisincxmhtbceaykolduortotiaiaiafhiaoyce",
    "ur:bytes/18-9/lpbgascfadaxcywenbpljkhdcahkadaemejtswhhylkepmykhhtsytsnoyoyaxaedsuttydmmhhpktpmsrjtntwkbkwy",
    "ur:bytes/19-9/lpbwascfadaxcywenbpljkhdcadekicpaajootjzpsdrbalpeywllbdsnbinaerkurspbncxgslgftvtsrjtksplcpeo",
    "ur:bytes/20-9/lpbbascfadaxcywenbpljkhdcayapmrleeleaxpasfrtrdkncffwjyjzgyetdmlewtkpktgllepfrltataztksmhkbot"
  ];  

  test("single part UR", () => {
    const myUr = make_message_ur(50);
    const expected = "ur:bytes/hdeymejtswhhylkepmykhhtsytsnoyoyaxaedsuttydmmhhpktpmsrjtgwdpfnsboxgwlbaawzuefywkdplrsrjynbvygabwjldapfcsdwkbrkch";

    expect(myUr.toString()).toEqual(expected);
  });

  test("Single part Ur with Fountain UR", () => {
    const expected = "ur:bytes/hdeymejtswhhylkepmykhhtsytsnoyoyaxaedsuttydmmhhpktpmsrjtgwdpfnsboxgwlbaawzuefywkdplrsrjynbvygabwjldapfcsdwkbrkch";
    const myUr = make_message_ur(50);

    const encoder = new UrFountainEncoder(myUr);
    const fragment = encoder.nextPartUr();

    expect(encoder.isSinglePart()).toBeTruthy();
    // expect(encoder.isComplete()).toBeTruthy();

    expect(fragment.toString()).toEqual(expected);
  });

  test("fountain UR", () => {
    const myUr = make_message_ur(256);
    const encoder = new UrFountainEncoder(myUr, 30);

    let fragments:string[] = []
    // Call encoder.nextPart() for 20 times
    for (let i = 0; i < 20; i++) {
      const fragment = encoder.nextPartUr();
      fragments.push(fragment.toString());
    }

    expect(fragments).toEqual(expectedPartsUr);
  });

});

describe("Fountain Decoder", () => {

  test("should decode a message", () => {
    const messageSize = 32767
    const maxFragmentLen = 1000    
    const message = makeMessage(messageSize);

    const encoder = new FountainEncoder(message, maxFragmentLen, undefined, 30);
    const decoder = new FountainDecoder();

    let counter = 0;
    while (!decoder.done) {
      // console.log("Counter", counter++);
      const part = encoder.nextPart();
      decoder.receivePart(part);
    }

    expect(decoder.result).toEqual(message);
  });

});


describe("Fountain Decoder Ur", () => {
  
  test("should decode a message", () => {
    const messageSize = 32767
    const maxFragmentLen = 1000    
    const myUr = make_message_ur(messageSize);

    const encoder = new UrFountainEncoder(myUr, maxFragmentLen, undefined, 30);
    const decoder = new UrFountainDecoder();

    let counter = 0;
    while (!decoder.done) {
      const ur = encoder.nextPartUr();
      decoder.receivePartUr(ur);
    }

    expect(decoder.resultUr.getPayloadHex()).toEqual(myUr.getPayloadHex());
    expect(decoder.resultUr.toString()).toEqual(myUr.toString());
    expect(decoder.resultUr.decode()).toEqual(myUr.decode());
  });

});