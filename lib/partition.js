var GUID = require( './guid' )

/**
 * GPT Partition Constructor
 * @return {Partition}
 */
function Partition( options ) {

  if( !(this instanceof Partition) )
    return new Partition( options )

  options = options != null ?
    options : {}

  this.type = new GUID( options.type )
  this.guid = new GUID( options.guid )
  this.name = options.name || ''

  this.attr = new Buffer( 8 )
  this.attr.fill( 0 )

  this.firstLBA = options.firstLBA || -1
  this.lastLBA = options.lastLBA || -1

}

Partition.parse = function( buffer ) {
  return new Partition().parse( buffer )
}

/**
 * GPT Partition Prototype
 * @type {Object}
 */
Partition.prototype = {

  constructor: Partition,

  isEmpty: function() {
    return this.type.toString() ===
      '00000000-0000-0000-0000-000000000000'
  },

  parse: function( buffer ) {

    this.type.buffer = buffer.slice( 0, 16 )
    this.guid.buffer = buffer.slice( 16, 32 )

    buffer.copy( this.attr, 0, 48, 56 )

    this.firstLBA = buffer.readUIntLE( 32, 8 )
    this.lastLBA = buffer.readUIntLE( 40, 8 )

    this.name = buffer.toString( 'ucs2', 56, 128 )
      .replace( /\x00/g, '' )

    return this

  },

  toBuffer: function( size ) {

    var buffer = new Buffer( size || 128 )
    buffer.fill( 0 )

    this.type.buffer.copy( buffer, 0 )
    this.guid.buffer.copy( buffer, 16 )

    buffer.writeUIntLE( this.firstLBA, 32, 8 )
    buffer.writeUIntLE( this.lastLBA, 40, 8 )

    this.attr.copy( buffer, 48 )

    buffer.write( this.name, 56, 'ucs2' )

    return buffer

  },

}

// Exports
module.exports = Partition

