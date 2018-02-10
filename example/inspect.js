var fs = require( 'fs' )
var path = require( 'path' )
var MBR = require( 'mbr' )
var GPT = require( '..' )
var inspect = require( '../test/inspect' )

var argv = process.argv.slice( 2 )
var devicePath = argv.shift()

if( !devicePath ) {
  console.log(`
  Usage: node example/inspect <device>

  Examples:
    - Linux / Mac OS: node example/inspect /dev/rdisk2
    - Windows: node example/inspect \\.\PhysicalDrive0

  NOTE: This assumes a block size of 512 bytes
`)
  process.exit(1)
}

var blockSize = 512
var fd = null

try {
  fd = fs.openSync( devicePath, 'r' )
} catch( error ) {
  console.log( 'Couldn\'t open device for reading:\n', error.message )
  process.exit( 1 )
}

var buffer = Buffer.alloc( blockSize )

fs.readSync( fd, buffer, 0, buffer.length, 0 )

var mbr = null

try {
  mbr = MBR.parse( buffer )
} catch( error ) {
  console.log( 'No Master Boot Record found:\n', error.message )
  process.exit( 1 )
}

var efiPart = mbr.getEFIPart()

if( !efiPart ) {
  console.log( 'No EFI partition detected' )
  process.exit( 1 )
}

var gpt = new GPT()

console.log( 'Read Master Boot Record:\n' )
inspect.log( mbr )
console.log( '' )
console.log( 'Found EFI Partition:\n\n', inspect( efiPart ) )
console.log( '' )

buffer = Buffer.alloc( blockSize * 33 )

fs.readSync( fd, buffer, 0, buffer.length, efiPart.firstLBA * blockSize )

try {
  gpt.parse( buffer )
} catch( error ) {
  console.log( 'No GUID Partition Table found:\n', error.message )
  process.exit( 1 )
}

console.log( 'Read GUID Partition Table:\n\n', inspect( gpt ) )
console.log( '' )

var backupGpt = new GPT()

buffer = Buffer.alloc( blockSize * 33 )

fs.readSync( fd, buffer, 0, buffer.length, ((gpt.backupLBA - 32) * blockSize) )

try {
  backupGpt.parseBackup( buffer )
} catch( error ) {
  console.log( 'Couldn\'t parse backup GPT:\n', error.message )
  process.exit( 1 )
}

console.log( 'Read backup GUID Partition Table:\n\n', inspect( backupGpt ) )
console.log( '' )

fs.closeSync( fd )
