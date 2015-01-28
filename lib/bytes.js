var Int64 = require( 'node-int64' )

module.exports = {
  
  /**
   * Reads an unsigned 64 bit integer from a buffer
   * @param  {Buffer} buffer
   * @param  {Number} offset
   * @return {Number}
   */
  readUInt64LE: function( buffer, offset ) {
    return parseInt( new Int64(
      buffer.readUInt32LE( offset + 4 ),
      buffer.readUInt32LE( offset )
    ).toOctetString(), 16 )
  },
  
  /**
   * Writes an unsigned 64 bit integer to a buffer
   * @param  {Buffer} buffer
   * @param  {Number} value
   * @param  {Number} offset
   * @return {Undefined}
   */
  writeUInt64LE: function( buffer, value, offset ) {
    var int64 = new Int64( value ).toBuffer()
    buffer.writeUInt32LE( int64.readUInt32BE( 0 ), offset + 4 )
    buffer.writeUInt32LE( int64.readUInt32BE( 4 ), offset )
  },
  
}
