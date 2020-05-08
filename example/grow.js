var fs = require( 'fs' )
var MBR = require( 'mbr' )
var GPT = require( '..' )
var inspect = require( '../test/inspect' )
var utils = require( './utils' )

var argv = process.argv.slice( 2 )
var devicePath = argv.shift()

if( !devicePath ) {
  console.error(`
  Usage: node example/grow <imagefile>

  Examples:
    - Linux / Mac OS: node example/grow disk-image.img
    - Windows: node example/grow disk-image.img

  WARN: The image file is modified in place by this example!
  NOTE: This assumes a block size of 512 bytes
`)
  process.exit(1)
}

var blockSize = 512
var fd = null

try {
  fd = fs.openSync( devicePath, 'r+' )
} catch( error ) {
  console.error( 'Couldn\'t open device for reading/writing:\n', error.message )
  process.exit( 1 )
}

var mbr = utils.readMBR( fd, blockSize )

console.log( 'Master Boot Record:', inspect( mbr ) )
console.log( '' )

var efiPart = mbr.getEFIPart()

if( efiPart == null ) {
  return console.error( 'No EFI partition found' )
}

console.log( 'EFI Partition:', inspect( efiPart ) )
console.log( '' )

var primaryGPT = utils.readPrimaryGPT( fd, blockSize, efiPart )

console.log( 'Primary GPT:', inspect( primaryGPT ) )
console.log( '' )

var backupGPT = utils.readBackupGPT( fd, primaryGPT )

console.log( 'Backup GPT:', inspect( backupGPT ) )
console.log( '' )

// Get the size of the raw image
var stats = fs.fstatSync(fd)
if( stats.isBlockDevice() ) {
  console.error( 'Block devices are not supported by this example' )
  process.exit( 1 )
}
var sizeInBytes = stats.size
if( sizeInBytes % blockSize != 0 ) {
  console.error( 'sizeInBytes is not a multiple of blockSize!' )
  process.exit( 1 )
}
var sizeInBlocks = sizeInBytes / blockSize

console.log('File size:', sizeInBytes, 'bytes,', sizeInBlocks, 'blocks')

// Relocate the backup GPT
var offset1 = primaryGPT.relocate( sizeInBlocks - 1 )
var offset2 = backupGPT.relocate( sizeInBlocks - 1 )
if( offset1 != offset2 ) {
  console.error( 'Offset mismatch:', offset1, '!=', offset2 )
  process.exit( 1 )
}
console.log( 'Backup GPT was moved', offset1, 'bytes forward' )

// Grow the last partition then
var nparts = primaryGPT.partitions.length
if( nparts > 0 ) {
  var part = nparts - 1
  var firstLBA = primaryGPT.partitions[part].firstLBA
  var lastLBA = primaryGPT.lastLBA
  var size1 = primaryGPT.resizePartition(part, firstLBA, lastLBA )
  var size2 = backupGPT.resizePartition(part, firstLBA, lastLBA )
  if( size1 != size2 ) {
    console.error( 'Size mismatch:', size1, '!=', size2 )
    process.exit( 1 )
  }
  console.log( 'Last partition resized, is now', size1, 'bytes' )
}

utils.writePrimaryGPT( fd, primaryGPT )
utils.writeBackupGPT( fd, backupGPT )

fs.closeSync( fd )
