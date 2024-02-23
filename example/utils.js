var fs = require( 'fs' )
var MBR = require( 'mbr' )
var GPT = require( '..' )

function readMBR( fd, blockSize ) {
  var buffer = Buffer.alloc( blockSize )
  fs.readSync( fd, buffer, 0, buffer.length, 0 )
  return MBR.parse( buffer )
}

function readPrimaryGPT( fd, blockSize, efiPart ) {

  // NOTE: You'll need to know / determine the logical block size of the storage device;
  // For the sake of brevity, we'll just go with the still most common 512 bytes
  var gpt = new GPT({ blockSize: blockSize })

  // NOTE: For protective GPTs (0xEF), the MBR's partitions
  // attempt to span as much of the device as they can to protect
  // against systems attempting to action on the device,
  // so the GPT is then located at LBA 1, not the EFI partition's first LBA
  var offset = efiPart.type == 0xEE ?
    efiPart.firstLBA * gpt.blockSize :
    gpt.blockSize

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

function readBackupGPT( fd, primaryGPT ) {

  var backupGPT = new GPT({ blockSize: primaryGPT.blockSize })
  var buffer = Buffer.alloc( 33 * primaryGPT.blockSize )
  var offset = ( Number( primaryGPT.backupLBA ) - 32 ) * primaryGPT.blockSize

  fs.readSync( fd, buffer, 0, buffer.length, offset )
  backupGPT.parseBackup( buffer )

  return backupGPT

}

module.exports = { readMBR, readPrimaryGPT, readBackupGPT }
