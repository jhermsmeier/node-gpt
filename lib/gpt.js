var CRC32 = require( 'buffer-crc32' )
var readUInt64LE = require( './bytes' ).readUInt64LE
var writeUInt64LE = require( './bytes' ).writeUInt64LE

/**
 * GUID Partition Table Constructor
 * @param {Object} data
 */
function GPT( data ) {
  
  if( !(this instanceof GPT) )
    return new GPT( data )
  
  this.guid = new GPT.GUID()
  this.blockSize = 512
  this.revision = 0 // TODO
  this.headerSize = 92
  this.headerCRC = 0
  
  this.currentLBA = 1
  this.backupLBA = -1
  this.firstLBA = 34
  this.lastLBA = -34
  
  this.table = new GPT.PartitionTable()
  
  this._buffer = new Buffer( 92 )
  this._buffer.fill( 0 )
  
  if( data instanceof Buffer ) {
    this.buffer = data
  }
  
}

// Exports
module.exports = GPT

// GPT Partition Entry
GPT.Partition = require( './partition' )
// GPT Partition Entry
GPT.PartitionTable = require( './partition-table' )
// GPT GUID
GPT.GUID = require( './guid' )

GPT.SIGNATURE = 'EFI PART'

GPT.DIFF = {
  NONE:   0,
  HEADER: 1,
  TABLE:  2,
  BOTH:   3,
}

/**
 * GPT Prototype
 * @type {Object}
 */
GPT.prototype = {
  
  constructor: GPT,
  
  get size() {
    return this.blockSize *
      ( this.firstLBA - this.currentLBA )
  },
  
  get buffer() {
    
    this._buffer.write( GPT.SIGNATURE, 0, 8, 'ascii' )
    
    this._buffer.writeUInt32LE( this.revision, 8 )
    
    this._buffer.writeUInt32LE( this.headerSize, 12 )
    
    // Zero the CRC field for checksum calulation
    this._buffer.writeUInt32LE( 0, 16 )
    
    writeUInt64LE( this._buffer, this.currentLBA, 24 )
    writeUInt64LE( this._buffer, this.backupLBA, 32 )
    writeUInt64LE( this._buffer, this.firstLBA, 40 )
    writeUInt64LE( this._buffer, this.lastLBA, 48 )
    
    this.guid.buffer.copy( this._buffer, 56 )
    
    writeUInt64LE( this._buffer, this.table.offsetLBA, 72 )
    
    this._buffer.writeUInt32LE( this.table.entries, 80 )
    this._buffer.writeUInt32LE( this.table.entrySize, 84 )
    this._buffer.writeUInt32LE( this.table.crc, 88 )
    
    // Calculate checksum
    this.headerCRC = CRC32.unsigned(
      this._buffer.slice( 0, this.headerSize )
    )
    
    // And write it to the buffer
    this._buffer.writeUInt32LE( this.headerCRC, 16 )
    
    // Calculate table offset from header beginning
    var tableOffset = this.table.offsetLBA - this.currentLBA
        tableOffset = tableOffset * this.blockSize
    
    // Create a new zeroed buffer to copy to
    var buffer = new Buffer( this.size )
        buffer.fill( 0 )
    
    // Concat header and table buffers
    this._buffer.copy( buffer, 0, 0, this.blockSize )
    this.table.buffer.copy( buffer, tableOffset )
    
    return buffer
    
  },
  
  set buffer( value ) {
    
    // Make sure we have a buffer
    var buffer = ( value instanceof Buffer ) ?
      value : new Buffer( value )
    
    var signature = buffer.toString( 'ascii', 0, 8 )
    if( signature !== GPT.SIGNATURE ) {
      throw new SyntaxError(
        'Invalid GPT header signature "' + signature + '" ' +
        '(should be "EFI PART")'
      )
    }
    
    // Check for min header size
    if( buffer.length < 92 ) {
      throw new SyntaxError(
        'Buffer too small.' +
        'Minimum header size is 92 bytes.'
      )
    }
    
    this.revision = buffer.readUInt32LE( 8 )
    
    this.headerSize = buffer.readUInt32LE( 12 )
    
    // Check minimum buffer size after reading
    // the actual header size value
    if( buffer.length < this.headerSize ) {
      throw new SyntaxError( 'Buffer too small' )
    }
    
    // Account for buffer size changes
    if( this._buffer.length !== this.headerSize ) {
      this._buffer = buffer.slice( 0, this.headerSize )
    }
    
    this.headerCRC = buffer.readUInt32LE( 16 )
    
    this.currentLBA = readUInt64LE( buffer, 24 )
    this.backupLBA = readUInt64LE( buffer, 32 )
    this.firstLBA = readUInt64LE( buffer, 40 )
    this.lastLBA = readUInt64LE( buffer, 48 )
    
    this.guid = new GPT.GUID( buffer.slice( 56, 72 ) )
    
    this.table.offsetLBA = readUInt64LE( buffer, 72 )
    
    this.table.entries   = buffer.readUInt32LE( 80 )
    this.table.entrySize = buffer.readUInt32LE( 84 )
    // Has become useless, since 'table.crc' is a getter:
    // this.table.crc = buffer.readUInt32LE( 88 )
    
    // Take care to not trash the partition table,
    // if only the header is passed in
    var tableOffset = ( this.table.offsetLBA - this.firstLBA ) * this.blockSize
    if( buffer.length >= tableOffset + this.table.size ) {
      this.table.buffer = buffer.slice( tableOffset )
    }
    
  },
  
  compare: function( other ) {
    
    if( this.headerCRC !== other.headerCRC ) {
      if( this.table.crc !== other.table.crc ) {
        return GPT.DIFF.BOTH
      }
      return GPT.DIFF.HEADER
    }
    
    if( this.table.crc !== other.table.crc ) {
      return GPT.DIFF.TABLE
    }
    
    return GPT.DIFF.NONE
    
  }
  
}
