var uint64 = module.exports
var MAX_UINT32 = Math.pow( 2, 32 )

uint64.readLE = function( buffer, offset ) {
  offset = offset || 0
  var hi = buffer.readUInt32LE( offset + 4 )
  var lo = buffer.readUInt32LE( offset )
  return hi * MAX_UINT32 + lo
}

uint64.writeLE = function( buffer, value, offset ) {
  offset = offset || 0
  var hi = Math.floor( value / MAX_UINT32 )
  var lo = value - hi * MAX_UINT32
  buffer.writeUInt32LE( hi, offset + 4 )
  buffer.writeUInt32LE( lo, offset )
  return offset + 8
}

uint64.readBE = function( buffer, offset ) {
  offset = offset || 0
  var hi = buffer.readUInt32BE( offset )
  var lo = buffer.readUInt32BE( offset + 4 )
  return hi * MAX_UINT32 + lo
}

uint64.writeBE = function( buffer, value, offset ) {
  offset = offset || 0
  var hi = Math.floor( value / MAX_UINT32 )
  var lo = value - hi * MAX_UINT32
  buffer.writeUInt32BE( hi, offset )
  buffer.writeUInt32BE( lo, offset + 4 )
  return offset + 8
}
