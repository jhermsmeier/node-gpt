var GUID = require( './guid' )
var GPT = require( './gpt' )

/**
 * PartitionEntry
 * @constructor
 * @param {Object} [options]
 * @returns {PartitionEntry}
 */
function PartitionEntry( options ) {

  if( !(this instanceof PartitionEntry) ) {
    return new PartitionEntry( options )
  }

  options = options != null ? options : {}

  /** @type {String} Type GUID */
  this.type = options.type || GUID.ZERO
  /** @type {String} GUID */
  this.guid = options.guid || GUID.ZERO
  /** @type {String} Partition label */
  this.name = options.name || ''

  /** @type {Number} First addressable block address */
  this.firstLBA = 0
  /** @type {Number} Last addressable block address */
  this.lastLBA = 0
  /** @type {Number} Attribute flags */
  // NOTE: Can't use this as uint64 as logical ops will cast to uint32;
  // Maybe revert to buffer, or use bitfield module?
  this.attr = 0

}

/**
 * Parse a partition entry from a given buffer
 * @param {Buffer} buffer
 * @param {Number} [offset=0]
 * @returns {PartitionEntry}
 */
PartitionEntry.parse = function( buffer, offset ) {
  return new PartitionEntry().parse( buffer, offset )
}

/**
 * PartitionEntry prototype
 * @ignore
 */
PartitionEntry.prototype = {

  constructor: PartitionEntry,

  /**
   * Determine whether this partition entry is marked empty
   * @returns {Boolean}
   */
  isEmpty() {
    return this.type.toString() === GUID.ZERO
  },

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

    this.firstLBA = buffer.readUIntLE( offset + 32, 8 )
    this.lastLBA = buffer.readUIntLE( offset + 40, 8 )
    this.attr = buffer.readUIntLE( offset + 48, 8 )

    this.name = buffer.toString( 'ucs2', offset + 56, offset + GPT.TABLE_ENTRY_SIZE )
      .replace( /\x00+/g, '' )

    return this

  },

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

    buffer.writeUIntLE( this.firstLBA, offset + 32, 8 )
    buffer.writeUIntLE( this.lastLBA, offset + 40, 8 )
    buffer.writeUIntLE( this.attr, offset + 48, 8 )

    buffer.fill( 0, offset + 56, offset + GPT.TABLE_ENTRY_SIZE )
    buffer.write( this.name, offset + 56, offset + GPT.TABLE_ENTRY_SIZE, 'ucs2' )

    return buffer

  },

}

// Exports
module.exports = PartitionEntry
