var CRC32 = require( 'buffer-crc32' )

/**
 * GUID Partition Table Constructor
 * @return {GPT}
 */
function GPT( options ) {
  
  if( !(this instanceof GPT) )
    return new GPT( options )
  
  options = options != null ?
    options : {}
  
  this.blockSize = options.blockSize || 512
  
  // Metadata
  this.guid = new GPT.GUID()
  this.revision = 0 // TODO
  this.headerSize = options.headerSize || 92
  this.headerCRC = 0
  
  // Logical block addresses (LBAs)
  this.currentLBA = options.currentLBA || 1
  this.backupLBA = options.backupLBA || -1
  this.firstLBA = options.firstLBA || 34
  this.lastLBA = options.lastLBA || -34
  
  // LBA of partition table
  this.tableOffset = options.tableOffset || 2
  // Number of partition table entries
  this.entries = options.entries || 128
  // Partition entry size in bytes
  this.entrySize = options.entrySize || 128
  // Partition tables CRC
  this.tableCRC = 0
  
  // Array of partition entries
  this.partitions = []
  
}

/**
 * GPT magic signature
 * @type {String}
 */
GPT.SIGNATURE = 'EFI PART'

/**
 * GPT GUID structure constructor
 * @type {Function}
 */
GPT.GUID = require( './guid' )

/**
 * GPT Partition structure constructor
 * @type {Function}
 */
GPT.Partition = require( './partition' )

/**
 * Parses a given buffer with options
 * @param  {Buffer} buffer
 * @param  {Object} options
 * @return {GPT}
 */
GPT.parse = function( buffer, options ) {
  return new GPT( options ).parse( buffer )
}

/**
 * GUID Partition Table Prototype
 * @type {Object}
 */
GPT.prototype = {
  
  constructor: GPT,
  
  get tableSize() {
    return this.entries * this.entrySize
  },
  
  /**
   * Parses a complete GPT from a buffer
   * @param  {Buffer} buffer
   * @return {GPT}
   */
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
    var tableOffset = ( this.tableOffset * this.blockSize ) -
      ( this.currentLBA * this.blockSize )
    
    // Attempt to parse the partition table,
    // if the buffer is large enough
    if( buffer.length >= ( tableOffset + this.tableSize ) )
      this.parseTable( buffer.slice( tableOffset ) )
    
    return this
    
  },
  
  /**
   * Parses the GPT header
   * @param  {Buffer} buffer
   * @return {GPT}
   */
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
    this.currentLBA = buffer.readUIntLE( 24, 8 )
    this.backupLBA = buffer.readUIntLE( 32, 8 )
    this.firstLBA = buffer.readUIntLE( 40, 8 )
    this.lastLBA = buffer.readUIntLE( 48, 8 )
    
    // GUID
    this.guid.buffer = buffer.slice( 56, 72 )
    
    // Partition table descriptors
    this.tableOffset = buffer.readUIntLE( 72, 8 )
    this.entries   = buffer.readUInt32LE( 80 )
    this.entrySize = buffer.readUInt32LE( 84 )
    this.tableCRC = buffer.readUInt32LE( 88 )
    
    return this
    
  },
  
  /**
   * Parses the partition table part
   * @param  {Buffer} buffer
   * @return {GPT}
   */
  parseTable: function( buffer ) {
    
    // Clean out our partition array
    this.partitions.length = 0
    
    // Check for partition table buffer size
    if( buffer.length < this.tableSize ) {
      throw new Error(
        'Partition table buffer too small ' +
        '(should be ' + this.tableSize + ', but is ' + buffer.length + ')'
      )
    }
    
    var entries = this.entries
    var offset = 0
    
    // Slice & parse partition entries
    while( entries-- ) {
      var part = GPT.Partition.parse(
        buffer.slice( offset, offset += this.entrySize )
      )
      if( !part.isEmpty() ) {
        this.partitions.push( part )
      }
    }
    
    return this
    
  },
  
  /**
   * Verifies this GPT against a backup GPT,
   * and return the first found error
   * @param  {GPT}   backupGPT
   * @return {Error}
   */
  verify: function( backupGPT ) {
    
    var msg = ''
    
    if( backupGPT.headerCRC !== this.headerCRC ) {
      msg = 'Header CRC mismatch: ' +
        backupGPT.headerCRC.toString( 16 ).toUpperCase() + ' !== ' +
        this.headerCRC.toString( 16 ).toUpperCase()
      return new Error( msg )
    }
    
    if( backupGPT.tableCRC !== this.tableCRC ) {
      msg = 'Partition table CRC mismatch: ' +
        backupGPT.tableCRC.toString( 16 ).toUpperCase() + ' !== ' +
        this.tableCRC.toString( 16 ).toUpperCase()
      return new Error( msg )
    }
    
  },
  
  /**
   * Returns the raw buffer
   * representing the GPT on disk
   * @param  {Boolean} emitHeader
   * @param  {Boolean} emitTable
   * @return {Buffer}
   */
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
      // NOTE: headerCRC must be zeroed prior to it's calculation,
      // so do not `header.writeUInt32LE( this.headerCRC, 16 )`
      
      // Location descriptors
      header.writeUIntLE( this.currentLBA, 24, 8 )
      header.writeUIntLE( this.backupLBA, 32, 8 )
      header.writeUIntLE( this.firstLBA, 40, 8 )
      header.writeUIntLE( this.lastLBA, 48, 8 )
      
      // GUID
      this.guid.buffer.copy( header, 56 )
      
      // Partition table descriptors
      header.writeUIntLE( this.tableOffset, 72, 8 )
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
      
      var offset = 0
      
      table = new Buffer( this.tableSize )
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
