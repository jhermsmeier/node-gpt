var crc32 = require( 'cyclic-32' )
var uint64 = require( './uint64' )

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

  /** @type {String} GUID of the GUID Partition Table */
  this.guid = options.guid || GPT.GUID.ZERO
  /** @type {Number} GPT format revision */
  this.revision = options.revision ||  0x00010000
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
 * Miniumum size of the partition table in bytes
 * @type {Number}
 */
GPT.TABLE_MIN_SIZE = 16384

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
// GPT.verify = function( gpt ) {
//   return gpt.verify()
// }

/**
 * Compare two GPTs against each other
 * @param {GPT} primary
 * @param {GPT} secondary
 * @returns {Boolean}
 */
// TODO:
// GPT.compare = function( primary, secondary ) {
//   return Boolean
// }

/**
 * Align a value to a given boundary value
 * @param {Number} value
 * @param {Number} boundary
 * @returns {Number}
 * @example
 * align( 512 * 1.5, 512 ) // => 1024
 */
function align( value, boundary ) {
  return value + ( boundary - ( value % boundary ) ) % boundary
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
    return Math.max( align( this.entrySize * this.entries , this.blockSize ), GPT.TABLE_MIN_SIZE )
  },

  /**
   * @property {Number} tableSizeBlocks
   * @readOnly
   */
  get tableSizeBlocks() {
    return this.tableSize / this.blockSize
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

    // Read & clear stored checksum from buffer
    var storedChecksum =  buffer.readUInt32LE( offset + 16 )
    buffer.writeUInt32LE( 0, offset + 16 )

    // Calculate checksum
    var checksum = crc32( buffer ) >>> 0

    // Restore stored checksum
    buffer.writeUInt32LE( storedChecksum, offset + 16 )

    return checksum

  },

  /**
   * Calculate the partition table checksum (CRC32)
   * @param {Buffer} [buffer]
   * @param {Number} [offset=0]
   * @returns {Number}
   */
  checksumTable( buffer, offset ) {

    var tableSize = this.tableSize

    offset = offset || 0

    if( buffer == null ) {

      buffer = Buffer.alloc( tableSize )
      this.writeTable( this.partitions, buffer, offset )

    } else if( ( buffer.length - offset ) >= tableSize ) {

      buffer = buffer.length !== tableSize ?
        buffer.slice( offset, offset + tableSize ) :
        buffer

    } else {
      throw new Error( `Buffer smaller than table size (${ buffer.length - offset } < ${ tableSize })` )
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

    // Calculate table offset in bytes from currentLBA & tableOffset
    var tableOffset = ( this.tableOffset - this.currentLBA ) * this.blockSize

    // Parse partition tables
    this.parseTable( buffer, offset + tableOffset, offset + tableOffset + this.tableSize )

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

    // Parse header, adding the table size to the offset, as the backup
    // has the header behind the partition table
    this.parseHeader( buffer, offset + this.tableSize )

    // Parse partition tables
    this.parseTable( buffer, offset, offset + this.tableSize )

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
    this.currentLBA = uint64.readLE( buffer, offset + 24 )
    this.backupLBA = uint64.readLE( buffer, offset + 32 )
    this.firstLBA = uint64.readLE( buffer, offset + 40 )
    this.lastLBA = uint64.readLE( buffer, offset + 48 )

    // GUID
    this.guid = GPT.GUID.toString( buffer, offset + 56 )

    // Partition table descriptors
    this.tableOffset = uint64.readLE( buffer, offset + 72 )
    this.entries = buffer.readUInt32LE( offset + 80 )
    this.entrySize = buffer.readUInt32LE( offset + 84 )
    this.tableChecksum = buffer.readUInt32LE( offset + 88 )

    return this

  },

  /**
   * Parse a GPT's partition table entries from a given buffer
   * @param {Buffer} buffer
   * @param {Number} [offset=0]
   * @param {Number} [end]
   * @returns {GPT}
   */
  parseTable( buffer, offset, end ) {

    offset = offset || 0
    end = Math.min( end || buffer.length, buffer.length )

    var part = null

    for( var i = 0; ( i < this.entries ) && (( offset + this.entrySize ) <= end ); i++ ) {
      part = GPT.PartitionEntry.parse( buffer, offset )
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

    // Calculate the table offset from its LBA & the block size
    // NOTE: What'd happen if tableOffset == 0?
    // Prob. good idea to add a test for expected behavior
    var tableOffset = ( this.tableOffset - this.currentLBA ) * this.blockSize
    var length = this.blockSize + this.tableSize

    offset = offset || 0
    buffer = buffer || Buffer.alloc( offset + length, 0 )

    this.writeTable( this.partitions, buffer, offset + tableOffset )

    // Recalculate partition table checksum before writing header,
    // as the header's checksum includes the table checksum
    this.tableChecksum = this.checksumTable( buffer, offset + tableOffset )

    this.writeHeader( buffer, offset )

    return buffer

  },

  /**
   * Write the GPT to a buffer in its backup order
   * @param {Buffer} [buffer]
   * @param {Number} [offset=0]
   * @returns {Buffer}
   */
  writeBackup( buffer, offset ) {

    // NOTE: How is .tableOffset to be interpreted for backup GPTs?
    var tableSize = this.tableSize
    var length = this.blockSize + tableSize

    offset = offset || 0
    buffer = buffer || Buffer.alloc( offset + length )

    // For the backup, the partition table comes first, followed by the header
    this.writeTable( this.partitions, buffer, offset )

    // Recalculate partition table checksum before writing header,
    // as the header's checksum includes the table checksum
    this.tableChecksum = this.checksumTable( buffer, offset )

    this.writeHeader( buffer, offset + tableSize )

    return buffer

  },

  /**
   * Write a backup order GPT from a primary (or vice-versa) to a buffer
   * @param {Buffer} [buffer]
   * @param {Number} [offset=0]
   * @returns {Buffer}
   */
  writeBackupFromPrimary( buffer, offset ) {

    // Swap currentLBA, backupLBA & tableOffset for backup order
    var currentLBA = this.currentLBA
    var backupLBA = this.backupLBA
    var tableOffset = this.tableOffset

    this.backupLBA = currentLBA
    this.currentLBA = backupLBA
    this.tableOffset = this.currentLBA - this.tableSizeBlocks

    var output = this.writeBackup( buffer, offset )

    // Restore currentLBA, backupLBA & tableOffset
    this.backupLBA = backupLBA
    this.currentLBA = currentLBA
    this.tableOffset = tableOffset

    return output

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
    uint64.writeLE( buffer, this.currentLBA, offset + 24 )
    uint64.writeLE( buffer, this.backupLBA, offset + 32 )
    uint64.writeLE( buffer, this.firstLBA, offset + 40 )
    uint64.writeLE( buffer, this.lastLBA, offset + 48 )

    // GUID
    GPT.GUID.write( this.guid, buffer, offset + 56 )

    // Partition table descriptors
    uint64.writeLE( buffer, this.tableOffset, offset + 72 )
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

  },

  /**
   * Relocate the backup GPT to another LBA
   *
   * According to the UEFI spec, the backup GPT should always be located
   * at the end of the disk. For us, it means that we only support moving
   * it after its current location.
   *
   * @param {Number} [newLBA] - new LBA of the backup GPT header
   * @returns {Number} offset - offset between old and new location (bytes)
   */
  relocate( newLBA ) {
    // Check whether this is a primary or a backup GPT
    var isPrimary = this.backupLBA == 0 || this.currentLBA < this.backupLBA
    var offsetBlocks = 0

    // Set the new LBA of the backup GPT
    if( isPrimary ) {

      if( newLBA <= this.backupLBA ) {
        return 0
      }
      offsetBlocks = newLBA - this.backupLBA
      this.backupLBA = newLBA

    } else {

      if( newLBA <= this.currentLBA ) {
        return 0
      }
      offsetBlocks = newLBA - this.currentLBA
      this.currentLBA = newLBA
      this.tableOffset = newLBA - this.tableSizeBlocks

    }

    // Set the last usable LBA
    this.lastLBA = newLBA - this.tableSizeBlocks - 1

    return offsetBlocks * this.blockSize
  },

  /**
   * Resize a partition
   * @param {Number} partitionIndex
   * @param {Number} firstLBA
   * @param {Number} lastLBA
   * @returns {Number} size - new size of the partition (bytes)
   */
  resizePartition( partitionIndex, firstLBA, lastLBA ) {
    var nparts = this.partitions.length

    if( partitionIndex < 0 || partitionIndex >= nparts ) {
      throw new Error( `Invalid partition index: 0 <= partitionIndex <= ${nparts}` )
    }
    if( firstLBA >= lastLBA || firstLBA < 0 || lastLBA > this.lastLBA ) {
      throw new Error( `Invalid LBAs: 0 <= firstLBA < lastLBA <= this.lastLBA` )
    }

    var part = this.partitions[partitionIndex]
    var prevPart = partitionIndex > 0 ?
      this.partitions[partitionIndex - 1] :
      null
    var nextPart = partitionIndex < ( nparts - 1 ) ?
      this.partitions[partitionIndex + 1] :
      null

    if( prevPart && firstLBA <= prevPart.lastLBA ) {
      throw new Error( `Overlap with neighboring partitions: firstLBA` )
    }
    if( nextPart && lastLBA >= nextPart.firstLBA ) {
      throw new Error( `Overlap with neighboring partitions: lastLBA` )
    }

    part.firstLBA = firstLBA
    part.lastLBA = lastLBA

    return ( lastLBA - firstLBA ) * this.blockSize
  }

}
