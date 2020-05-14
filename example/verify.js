var fs = require( 'fs' )
var MBR = require( 'mbr' )
var GPT = require( '..' )
var inspect = require( '../test/inspect' )
var utils = require( './utils' )

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

var blockSize = 512
var fd = null

try {
  fd = fs.openSync( devicePath, 'r' )
} catch( error ) {
  console.error( 'Couldn\'t open device for reading:\n', error.message )
  process.exit( 1 )
}

var mbr = utils.readMBR( fd, blockSize )

console.log( 'Master Boot Record:', inspect( mbr ) )
console.log( '' )

var efiPart = mbr.getEFIPart()

if( efiPart == null ) {
  console.error( 'No EFI partition found' )
  process.exit( 1 )
}

console.log( 'EFI Partition:', inspect( efiPart ) )
console.log( '' )

var primaryGPT = utils.readPrimaryGPT( fd, blockSize, efiPart )

console.log( 'Primary GPT:', inspect( primaryGPT ) )
console.log( '' )

var backupGPT = utils.readBackupGPT( fd, primaryGPT )

console.log( 'Backup GPT:', inspect( backupGPT ) )
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
