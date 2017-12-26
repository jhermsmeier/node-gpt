var crc32 = require( 'cyclic-32' )

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
 * Parse a GUID Partition Table from a buffer
 * @param {Buffer} buffer
 * @param {Number} [offset=0]
 * @returns {GPT}
 */
GPT.parse = function( buffer, offset ) {
  return new GPT().parse( buffer, offset )
}

/**
 * Parse a GPT from a buffer in its backup order
 * @param {Buffer} buffer
 * @param {Number} [offset=0]
 * @returns {GPT}
 */
GPT.parseBackup = function( buffer, offset ) {
  return new GPT().parseBackup( buffer, offset )
}

// TODO: Should this verify a buffer, or an instance of a GPT?
GPT.verify = function( gpt ) {
  return gpt.verify()
}

/**
 * Compare two GPTs against each other
 * @param {GPT} primary
 * @param {GPT} secondary
 * @returns {Boolean}
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
  get tableSize() {
    return this.entries * this.entrySize
  },

  /**
   * Verify integrity of the GPT
   * @returns {Boolean}
   */
  verify() {
    return this.verifyHeader() && this.verifyTable()
  },

  /**
   * Verify integrity of the header
   * @returns {Boolean}
   */
  verifyHeader() {
    return this.checksumHeader() === this.headerChecksum
  },

  /**
   * Verify integrity of the partition table
   * @returns {Boolean}
   */
  verifyTable() {
    return this.checksumTable() === this.tableChecksum
  },

  /**
   * Calculate the header checksum (CRC32)
   * @param {Buffer} [buffer]
   * @param {Number} [offset=0]
   * @returns {Number}
   */
  checksumHeader( buffer, offset ) {

    offset = offset || 0
    buffer = buffer || this.writeHeader( null, 0, true )

    // Clear stored checksum from buffer
    buffer.writeUInt32LE( 0, offset + 16 )

    return crc32( buffer ) >>> 0

  },

  /**
   * Calculate the partition table checksum (CRC32)
   * @param {Buffer} [buffer]
   * @param {Number} [offset=0]
   * @returns {Number}
   */
  checksumTable( buffer, offset ) {

    offset = offset || 0

    if( buffer == null ) {

      buffer = Buffer.alloc( this.tableSize )

      this.writeTable( this.partitions.slice( 0, 4 ), buffer, offset )
      this.writeTable( this.partitions.slice( 4 ), buffer, offset + this.blockSize )

    } else {
      buffer = buffer.length !== this.tableSize ?
        buffer.slice( offset, offset + this.tableSize ) :
        buffer
    }

    return crc32( buffer ) >>> 0

  },

  /**
   * Parse a GUID Partition Table from a buffer
   * @param {Buffer} buffer
   * @param {Number} [offset=0]
   * @returns {GPT}
   */
  parse( buffer, offset ) {

    offset = offset || 0

    // Clean out our partition array
    this.partitions.length = 0

    // Parse header
    this.parseHeader( buffer, offset )

    // Parse partition tables
    this.parseTable( buffer, offset + (( this.tableOffset - 1 ) * this.blockSize ) )
    this.parseTable( buffer, offset + ( this.tableOffset * this.blockSize ) )

    return this

  },

  /**
   * Parse a GPT from a buffer in its backup order
   * @param {Buffer} buffer
   * @param {Number} [offset=0]
   * @returns {GPT}
   */
  parseBackup( buffer, offset ) {

    offset = offset || 0

    // Clean out our partition array
    this.partitions.length = 0

    // Parse header, adding 33 blocks to the offset, as the backup
    // has the header behind the partition table
    this.parseHeader( buffer, offset + ( 33 * this.blockSize ) )

    // Parse partition tables
    this.parseTable( buffer, offset )
    this.parseTable( buffer, offset + this.blockSize )

    return this

  },

  /**
   * Parse a GPT's header from a given buffer
   * @param {Buffer} buffer
   * @param {Number} [offset=0]
   * @returns {GPT}
   */
  parseHeader( buffer, offset ) {

    offset = offset || 0

    if( buffer.length - offset < GPT.HEADER_SIZE ) {
      throw new Error( `Buffer too small: Minimum header size is ${GPT.HEADER_SIZE} bytes, got ${buffer.length - offset} bytes` )
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

  /**
   * Parse a GPT's partition table entries from a given buffer
   * @param {Buffer} buffer
   * @param {Number} [offset=0]
   * @returns {GPT}
   */
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
   * Write the GPT to a buffer
   * @param {Buffer} [buffer]
   * @param {Number} [offset=0]
   * @returns {Buffer}
   */
  write( buffer, offset ) {

    var length = ( this.tableOffset * this.blockSize ) + this.tableSize

    offset = offset || 0
    buffer = buffer || Buffer.alloc( offset + length, 0 )

    // Calculate the table offset from its LBA & the block size
    // NOTE: What'd happen if tableOffset == 0?
    // Prob. good idea to add a test for expected behavior
    var tableOffset = ( this.tableOffset - 1 ) * this.blockSize

    this.writeTable( this.partitions.slice( 0, 4 ), buffer, offset + tableOffset )
    this.writeTable( this.partitions.slice( 4 ), buffer, offset + tableOffset + this.blockSize )

    // Recalculate partition table checksum before writing header,
    // as the header's checksum includes the table checksum
    this.tableChecksum = this.checksumTable( buffer, offset + tableOffset )

    this.writeHeader( buffer, offset )

    return buffer

  },

  /**
   * Write the GPT header to a buffer
   * @param {Buffer} [buffer]
   * @param {Number} [offset=0]
   * @param {Boolean} [noChecksum=false] - don't calculate & update the header checksum
   * @returns {Buffer}
   */
  writeHeader( buffer, offset, noChecksum ) {

    offset = offset || 0
    buffer = buffer || Buffer.alloc( offset + this.headerSize )

    buffer.write( GPT.SIGNATURE, offset + 0, offset + 8, 'ascii' )

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

    if( !noChecksum ) {
      this.headerChecksum = this.checksumHeader( buffer.slice( offset, offset + this.headerSize ) )
      buffer.writeUInt32LE( this.headerChecksum, offset + 16 )
    }

    return buffer

  },

  /**
   * Write partition entries to a buffer
   * @param {Array<GPT.Partition>} entries
   * @param {Buffer} [buffer]
   * @param {Number} [offset=0]
   * @returns {Buffer}
   */
  writeTable( entries, buffer, offset ) {

    offset = offset || 0
    buffer = buffer || Buffer.alloc( offset + ( this.entrySize * entries.length ) )

    for( var i = 0; i < entries.length; i++ ) {
      entries[i].write( buffer, offset + ( i * this.entrySize ) )
    }

    return buffer

  }

}
