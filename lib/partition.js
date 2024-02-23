const GUID = require( './guid' )
const GPT = require( './gpt' )

class PartitionEntry {

  /**
   * Create a PartitionEntry
   * @constructor
   * @param {Object} [options]
   * @param {String} [options.type=GPT.GUID.ZERO]
   * @param {String} [options.guid=GPT.GUID.ZERO]
   * @param {String} [options.name='']
   * @param {BigInt} [options.firstLBA=0n]
   * @param {BigInt} [options.lastLBA=0n]
   * @param {BigInt} [options.attr=0n]
   * @returns {PartitionEntry}
   */
  constructor( options ) {

    /** @type {String} Type GUID */
    this.type = options?.type || GUID.ZERO
    /** @type {String} GUID */
    this.guid = options?.guid || GUID.ZERO
    /** @type {String} Partition label */
    this.name = options?.name || ''

    /** @type {BigInt} First addressable block address */
    this.firstLBA = options?.firstLBA ?? 0n
    /** @type {BigInt} Last addressable block address */
    this.lastLBA = options?.lastLBA ?? 0n
    // NOTE: Can't use this as uint64 as logical ops will cast to uint32;
    // Maybe revert to buffer, or use bitfield module?
    /** @type {BigInt} Attribute flags */
    this.attr = options?.attr ?? 0n

  }

  /**
   * Parse a partition entry from a given buffer
   * @param {Buffer} buffer
   * @param {Number} [offset=0]
   * @returns {PartitionEntry}
   */
  static parse( buffer, offset ) {
    return new PartitionEntry().parse( buffer, offset )
  }

  /**
   * Determine whether this partition entry is marked empty
   * @returns {Boolean}
   */
  isEmpty() {
    return this.type.toString() === GUID.ZERO
  }

  /**
   * Parse a partition entry from a given buffer
   * @param {Buffer} buffer
   * @param {Number} [offset=0]
   * @returns {PartitionEntry}
   */
  parse( buffer, offset ) {

    offset = offset || 0

    this.type = GUID.toString( buffer, offset + 0 )
    this.guid = GUID.toString( buffer, offset + 16 )

    this.firstLBA = buffer.readBigUInt64LE( offset + 32 )
    this.lastLBA = buffer.readBigUInt64LE( offset + 40 )
    this.attr = buffer.readBigUInt64LE( offset + 48 )

    this.name = buffer.toString( 'ucs2', offset + 56, offset + GPT.TABLE_ENTRY_SIZE )
      .replace( /\x00+/g, '' )

    return this

  }

  /**
   * Write a partition entry to a given buffer
   * @param {Buffer} [buffer]
   * @param {Number} [offset=0]
   * @returns {PartitionEntry}
   */
  write( buffer, offset ) {

    buffer = buffer || Buffer.alloc( GPT.TABLE_ENTRY_SIZE, 0 )
    offset = offset || 0

    GPT.GUID.write( this.type, buffer, offset + 0 )
    GPT.GUID.write( this.guid, buffer, offset + 16 )

    buffer.writeBigUInt64LE( this.firstLBA, offset + 32 )
    buffer.writeBigUInt64LE( this.lastLBA, offset + 40 )
    buffer.writeBigUInt64LE( this.attr, offset + 48 )

    buffer.fill( 0, offset + 56, offset + GPT.TABLE_ENTRY_SIZE )
    buffer.write( this.name, offset + 56, offset + GPT.TABLE_ENTRY_SIZE, 'ucs2' )

    return buffer

  }

}

// Exports
module.exports = PartitionEntry
