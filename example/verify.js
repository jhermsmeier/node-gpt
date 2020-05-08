var fs = require( 'fs' )
var MBR = require( 'mbr' )
var GPT = require( '..' )
var inspect = require( '../test/inspect' )

var argv = process.argv.slice( 2 )
var devicePath = argv.shift()

if( !devicePath ) {
  console.error(`
  Usage: node example/verify <device>

  Examples:
    - Linux / Mac OS: node example/verify /dev/rdisk2
    - Windows: node example/verify \\.\PhysicalDrive0

  NOTE: This assumes a block size of 512 bytes
`)
  process.exit(1)
}

console.log( '' )

var blockSize = 512
var fd = null

try {
  fd = fs.openSync( devicePath, 'r' )
} catch( error ) {
  console.error( 'Couldn\'t open device for reading:\n', error.message )
  process.exit( 1 )
}

function readMBR() {
  var buffer = Buffer.alloc( blockSize )
  fs.readSync( fd, buffer, 0, buffer.length, 0 )
  return MBR.parse( buffer )
}

function readPrimaryGPT(efiPart) {

  // NOTE: You'll need to know / determine the logical block size of the storage device;
  // For the sake of brevity, we'll just go with the still most common 512 bytes
  var gpt = new GPT({ blockSize: blockSize })
  var offset = efiPart.firstLBA * gpt.blockSize
  // The default GPT is 33 blocks in length (1 block header, 32 block table)
  var buffer = Buffer.alloc( 33 * gpt.blockSize )

  fs.readSync( fd, buffer, 0, buffer.length, offset )
  gpt.parse( buffer )

  return gpt

}

// function readPrimaryGPT(efiPart) {

//   // NOTE: You'll need to know / determine the logical block size of the storage device;
//   // For the sake of brevity, we'll just go with the still most common 512 bytes
//   var gpt = new GPT({ blockSize: 512 })

//   // First, we need to read & parse the GPT header, which will declare various
//   // sizes and offsets for us to calculate where & how long the table and backup are
//   var offset = efiPart.firstLBA * gpt.blockSize
//   var headerBuffer = Buffer.alloc( gpt.blockSize )

//   fs.readSync( fd, headerBuffer, 0, headerBuffer.length, offset )
//   gpt.parseHeader( headerBuffer )

//   // Now on to reading the actual partition table
//   var tableBuffer = Buffer.alloc( gpt.tableSize )
//   var tableOffset = gpt.tableOffset * gpt.blockSize
//   fs.readSync( fd, tableBuffer, 0, tableBuffer.length, tableOffset )

//   // We need to parse the first 4 partition entries & the rest separately
//   // as the first 4 table entries always occupy one block,
//   // with the rest following in subsequent blocks
//   gpt.parseTable( tableBuffer, 0, gpt.blockSize )
//   gpt.parseTable( tableBuffer, gpt.blockSize, gpt.tableSize )

//   return gpt

// }

function readBackupGPT(primaryGPT) {

  var backupGPT = new GPT({ blockSize: primaryGPT.blockSize })
  var buffer = Buffer.alloc( 33 * primaryGPT.blockSize )
  var offset = ( primaryGPT.backupLBA - 32 ) * primaryGPT.blockSize

  fs.readSync( fd, buffer, 0, buffer.length, offset )
  backupGPT.parseBackup( buffer )

  return backupGPT

}

var mbr = readMBR()

console.log( 'Master Boot Record:', inspect( mbr ) )
console.log( '' )

var efiPart = mbr.getEFIPart()

if( efiPart == null ) {
  return console.error( 'No EFI partition found' )
}

console.log( 'EFI Parition:', inspect( efiPart ) )
console.log( '' )

var primaryGPT = readPrimaryGPT(efiPart)

console.log( 'Primary:', inspect( primaryGPT ) )
console.log( '' )

var backupGPT = readBackupGPT(primaryGPT)

console.log( 'Backup:', inspect( backupGPT ) )
console.log( '' )

// Check header & table checksums for primary and backup GPT
var isPrimaryValid = primaryGPT.verify() // true
var isBackupValid = backupGPT.verify() // true

// Compare primary & backup GPT table checksums to
// verify both are in the same state
// NOTE: If there's a `gpt.headerChecksum` match, something's wrong,
// as the primary and backup should refer to each other in offsets
var checksumsMatch = primaryGPT.tableChecksum === backupGPT.tableChecksum &&
  primaryGPT.headerChecksum !== backupGPT.headerChecksum

if( isPrimaryValid && isBackupValid && checksumsMatch ) {
  return console.log('[OK]')
}

if( !isPrimaryValid ) {
  console.error( `[ERROR]: Primary GPT checksum mismatch` )
  process.exit( 1 )
}

if( !isBackupValid ) {
  console.error( `[ERROR]: Backup GPT checksum mismatch` )
  process.exit( 1 )
}

if( !checksumsMatch ) {
  console.error( `[ERROR]: Primary & Backup GPT mismatch` )
  process.exit( 1 )
}

fs.closeSync( fd )
