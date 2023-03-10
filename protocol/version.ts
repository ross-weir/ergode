import { CursorReader, CursorWriter } from "../io/cursor_buffer.ts";
import { isSemVer } from "../_utils/isSemVer.ts";
import { NetworkEncodable } from "./encoding.ts";

/** Represents a version of an entity on the network. */
export class Version implements NetworkEncodable {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;

  constructor(major: number, minor: number, patch: number) {
    this.major = major;
    this.minor = minor;
    this.patch = patch;
  }

  encode(writer: CursorWriter): void {
    writer.putInt8(this.major);
    writer.putInt8(this.minor);
    writer.putInt8(this.patch);
  }

  static decode(reader: CursorReader): Version {
    return new Version(reader.getInt8(), reader.getInt8(), reader.getInt8());
  }

  /** Convert the version to a string in semantic format. */
  toString(): string {
    return `${this.major}.${this.minor}.${this.patch}`;
  }

  /**
   * Create a `Version` from the provided string.
   *
   * @param s String in semantic version formatting.
   * @returns `Version` instance.
   */
  static fromString(s: string): Version {
    if (!isSemVer(s)) {
      throw new Error(`must be semantic version formatting, received: ${s}`);
    }

    const [major, minor, patch] = s.split(".").map(Number);

    return new Version(major, minor, patch);
  }
}

/** Reference node client versions */
export const initialNodeVersion = new Version(0, 0, 1);
/** Reference client nodes of the following versions deliver broken block sections */
export const v4017 = new Version(4, 0, 17);
export const v4018 = new Version(4, 0, 18);
