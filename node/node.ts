import {
  ErgodeConfig,
  mergeUserConfigAndValidate,
  NetworkType,
  PartialErgodeConfig,
} from "../config/mod.ts";
import { Component } from "../core/component.ts";
import { log } from "../deps.ts";
import { setupLogging } from "../log/mod.ts";
import { ConnectionManager } from "../net/mod.ts";
import { PeerAddressBook, PeerManager } from "../peers/mod.ts";
import { PeerSpec } from "../protocol/mod.ts";
import { Transport } from "../transports/mod.ts";
import { version } from "../version.ts";

export interface NodeOpts {
  networkType: NetworkType;
  config: PartialErgodeConfig;
  transport: Transport;
  gatherMetrics?: boolean;
}

export class Ergode implements Component {
  readonly #logger: log.Logger;
  readonly #components: Component[] = [];
  readonly config: ErgodeConfig;
  readonly opts: NodeOpts;
  readonly peerManager: PeerManager;

  constructor(opts: NodeOpts) {
    this.opts = opts;
    this.config = mergeUserConfigAndValidate(opts.networkType, opts.config);

    setupLogging(this.config.logging);

    this.#logger = log.getLogger();

    const peerAddressBook = new PeerAddressBook({
      logger: this.#logger,
      configAddrs: this.config.peers.knownAddrs,
    });
    this.#components.push(peerAddressBook);

    const connectionManager = new ConnectionManager({
      logger: this.#logger,
      peerAddressBook,
      transport: opts.transport,
      maxConnections: this.config.peers.maxConnections,
    });
    this.#components.push(connectionManager);

    const spec = PeerSpec.fromConfig(this.config);
    this.peerManager = new PeerManager({
      logger: this.#logger,
      connectionManager,
      spec,
    });
    this.#components.push(this.peerManager);

    // peerManager.on("peer:spec" (specs) => peerAddressBook.add(specs))

    // metric gatherer? subscribe to events from previous components
  }

  async start(): Promise<void> {
    this.#logger.info(`starting ${this.#components.length} components`);

    await Promise.all(this.#components.map((c) => c.start()));
  }

  async stop(): Promise<void> {
    this.#logger.info("shutting down");

    await Promise.all(this.#components.map((c) => c.stop()));
  }

  get version(): string {
    return version;
  }
}
