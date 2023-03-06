export { multiaddr } from "https://cdn.skypack.dev/@multiformats/multiaddr@11.4.0?dts";
export type { Multiaddr } from "https://cdn.skypack.dev/@multiformats/multiaddr@11.4.0?dts";

export { multiaddrToUri } from "https://cdn.skypack.dev/@multiformats/multiaddr-to-uri@9.0.2?dts";

export {
  decode as base64Decode,
  encode as base64Encode,
} from "https://deno.land/std@0.176.0/encoding/base64.ts";

export { z } from "https://deno.land/x/zod@v3.20.5/mod.ts";

export * as log from "https://deno.land/std@0.176.0/log/mod.ts";
export * as semver from "https://deno.land/std@0.176.0/semver/mod.ts";

export {
  default as lodashMerge,
} from "https://cdn.skypack.dev/lodash.merge@4.6.2";

// structuredClone isn't available in some web envs (like Tizen) yet.
export { default as structuredClone } from "https://cdn.skypack.dev/@ungap/structured-clone@1.0.2";

export { default as blakejs } from "https://cdn.skypack.dev/blakejs@1.2.1";
