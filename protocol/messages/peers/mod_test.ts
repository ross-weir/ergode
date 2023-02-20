import { assertEquals } from "../../../test_deps.ts";
import { ScorexReader } from "../../../io/scorex_buffer.ts";
import { hexToBytes } from "../../../_utils/hex.ts";
import { PeersMessage } from "./mod.ts";

Deno.test("[protocol/messages/peers] Decodes successfully", async () => {
  const hexStr =
    "01076572676F726566050007206572676F2D6E6F64652D746573746E65742D7765752E7A6F6F6D6F75742E696F01082F57E6DFBE4603100400010001030D020002038DDEEFD5FBBF969D3704292868747470733A2F2F6572676F2D6E6F64652D746573746E65742D7765752E7A6F6F6D6F75742E696F";
  const msgBytes = hexToBytes(hexStr);
  const reader = await ScorexReader.create(msgBytes);
  const peersMsg = PeersMessage.decode(reader);

  assertEquals(peersMsg.peers.length, 1);

  const peer = peersMsg.peers[0];

  assertEquals(peer.agentName, "ergoref");
  assertEquals(peer.nodeName, "ergo-node-testnet-weu.zoomout.io");
  assertEquals(peer.refNodeVersion.toString(), "5.0.7");
  assertEquals(peer.declaredAddress!.toString(), "/ip4/47.87.230.223/tcp/9022");
  assertEquals(peer.features.length, 3);
});

Deno.test("[protocol/messages/peers] Decodes many peers successfully", async () => {
  const hexStr =
    "0e076572676f726566050007206572676f2d6e6f64652d746573746e65742d6575732e7a6f6f6d6f75742e696f010833512130be4603100400010001030d02000203fc88c4cff5ffedd92f04292868747470733a2f2f6572676f2d6e6f64652d746573746e65742d6575732e7a6f6f6d6f75742e696f076572676f726566050007146d726c61666f6e7461696e6520746573746e6574010818ca5839be4602100400010001030e02000203becda89ae3cdebb68401076572676f726566050003106572676f2d746573746e65742d352e3001085e17c66ace0802100400010001030d02000203c5ac9dcff6dbcf980d076572676f7265660500050962616c622d6e6f64650108c63a60c3be4603100400010001030e02000203b9f4c8acfd85f9efdf01041a19687474703a2f2f3139382e35382e39362e3139353a39303532076572676f726566050006126572676f2d746573746e65742d352e302e340108339e3681be4602100400010001030e02000203e2d0bf82cdd7b7828201076572676f7265660500060b7265716c657a2d746e2d310108a88ab9d7be4603100400010001030e020002038ca2a7ebf7e68df2ca01041c1b687474703a2f2f3136382e3133382e3138352e3231353a39303532076572676f7265660500070f6572676f6e6f6465546573746e6574010849c0c081be4602100400010001030d02000203d8efffdb95eeae9535076572676f726566050007206572676f2d6e6f64652d746573746e65742d7765752e7a6f6f6d6f75742e696f01082f57e6dfbe4603100400010001030d020002038ddeefd5fbbf969d3704292868747470733a2f2f6572676f2d6e6f64652d746573746e65742d7765752e7a6f6f6d6f75742e696f076572676f726566050007206572676f2d6e6f64652d746573746e65742d7775732e7a6f6f6d6f75742e696f01083351df2cbe4603100400010001030e0200020393caffc4a3d1d3afd00104292868747470733a2f2f6572676f2d6e6f64652d746573746e65742d7775732e7a6f6f6d6f75742e696f076572676f726566040068126572676f2d746573746e65742d342e302e300108c3c95273bd4602100400010001030e02000203dbf596f4c4d4c7d39001076572676f726566050003106572676f2d746573746e65742d352e3001085e17c66acc0802100400010001030d0200020396f5cec5f0ef92f91f076572676f7265660500070b7265716c657a2d746e2d320108c0eac4a5be4603100400010001030d02000203eea0f2cac29cdcd33b041c1b687474703a2f2f3139322e3233342e3139362e3136353a39303532076572676f7265660500030e6572676f2d746573746e65742d6501083359287abe4602100400010001030e02000203c1beaa9bfd9da6ddfe01076572676f7265660500020b62616c622d6e6f64652d31010868ed8b4ebe4603100400010001030e020002038ca8ccbfb7bed4f6c801041b1a687474703a2f2f3130342e3233372e3133392e37383a39303532";
  const msgBytes = hexToBytes(hexStr);
  const reader = await ScorexReader.create(msgBytes);
  const peersMsg = PeersMessage.decode(reader);

  assertEquals(peersMsg.peers.length, 14);
});