/**
 * GUID
 * @constructor
 * @returns {GUID}
 */
function GUID( buffer ) {

  if( !(this instanceof GUID) ) {
    return new GUID( buffer )
  }

  this.buffer = Buffer.alloc( 16, 0 )

  Buffer.isBuffer( buffer ) ?
    this.parse( buffer ) :
    this.fromString( buffer )

}

GUID.fromString = function( value ) {
  return new GUID().fromString( value )
}

function hex(n) {
  return ( '00' + n.toString( 16 ) ).substr( -2 )
}

/**
 * GUID prototype
 * @ignore
 */
GUID.prototype = {

  constructor: GUID,

  parse( buffer, offset ) {

    offset = offset || 0

    buffer.copy( this.buffer, 0, offset, offset + 16 )

    return this

  },

  write( buffer, offset ) {

    buffer = buffer || Buffer.alloc( 16 )
    offset = offset || 0

    this.buffer.copy( buffer, offset )

    return buffer

  },

  fromString( value ) {

    var string = ( value + '' )
      .replace( /[^0-9A-F]/gi, '' )

    this.buffer.write( string, 'hex' )

    return this

  },

  toString( dashes ) {

    var b = this.buffer
    var delimiter = dashes === false ? '' : '-'

    var string = '' +
      `${hex(b[3])}${hex(b[2])}${hex(b[1])}${hex(b[0])}` + delimiter +
      `${hex(b[5])}${hex(b[4])}` + delimiter +
      `${hex(b[7])}${hex(b[6])}` + delimiter +
      `${hex(b[8])}${hex(b[9])}` + delimiter +
      `${hex(b[10])}${hex(b[11])}${hex(b[12])}${hex(b[13])}` +
      `${hex(b[14])}${hex(b[15])}`

    return string.toUpperCase()

  },

  valueOf() {
    return this.toString()
  },

  inspect() {
    return `{${this.toString()}}`
  },

}

// Exports
module.exports = GUID
