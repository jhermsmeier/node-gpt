var crc32 = require( 'buffer-crc32' )

/**
 * GUID Partition Table
 * @constructor
 * @param {Object} [options]
 * @param {Number} [options.blockSize=512]
 * @returns {GPT}
 */
function GPT( options ) {

  if( !(this instanceof GPT) ) {
    return new GPT( options )
  }

  options = options != null ? options : {}

  /** @type {Number} Storage device's block size in bytes */
  this.blockSize = options.blockSize || 512

  /** @type {GPT.GUID} GUID of the GUID Partition Table */
  this.guid = new GPT.GUID()
  /** @type {Number} GPT format revision (?) */
  this.revision = 0
  /** @type {Number} Size of the GPT header in bytes */
  this.headerSize = options.headerSize || GPT.HEADER_SIZE
  /** @type {Number} GPT header's CRC32 checksum */
  this.headerChecksum = 0

  /** @type {Number} Logical block address of *this* GPT */
  this.currentLBA = options.currentLBA || 1
  /** @type {Number} Logical block address of the secondary GPT */
  this.backupLBA = options.backupLBA || 0
  /** @type {Number} Address of the first user-space usable logical block */
  this.firstLBA = options.firstLBA || 34
  /** @type {Number} Address of the last user-space usable logical block */
  this.lastLBA = options.lastLBA || 0

  /** @type {Number} LBA of partition table */
  this.tableOffset = options.tableOffset || GPT.TABLE_OFFSET
  /** @type {Number} Number of partition table entries */
  this.entries = options.entries || GPT.TABLE_ENTRIES
  /** @type {Number} Partition entry's size in bytes */
  this.entrySize = options.entrySize || GPT.TABLE_ENTRY_SIZE
  /** @type {Number} Partition table's CRC32 checksum */
  this.tableChecksum = 0

  // Array of partition entries
  this.partitions = []

}

// Exports
module.exports = GPT

/**
 * GPT magic signature
 * @type {String}
 */
GPT.SIGNATURE = 'EFI PART'

/**
 * Default GPT header size in bytes
 * @type {Number}
 */
GPT.HEADER_SIZE = 92

/**
 * Offset of the partition table in logical blocks
 * @type {Number}
 */
GPT.TABLE_OFFSET = 2

/**
 * Number of partition table entries
 * @type {Number}
 */
GPT.TABLE_ENTRIES = 128

/**
 * Size of a partition table entry in bytes
 * @type {Number}
 */
GPT.TABLE_ENTRY_SIZE = 128

/**
 * GPT GUID structure constructor
 * @type {Function}
 */
GPT.GUID = require( './guid' )

/**
 * GPT PartitionEntry constructor
 * @type {Function}
 */
GPT.PartitionEntry = require( './partition' )

/**
 * Parses a GUID Partition Table from a given buffer
 * @param {Buffer} buffer
 * @param {Number} [offset=0]
 * @returns {GPT}
 */
GPT.parse = function( buffer, offset ) {
  return new GPT().parse( buffer, offset )
}

// ???!?!?!?!?!?
GPT.verify = function( gpt ) {
  return Boolean
}

/**
 * Compare two GPTs against each other
 * @param {GPT} primary
 * @param {GPT} secondary
 * @return {Boolean}
 */
GPT.compare = function( primary, secondary ) {
  return Boolean
}

/**
 * GUID Partition Table prototype
 * @type {Object}
 * @ignore
 */
