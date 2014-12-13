var CRC32 = require( 'buffer-crc32' )
var readUInt64LE = require( './bytes' ).readUInt64LE
var writeUInt64LE = require( './bytes' ).writeUInt64LE

/**
 * GUID Partition Table Constructor
 * @return {GPT}
 */
function GPT( options ) {
  
  if( !(this instanceof GPT) )
    return new GPT( options )
  
  options = options != null ?
    options : {}
  
  this.guid = new GPT.GUID()
  this.blockSize = options.blockSize || 512
  this.revision = 0 // TODO
  this.headerSize = 92
  this.headerCRC = 0
  
  this.currentLBA = 1
  this.backupLBA = -1
  this.firstLBA = 34
  this.lastLBA = -34
  
  // LBA of partition table
  this.tableOffset = 2
  // Number of partition table entries
  this.entries = 128
  // Partition entry size in bytes
  this.entrySize = 128
  // Partition tables CRC
  this.tableCRC = 0
  
  // Array of partition entries
  this.partitions = []
  
}

GPT.SIGNATURE = 'EFI PART'

GPT.GUID = require( './guid' )
GPT.Partition = require( './partition' )

GPT.parse = function( buffer ) {
  return new GPT().parse( buffer )
}

/**
 * GUID Partition Table Prototype
 * @type {Object}
 */
GPT.prototype = {
  
  constructor: GPT,
  
  parse: function( buffer ) {
    
    // Check minimum buffer size after reading
    // the actual header size value
    var headerSize = buffer.readUInt32LE( 12 )
    if( buffer.length < headerSize ) {
      throw new Error(
        'Header is missing bytes (should be ' + this.headerSize + ',' + 
        'but is ' + buffer.length + ')'
      )
    }
    
    // Attempt to parse the partition table header
    this.parseHeader( buffer )
    
    // Calculate byte offset of partition table within buffer
    var tableSize = this.entries * this.entrySize
    var tableOffset = ( this.tableOffset * this.blockSize ) -
      ( this.currentLBA * this.blockSize )
    
    // Attempt to parse the partition table,
    // if the buffer is large enough
    if( buffer.length >= ( tableOffset + tableSize ) )
      this.parseTable( buffer.slice( tableOffset ) )
    
    return this
    
  },
  
  parseHeader: function( buffer ) {
    
    // Check for min header size
    if( buffer.length < 92 ) {
      throw new Error( 'Buffer too small.' +
        'Minimum header size is 92 bytes.'
      )
    }
    
    // Check for correct magic / signature
    var signature = buffer.toString( 'ascii', 0, 8 )
    if( signature !== GPT.SIGNATURE ) {
      throw new Error(
        'Invalid GPT header signature "' + signature + '" ' +
        '(should be "' + GPT.SIGNATURE + '")'
      )
    }
    
    // Header descriptors
    this.revision = buffer.readUInt32LE( 8 )
    this.headerSize = buffer.readUInt32LE( 12 )
    this.headerCRC = buffer.readUInt32LE( 16 )
    
    // Location descriptors
    this.currentLBA = readUInt64LE( buffer, 24 )
    this.backupLBA = readUInt64LE( buffer, 32 )
    this.firstLBA = readUInt64LE( buffer, 40 )
    this.lastLBA = readUInt64LE( buffer, 48 )
    
    // GUID
    this.guid.buffer = buffer.slice( 56, 72 )
    
    // Partition table descriptors
    this.tableOffset = readUInt64LE( buffer, 72 )
    this.entries   = buffer.readUInt32LE( 80 )
    this.entrySize = buffer.readUInt32LE( 84 )
    this.tableCRC = buffer.readUInt32LE( 88 )
    
    return this
    
  },
  
  parseTable: function( buffer ) {
    
    // Clean out our partition array
    this.partitions.length = 0
    
    // Check for partition table buffer size
    var tableSize = this.entries * this.entrySize
    if( buffer.length < tableSize ) {
      throw new Error(
        'Partition table buffer too small ' +
        '(should be ' + entrySize + ', but is ' + buffer.length + ')'
      )
    }
    
    var entries = this.entries
    var offset = 0
    
    // Slice & parse partition entries
    while( entries-- ) {
      var part = GPT.Partition.parse(
        buffer.slice( offset, offset += this.entrySize )
      )
      if( part.type.toString() !== '00000000-0000-0000-0000-000000000000' ) {
        this.partitions.push( part )
      }
    }
    
    return this
    
  },
  
  toBuffer: function( emitHeader, emitTable ) {
    
    var header = new Buffer( 0 )
    var table = new Buffer( 0 )
    var padding = new Buffer( 0 )
    
    // Write out the partition table header
    if( emitHeader !== false ) {
      
      header = new Buffer( this.headerSize )
      header.fill( 0 )
      
      // Signature
      header.write( GPT.SIGNATURE, 0, 8, 'ascii' )
      
      // Header descriptors
      header.writeUInt32LE( this.revision, 8 )
      header.writeUInt32LE( this.headerSize, 12 )
      // NOTE: headerCRC must be zeroed prior to it's calculation
      // header.writeUInt32LE( this.headerCRC, 16 )
      
      // Location descriptors
      writeUInt64LE( header, this.currentLBA, 24 )
      writeUInt64LE( header, this.backupLBA, 32 )
      writeUInt64LE( header, this.firstLBA, 40 )
      writeUInt64LE( header, this.lastLBA, 48 )
      
      // GUID
      this.guid.buffer.copy( header, 56 )
      
      // Partition table descriptors
      writeUInt64LE( header, this.tableOffset, 72 )
      header.writeUInt32LE( this.entries, 80 )
      header.writeUInt32LE( this.entrySize, 84 )
      header.writeUInt32LE( this.tableCRC, 88 )
      
      // Calculate the header's CRC with the
      // 'headerCRC' field zeroed out
      var headerCRC = CRC32.unsigned( header )
      
      // Write the header's CRC to the buffer
      header.writeUInt32LE( headerCRC, 16 )
      
    }
    
    // Calculate padding if both header, and table
    // are supposed to be emitted
    if( emitHeader !== false && emitTable !== false ) {
      
      var tableOffset = ( this.tableOffset * this.blockSize ) -
        ( this.currentLBA * this.blockSize )
      
      padding = new Buffer( tableOffset - header.length )
      padding.fill( 0 )
      
    }
    
    // Write out the partition table
    if( emitTable !== false ) {
      
      var tableSize = this.entries * this.entrySize
      var offset = 0
      
      table = new Buffer( tableSize )
      table.fill( 0 )
      
      for( var i = 0; i < this.partitions.length; i++ ) {
        this.partitions[i].toBuffer( this.entrySize )
          .copy( table, offset )
        offset += this.entrySize
      }
      
      // Calculate the table's CRC and
      // write it to the header's buffer, if present
      if( header.length > 0 ) {
        var tableCRC = CRC32.unsigned( table )
        header.writeUInt32LE( tableCRC, 88 )
      }
      
    }
    
    return Buffer.concat([ header, padding, table ])
    
  },
  
}

// Exports
module.exports = GPT
