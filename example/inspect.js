var fs = require( 'fs' )
var MBR = require( 'mbr' )
var GPT = require( '..' )
var inspect = require( '../test/inspect' )
var utils = require( './utils' )

var argv = process.argv.slice( 2 )
var devicePath = argv.shift()

if( !devicePath ) {
  console.error(`
  Usage: node example/inspect <device>

  Examples:
    - Linux / Mac OS: node example/inspect /dev/rdisk2
    - Windows: node example/inspect \\.\PhysicalDrive0

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

var mbr = null

try {
  mbr = utils.readMBR( fd, blockSize )
} catch( error ) {
  console.log( 'No Master Boot Record found:\n', error.message )
  process.exit( 1 )
}

console.log( 'Master Boot Record:', inspect( mbr ) )
console.log( '' )

var efiPart = mbr.getEFIPart()

if( efiPart == null ) {
  console.error( 'No EFI partition found' )
  process.exit( 1 )
}

console.log( 'EFI Partition:', inspect( efiPart ) )
console.log( '' )

var primaryGPT = null

try {
  primaryGPT = utils.readPrimaryGPT( fd, blockSize, efiPart )
} catch( error ) {
  console.error( 'No GUID Partition Table found:\n', error.message )
  process.exit( 1 )
}

console.log( 'Primary GPT:', inspect( primaryGPT ) )
console.log( '' )

var backupGPT = null

try {
  backupGPT = utils.readBackupGPT( fd, primaryGPT )
} catch( error ) {
  console.error( 'Couldn\'t parse backup GPT:\n', error.message )
  process.exit( 1 )
}

console.log( 'Backup GPT:', inspect( backupGPT ) )
console.log( '' )

fs.closeSync( fd )
