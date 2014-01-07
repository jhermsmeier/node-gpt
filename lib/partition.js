var CRC32 = require( 'buffer-crc32' )
var Int64 = require( 'int64-native' )
var GPT = require( '../' )

/**
 * GPT Partition Constructor
 * @param {Buffer} data
 */
function Partition( data ) {
  
  if( !(this instanceof Partition) )
    return new Partition( data )
  
  this.type = new GPT.GUID()
  this.guid = new GPT.GUID()
  this.name = ''
  this.info = {}
  this.attr = new Buffer( 8 )
  this.attr.fill( 0 )
  
  this.firstLBA = 0
  this.lastLBA = 0
  
  this._buffer = new Buffer( 128 )
  this._buffer.fill( 0 )
  
  if( data instanceof Buffer ) {
    this.buffer = data
  }
  
}

// Exports
module.exports = Partition

/**
 * Partition Type Table
 * @type {Object}
 */
Partition.TYPES = require( './partition-types' )

/**
 * Partition Prototype
 * @type {Object}
 */
Partition.prototype = {
  
  constructor: Partition,
  
  get buffer() {
    
    this.type.buffer.copy( this._buffer, 0 )
    this.guid.buffer.copy( this._buffer, 16 )
    
    this._buffer.write( this.name, 56, 'ucs2' )
    
    this.attr.copy( this._buffer, 48 )
    
    var firstLBA = new Int64( this.firstLBA )
    
    this._buffer.writeUInt32LE( firstLBA.low32(), 32 )
    this._buffer.writeUInt32LE( firstLBA.high32(), 36 )
    
    var lastLBA = new Int64( this.lastLBA )
    
    this._buffer.writeUInt32LE( lastLBA.low32(), 40 )
    this._buffer.writeUInt32LE( lastLBA.high32(), 44 )
    
    return this._buffer.slice()
    
  },
  
  set buffer( value ) {
    
    var buffer = ( value instanceof Buffer ) ?
      value : new Buffer( value )
    
    this.type.buffer = buffer.slice( 0, 16 )
    this.guid.buffer = buffer.slice( 16, 32 )
    
    this.info = Partition.TYPES[ this.type.string ]
    
    this.name = buffer.toString( 'ucs2', 56, 128 )
      .replace( /\x00/g, '' )
    
    buffer.copy( this.attr, 0, 48, 56 )
    
    this.firstLBA = +(new Int64(
      buffer.readUInt32LE( 36 ),
      buffer.readUInt32LE( 32 )
    ).toUnsignedDecimalString())
    
    this.lastLBA = +(new Int64(
      buffer.readUInt32LE( 44 ),
      buffer.readUInt32LE( 40 )
    ).toUnsignedDecimalString())
    
  }
  
}
