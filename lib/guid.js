var GUID = module.exports

/**
 * Empty GUID
 * @type {String}
 * @constant
 */
GUID.ZERO = '00000000-0000-0000-0000-000000000000'

GUID.HEX = []
GUID.DEC = new Map()

// Generate hex <-> dec lookup tables
void function() {
  var hex = ''
  for( var i = 0; i < 256; i++ ) {
    hex = ( i + 0x100 ).toString( 16 ).substr( 1 ).toUpperCase()
    GUID.HEX[i] = hex
    GUID.DEC.set( hex, i )
  }
}()

/**
 * Stringify a GUID from a buffer
 * @param {Buffer} buffer
 * @param {Number} [offset=0]
 * @returns {String}
 */
GUID.toString = function( buffer, offset ) {

  offset = offset || 0

  var guid = GUID.HEX[ buffer[ offset + 3 ] ] + GUID.HEX[ buffer[ offset + 2 ] ] +
    GUID.HEX[ buffer[ offset + 1 ] ] + GUID.HEX[ buffer[ offset + 0 ] ] + '-' +
    GUID.HEX[ buffer[ offset + 5 ] ] + GUID.HEX[ buffer[ offset + 4 ] ] + '-' +
    GUID.HEX[ buffer[ offset + 7 ] ] + GUID.HEX[ buffer[ offset + 6 ] ] + '-' +
    GUID.HEX[ buffer[ offset + 8 ] ] + GUID.HEX[ buffer[ offset + 9 ] ] + '-' +
    GUID.HEX[ buffer[ offset + 10 ] ] + GUID.HEX[ buffer[ offset + 11 ] ] +
    GUID.HEX[ buffer[ offset + 12 ] ] + GUID.HEX[ buffer[ offset + 13 ] ] +
    GUID.HEX[ buffer[ offset + 14 ] ] + GUID.HEX[ buffer[ offset + 15 ] ]

  return guid.toUpperCase()

}

/**
 * Write a GUID to a buffer
 * @param {String} value
 * @param {Buffer} [buffer]
 * @param {Number} [offset=0]
 * @returns {Buffer}
 */
GUID.write = function( value, buffer, offset ) {

  offset = offset || 0
  buffer = buffer || Buffer.allocUnsafe( offset + 16 )

  var pattern = /[0-9A-F]{2}/g
  var values = value.toUpperCase().match( pattern )

  buffer[ offset + 3 ] = GUID.DEC.get( values[ 0 ] )
  buffer[ offset + 2 ] = GUID.DEC.get( values[ 1 ] )
  buffer[ offset + 1 ] = GUID.DEC.get( values[ 2 ] )
  buffer[ offset + 0 ] = GUID.DEC.get( values[ 3 ] )

  buffer[ offset + 5 ] = GUID.DEC.get( values[ 4 ] )
  buffer[ offset + 4 ] = GUID.DEC.get( values[ 5 ] )

  buffer[ offset + 7 ] = GUID.DEC.get( values[ 6 ] )
  buffer[ offset + 6 ] = GUID.DEC.get( values[ 7 ] )

  buffer[ offset + 8 ] = GUID.DEC.get( values[ 8 ] )
  buffer[ offset + 9 ] = GUID.DEC.get( values[ 9 ] )

  buffer[ offset + 10 ] = GUID.DEC.get( values[ 10 ] )
  buffer[ offset + 11 ] = GUID.DEC.get( values[ 11 ] )
  buffer[ offset + 12 ] = GUID.DEC.get( values[ 12 ] )
  buffer[ offset + 13 ] = GUID.DEC.get( values[ 13 ] )
  buffer[ offset + 14 ] = GUID.DEC.get( values[ 14 ] )
  buffer[ offset + 15 ] = GUID.DEC.get( values[ 15 ] )

  return buffer

}

// Exports
module.exports = GUID
