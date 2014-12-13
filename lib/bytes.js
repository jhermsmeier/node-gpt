var Int64 = require( 'int64-native' )

module.exports = {
  
  readUInt64LE: function( buffer, offset ) {
    return +(new Int64(
      buffer.readUInt32LE( offset + 4 ),
      buffer.readUInt32LE( offset )
    ).toUnsignedDecimalString())
  },
  
  writeUInt64LE: function( buffer, value, offset ) {
    var num = new Int64( value )
    buffer.writeUInt32LE( num.low32(), offset )
    buffer.writeUInt32LE( num.high32(), offset + 4 )
  },
  
}
