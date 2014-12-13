var CRC32 = require( 'buffer-crc32' )
var GPT = require( '../' )

/**
 * GPT Partition Table Constructor
 * @param {Buffer} data
 */
function Table( data ) {
  
  if( !(this instanceof Table) )
    return new Table( data )
  
  // LBA of partition table
  this.offsetLBA = 2
  // Partition entry size in bytes
  this.entrySize = 128
  
  // Array of partition entries
  this.partitions = new Array( 128 )
  
  this._buffer = new Buffer( this.size )
  this._buffer.fill( 0 )
  
  if( data instanceof Buffer ) {
    this.buffer = data
  }
  
}

// Exports
module.exports = Table

/**
 * Table Prototype
 * @type {Object}
 */
Table.prototype = {
  
  constructor: Table,
  
  get size() {
    return this.entries * this.entrySize
  },
  
  get crc() {
    return CRC32.unsigned( this.buffer )
  },
  
  // Number of partition entries
  get entries() {
    return this.partitions.length
  },
  
  set entries( value ) {
    
    value = parseInt( value, 10 )
    
    // Must be at least 128, per spec
    if( value < 128 ) {
      throw new SyntaxError(
        'Invalid number of partition entries.' +
        'Must be at least 128'
      )
    }
    
    this.partitions.length = value
    
  },
  
  get buffer() {
    
    var i, entries = this.entries
    
    if( this._buffer.length !== this.size ) {
      this._buffer = new Buffer( this.size )
    }
    
    this._buffer.fill( 0 )
    
    for( i = 0; i < entries; i++ ) {
      if( this.partitions[i] ) {
        this.partitions[i].buffer.copy(
          this._buffer, i * this.entrySize
        )
      }
    }
    
    return this._buffer.slice()
    
  },
  
  set buffer( value ) {
    
    var buffer = Buffer.isBuffer( value ) ?
      value : new Buffer( value )
    
    if( this._buffer.length !== this.size ) {
      this._buffer = new Buffer( this.size )
    }
    
    this._buffer.fill( 0 )
    
    var i, entries = this.entries
    
    for( i = 0; i < entries; i++ ) {
      
      var offset = i * this.entrySize
      var end = offset + this.entrySize
      
      if( this.partitions[i] ) {
        this.partitions[i].buffer =
          buffer.slice( offset, end )
      } else {
        this.partitions[i] = new GPT.Partition(
          buffer.slice( offset, end )
        )
      }
      
    }
    
  }
  
}
