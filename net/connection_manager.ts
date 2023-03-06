import { Component } from "../core/component.ts";
import { log, Multiaddr } from "../deps.ts";
import { PeerStore } from "../peers/mod.ts";
import { DialOpts, Transport } from "../transports/mod.ts";
import { Connection } from "./connection.ts";

/** Events emitted by `ConnectionManager` instances. */
export interface ConnectionManagerEvents {
  /** Emitted when a new connection is established. */
  "connection:new": CustomEvent<Connection>;
  /** Emitted when a connection is closed for any reason. */
  "connection:close": CustomEvent<Connection>;
}

/** How often to auto-dial new peers in milliseconds. */
const AUTO_DIAL_INTERVAL_MS = 10000;

/** `ConnectionManager` options. */
export interface ConnectionManagerOpts {
  /** Logger instance for the connection manager. */
  logger: log.Logger;
  /** Underlying networking transport for connections. */
  transport: Transport;
  /**
   * Max number of simultaneous connections.
   * Includes inbound + outbound connections.
   */
  maxConnections: number;
  /** Peer store used by the connection manager. */
  peerStore: PeerStore;
}

/**
 * Connection manager is used to manage outbound and incoming connections.
 * It will automatically connect to new peers at a set interval
 * as long as the connection count is below `ConnectionManagerOpts.maxConnections`.
 */
export class ConnectionManager extends Component<ConnectionManagerEvents> {
  readonly #logger: log.Logger;
  readonly #transport: Transport;
  readonly #maxConnections: number;
  readonly #peerStore: PeerStore;
  #connections: Connection[];
  #autoDialHandle?: number;

  constructor(
    { logger, transport, maxConnections, peerStore }: ConnectionManagerOpts,
  ) {
    super();

    this.#logger = logger;
    this.#connections = [];
    this.#maxConnections = maxConnections;
    this.#peerStore = peerStore;
    this.#transport = transport;
  }

  /**
   * Open a new connection with a remote peer.
   * @param addr Address in `Multiaddr` format to open a connection to.
   * @param opts Options for the dial request.
   * @returns A promise resolving to a connection.
   */
  async openConnection(addr: Multiaddr, opts?: DialOpts): Promise<Connection> {
    this.#logger.debug(`connecting to ${addr.toString()}`);

    // add to "pending connections" list, so it can be cancelled?
    const conn = await this.#transport.dial(addr, opts);

    this.#connections.push(conn);
    this.dispatchEvent(new CustomEvent("connection:new", { detail: conn }));

    this.#logger.info(`connected to ${addr.toString()}`);

    return conn;
  }

  /**
   * Close an established connection.
   * @param conn `Connection` to close.
   * @returns void
   */
  closeConnection(conn: Connection): Promise<void> {
    // conn.close()
    this.#connections = this.#connections.filter((c) =>
      c.connId !== conn.connId
    );

    return Promise.resolve();
  }

  start(): Promise<void> {
    this.#logger.debug("connection manager starting");

    this.#autoDialHandle = setInterval(
      () => this.autoDialPeer(),
      AUTO_DIAL_INTERVAL_MS,
    );

    return Promise.resolve();
  }

  stop(): Promise<void> {
    clearInterval(this.#autoDialHandle);

    // for all connections - close

    return Promise.resolve();
  }

  private async autoDialPeer(): Promise<void> {
    if (this.#connections.length >= this.#maxConnections) {
      this.#logger.debug("already at max connections");

      return;
    }

    this.#logger.debug("auto dialing random peer");

    // what about pending connections?
    const potentialPeers = this.#peerStore.addrs.filter((addr) =>
      !this.#connections.some((conn) => conn.remoteAddr.equals(addr))
    );

    if (!potentialPeers.length) {
      this.#logger.debug("auto dialer didn't find any peers to connect to");

      return;
    }

    const randomIndex = Math.floor(Math.random() * potentialPeers.length);
    const peerAddr = potentialPeers[randomIndex];

    await this.openConnection(peerAddr);
  }
}
