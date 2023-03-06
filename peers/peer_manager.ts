import { Component } from "../core/component.ts";
import { log } from "../deps.ts";
import { Connection, ConnectionManager } from "../net/mod.ts";
import {
  GetPeersMessage,
  NetworkMessageCodec,
  NetworkMessageHandler,
  PeerSpec,
} from "../protocol/mod.ts";
import { Peer } from "./peer.ts";
import { peersQuery } from "./peers_query.ts";

export interface PeerManagerEvents {
  "peer:new": CustomEvent<Peer>;
}

export interface PeerManagerOpts {
  logger: log.Logger;
  connectionManager: ConnectionManager;
  // our peer spec sent with handshakes to remote peers
  spec: PeerSpec;
  msgHandler: NetworkMessageHandler;
  codec: NetworkMessageCodec;
}

export class PeerManager extends Component<PeerManagerEvents> {
  readonly #logger: log.Logger;
  readonly #connectionManager: ConnectionManager;
  readonly #spec: PeerSpec;
  readonly #msgHandler: NetworkMessageHandler;
  readonly #codec: NetworkMessageCodec;
  readonly #peers: Peer[] = [];
  #getPeersTaskHandle?: number;

  constructor(
    { logger, connectionManager, spec, msgHandler, codec }: PeerManagerOpts,
  ) {
    super();

    this.#logger = logger;
    this.#connectionManager = connectionManager;
    this.#spec = spec;
    this.#msgHandler = msgHandler;
    this.#codec = codec;

    this.#connectionManager.addEventListener(
      "connection:new",
      ({ detail }) => this.#onConnection(detail),
    );
  }

  start(): Promise<void> {
    this.#getPeersTaskHandle = setInterval(
      () => this.#getPeersTask(),
      60000 * 2, // every 2 minutes
    );

    return Promise.resolve();
  }

  stop(): Promise<void> {
    clearInterval(this.#getPeersTaskHandle);

    return Promise.resolve();
  }

  #getPeersTask() {
    const msg = new GetPeersMessage();
    const peer = peersQuery(this.#peers).canHandle(msg).randomize().peers()[0];

    if (!peer) {
      this.#logger.debug("Unable to find suitable peer for 'GetPeers' request");

      return;
    }

    peer.send(msg);
  }

  #onConnection(conn: Connection) {
    this.#logger.info(`connection: ${conn.localAddr} -> ${conn.remoteAddr}`);

    const peer = new Peer({
      conn,
      localSpec: this.#spec,
      logger: this.#logger,
      codec: this.#codec,
    });

    this.#peers.push(peer);
    this.dispatchEvent(new CustomEvent("peer:new", { detail: peer }));
    peer.addEventListener(
      "peer:message:recv",
      ({ detail }) => this.#msgHandler.handle(detail, peer),
    );
    peer.start();
  }
}
