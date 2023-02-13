import { ScorexReader, ScorexWriter } from "../../io/scorex_buffer.ts";
import { Handshake, MAX_HANDSHAKE_SIZE, PeerSpec } from "./handshake.ts";
import { assert, assertEquals, assertThrows } from "../../test_deps.ts";
import {
  LocalAddressFeature,
  ModePeerFeature,
  PeerFeature,
  PeerFeatureId,
} from "../peer_features/mod.ts";
import { Version } from "../version.ts";
import { multiaddr } from "../../deps.ts";

function hexToBytes(hex: string) {
  return new Uint8Array(
    hex.match(/[\da-f]{2}/gi)!.map(function (h) {
      return parseInt(h, 16);
    }),
  );
}

function uint8ArrayToHexString(arr: Uint8Array): string {
  let hex = "";
  for (let i = 0; i < arr.length; i++) {
    let hexValue = arr[i].toString(16);
    if (hexValue.length === 1) {
      hexValue = "0" + hexValue;
    }
    hex += hexValue;
  }
  return hex;
}

Deno.test("[protocol/messages/handshake] Decoding throws error if handshake too large", async () => {
  const bytes = new Uint8Array(MAX_HANDSHAKE_SIZE + 1);
  const r = await ScorexReader.create(bytes);

  assertThrows(() => Handshake.decode(r));
});

// https://github.com/ergoplatform/ergo/blob/d6e7e78b226ed70edb99bb78491b584e2654dd2d/src/test/scala/org/ergoplatform/network/HandshakeSpecification.scala
Deno.test("[protocol/messages/handshake] Decoding", async () => {
  const hsHex =
    "bcd2919cee2e076572676f726566030306126572676f2d6d61696e6e65742d332e332e36000210040001000102067f000001ae46";
  const hsBytes = hexToBytes(hsHex);
  const r = await ScorexReader.create(hsBytes);
  const hs = Handshake.decode(r);

  assertEquals(hs.unixTimestamp, 1610134874428n); // Friday, 8 January 2021, 19:41:14

  const { peerSpec } = hs;

  assertEquals(peerSpec.agentName, "ergoref");
  assertEquals(peerSpec.nodeName, "ergo-mainnet-3.3.6");
  assertEquals(peerSpec.refNodeVersion.major, 3);
  assertEquals(peerSpec.refNodeVersion.minor, 3);
  assertEquals(peerSpec.refNodeVersion.patch, 6);
  assertEquals(peerSpec.declaredAddress, undefined);

  const { features } = peerSpec;

  assertEquals(features.length, 2);
  assertEquals(features[0].id, PeerFeatureId.Mode);

  const modeFeature = features[0] as ModePeerFeature;

  assertEquals(modeFeature.stateType, 0);
  assert(modeFeature.isVerifyingTransactions);
  assertEquals(modeFeature.poPowSuffix, undefined);
  assertEquals(modeFeature.blocksToKeep, -1);

  assertEquals(features[1].id, PeerFeatureId.LocalAddress);

  const localAddrFeature = features[1] as LocalAddressFeature;

  assert(localAddrFeature.addr.equals(multiaddr("/ip4/127.0.0.1/tcp/9006")));
});

// Test that we encode into the hex string from the previous decoding test with the same structures
Deno.test("[protocol/messages/handshake] Encoding", async () => {
  const modeFeature = new ModePeerFeature({
    stateType: 0,
    isVerifyingTransactions: true,
    blocksToKeep: -1,
  });
  const localAddrFeature = new LocalAddressFeature(
    multiaddr("/ip4/127.0.0.1/tcp/9006"),
  );
  const features: PeerFeature[] = [modeFeature, localAddrFeature];
  const peerSpec = new PeerSpec({
    agentName: "ergoref",
    nodeName: "ergo-mainnet-3.3.6",
    refNodeVersion: new Version(3, 3, 6),
    features,
  });
  const hs = new Handshake(1610134874428n, peerSpec);
  const writer = await ScorexWriter.create();
  hs.encode(writer);
  const hsHex = uint8ArrayToHexString(writer.buffer);

  assertEquals(
    hsHex,
    "bcd2919cee2e076572676f726566030306126572676f2d6d61696e6e65742d332e332e36000210040001000102067f000001ae46",
  );
});
