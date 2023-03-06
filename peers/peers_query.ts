import { semver } from "../deps.ts";
import { NetworkMessage } from "../protocol/mod.ts";
import { Peer } from "./peer.ts";

export function peersQuery(peers: Peer[]) {
  let filteredPeers = [...peers];

  return {
    /** Filter peers that cannot handle the provided `NetworkMessage`. */
    canHandle(msg: NetworkMessage) {
      const requiredVer = msg.protocolVersion.toString();

      filteredPeers = filteredPeers.filter((p) => {
        if (!p.handshake) {
          return false;
        }

        const peerVer = p.handshake.peerSpec.refNodeVersion.toString();

        return semver.gte(peerVer, requiredVer);
      });

      return this;
    },
    /** Randomize the peers list. */
    randomize() {
      for (let i = filteredPeers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filteredPeers[i], filteredPeers[j]] = [
          filteredPeers[j],
          filteredPeers[i],
        ];
      }

      return this;
    },
    /** Finalize the query and return the peers. */
    peers(): Peer[] {
      return filteredPeers;
    },
  };
}