GPT.prototype = {

  constructor: GPT,

  /**
   * @property {Number} tableSize
   * @readOnly
   */
  get tableSize() { return this.entries * this.entrySize },

  /**
   * Parses a GUID Partition Table from a given buffer
   * @param {Buffer} buffer
   * @param {Number} [offset=0]
   * @returns {GPT}
   */
  parse( buffer, offset ) {

    offset = offset || 0

    // Parse header
    this.parseHeader( buffer, offset )

    // Clean out our partition array
    this.partitions.length = 0

    // Parse partition tables
    this.parseTable( buffer, offset + (( this.tableOffset - 1 ) * this.blockSize ) )
    this.parseTable( buffer, offset + ( this.tableOffset * this.blockSize ) )

    return this

  },

  /**
   * Parse a GPT's header from a given buffer
   * @param {Buffer} buffer
   * @param {Number} [offset=0]
   * @return {GPT}
   */
  parseHeader( buffer, offset ) {

    offset = offset || 0

    if( buffer.length < 92 ) {
      throw new Error( 'Buffer too small: Minimum header size is 92 bytes.' )
    }

    var signature = buffer.toString( 'ascii', offset + 0, offset + 8 )
    if( signature !== GPT.SIGNATURE ) {
      throw new Error( `Invalid signature: Expected "${GPT.SIGNATURE}", saw "${signature}"` )
    }

    // Header descriptors
    this.revision = buffer.readUInt32LE( offset + 8 )
    this.headerSize = buffer.readUInt32LE( offset + 12 )
    this.headerChecksum = buffer.readUInt32LE( offset + 16 )

    // Location descriptors
    this.currentLBA = buffer.readUIntLE( offset + 24, 8 )
    this.backupLBA = buffer.readUIntLE( offset + 32, 8 )
    this.firstLBA = buffer.readUIntLE( offset + 40, 8 )
    this.lastLBA = buffer.readUIntLE( offset + 48, 8 )

    // GUID
    this.guid.buffer = buffer.slice( offset + 56, offset + 72 )

    // Partition table descriptors
    this.tableOffset = buffer.readUIntLE( offset + 72, 8 )
    this.entries = buffer.readUInt32LE( offset + 80 )
    this.entrySize = buffer.readUInt32LE( offset + 84 )
    this.tableChecksum = buffer.readUInt32LE( offset + 88 )

    return this

  },

  parseTable( buffer, offset ) {

    offset = offset || 0

    var entries = this.entries

    while( entries-- && offset < buffer.length ) {
      var part = GPT.PartitionEntry.parse( buffer, offset )
      if( !part.isEmpty() ) {
        this.partitions.push( part )
      }
      offset += this.entrySize
    }

    return this

  },

  /**
   * Writes a GUID Partition Table to a given buffer
   * @param {Buffer} buffer
   * @param {Number} [offset=0]
   * @returns {Buffer}
   */
  write( buffer, offset ) {

    var length = ( this.tableOffset * this.blockSize ) +
      this.entries * this.entrySize

    buffer = buffer || Buffer.alloc( length, 0 )
    offset = offset || 0

    this.writeHeader( buffer, offset )
    this.writeTable( this.partitions.slice( 0, 4 ), buffer, offset + (( this.tableOffset - 1 ) * this.blockSize ) )
    this.writeTable( this.partitions.slice( 4 ), buffer, offset + (( this.tableOffset ) * this.blockSize ) )

    return buffer

  },

  writeHeader( buffer, offset ) {

    offset = offset || 0
    buffer = buffer || Buffer.alloc( GPT.HEADER_SIZE )

    buffer.write( GPT.SIGNATURE, 0, 8, 'ascii' )

    // Header descriptors
    buffer.writeUInt32LE( this.revision, offset + 8 )
    buffer.writeUInt32LE( this.headerSize, offset + 12 )
    buffer.writeUInt32LE( this.headerChecksum, offset + 16 )

    // Location descriptors
    buffer.writeUIntLE( this.currentLBA, offset + 24, 8 )
    buffer.writeUIntLE( this.backupLBA, offset + 32, 8 )
    buffer.writeUIntLE( this.firstLBA, offset + 40, 8 )
    buffer.writeUIntLE( this.lastLBA, offset + 48, 8 )

    // GUID
    this.guid.buffer.copy( buffer, offset + 56 )

    // Partition table descriptors
    buffer.writeUIntLE( this.tableOffset, offset + 72, 8 )
    buffer.writeUInt32LE( this.entries, offset + 80 )
    buffer.writeUInt32LE( this.entrySize, offset + 84 )
    buffer.writeUInt32LE( this.tableChecksum, offset + 88 )

    return buffer // ??? Maybe `bytesWritten` or `buffer`

  },

  writeTable( entries, buffer, offset ) {

    offset = offset || 0
    buffer = buffer || Buffer.alloc( offset + ( this.entrySize * entries.length ) )

    for( var i = 0; i < entries.length; i++ ) {
      entries[i].write( buffer, offset + ( i * this.entrySize ) )
    }

    return buffer

  }

}
