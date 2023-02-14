import {
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

export interface NodeOpts {
  networkType: NetworkType;
  config: PartialErgodeConfig;
  transport: Transport;
  gatherMetrics?: boolean;
}

export class Ergode implements Component {
  readonly #logger: log.Logger;
  readonly #components: Component[] = [];

  constructor(opts: NodeOpts) {
    const config = mergeUserConfigAndValidate(opts.networkType, opts.config);

    setupLogging(config.logging);

    this.#logger = log.getLogger();

    const peerAddressBook = new PeerAddressBook({
      logger: this.#logger,
      configAddrs: config.peers.knownAddrs,
    });
    this.#components.push(peerAddressBook);

    const connectionManager = new ConnectionManager({
      logger: this.#logger,
      peerAddressBook,
      transport: opts.transport,
      maxConnections: config.peers.maxConnections,
    });
    this.#components.push(connectionManager);

    const spec = PeerSpec.fromConfig(config);
    const peerManager = new PeerManager({
      logger: this.#logger,
      connectionManager,
      spec,
    });
    this.#components.push(peerManager);

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
}
