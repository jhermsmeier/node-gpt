# GPT - GUID Partition Table
[![npm](https://img.shields.io/npm/v/gpt.svg?style=flat-square)](https://npmjs.com/package/gpt)
[![npm license](https://img.shields.io/npm/l/gpt.svg?style=flat-square)](https://npmjs.com/package/gpt)
[![npm downloads](https://img.shields.io/npm/dm/gpt.svg?style=flat-square)](https://npmjs.com/package/gpt)
[![build status](https://img.shields.io/travis/jhermsmeier/node-gpt.svg?style=flat-square)](https://travis-ci.org/jhermsmeier/node-gpt)

## Install via [npm](https://npmjs.com)

```sh
$ npm install --save gpt
```

## Used by

- **[Etcher](https://github.com/resin-io/etcher)** to flash OS images to SD cards & USB drives
- [resin-io-modules](https://github.com/resin-io-modules) / **[partitioninfo](https://github.com/resin-io-modules/partitioninfo)** to get information about partitions in a disk image

## Related Modules

- [mbr](https://github.com/jhermsmeier/node-mbr) – Parse / construct Master Boot Records
- [apple-partition-map](https://github.com/jhermsmeier/node-gpt) – Parse / construct Apple Partition Maps
- [blockdevice](https://github.com/jhermsmeier/node-blockdevice) – Read from / write to block devices
- [disk](https://github.com/jhermsmeier/node-disk) – Disk / image toolbox

## What can I do with this?

- Format disks / images
- Fix a partition table, recover a deleted partition
- Recover the GUID Partition Table from its backup
- Locate partitions which are inaccessible / ignored by the OS
- Verify the integrity of the primary GPT against its backup

## Usage

```js
var GPT = require( 'gpt' )
```

**NOTE:** For brevity in the examples, error handling may be omitted, and synchronous methods used.

### Examples

The following usage examples are consolidated into [example/verify.js] and runnable, where `device` would be a block device (i.e. `/dev/rdisk2` on Mac OS, `\\.\PhysicalDrive2` on Windows, or `/dev/sdb` on Linux);

[example/verify.js]: https://github.com/jhermsmeier/node-gpt/blob/master/example/inspect.js

```console
sudo node example/verify.js <device>
```

<details>
<summary>Example output</summary>

```js
Master Boot Record: MODERN {
  physicalDrive: 0,
  timestamp: { seconds: 0, minutes: 0, hours: 0 },
  signature: 0,
  copyProtected: false,
  partitions:
   [ Partition {
       status: 0,
       type: 238,
       sectors: 60751871,
       firstLBA: 1,
       firstCHS: CHS { cylinder: 1023, head: 255, sector: 62 },
       lastCHS: CHS { cylinder: 1023, head: 255, sector: 62 } },
     Partition {
       status: 0,
       type: 0,
       sectors: 0,
       firstLBA: 0,
       firstCHS: CHS { cylinder: 0, head: 0, sector: 0 },
       lastCHS: CHS { cylinder: 0, head: 0, sector: 0 } },
     Partition {
       status: 0,
       type: 0,
       sectors: 0,
       firstLBA: 0,
       firstCHS: CHS { cylinder: 0, head: 0, sector: 0 },
       lastCHS: CHS { cylinder: 0, head: 0, sector: 0 } },
     Partition {
       status: 0,
       type: 0,
       sectors: 0,
       firstLBA: 0,
       firstCHS: CHS { cylinder: 0, head: 0, sector: 0 },
       lastCHS: CHS { cylinder: 0, head: 0, sector: 0 } } ],
  code:
   [ Code {
       offset: 0,
       data:
        <Buffer 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 ... > },
     Code {
       offset: 224,
       data:
        <Buffer 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 ... > } ] }

EFI Parition: Partition {
  status: 0,
  type: 238,
  sectors: 60751871,
  firstLBA: 1,
  firstCHS: CHS { cylinder: 1023, head: 255, sector: 62 },
  lastCHS: CHS { cylinder: 1023, head: 255, sector: 62 } }

Primary: GPT {
  blockSize: 512,
  guid: 'D871C3D8-25BA-4792-BE54-171138CFA926',
  revision: 65536,
  headerSize: 92,
  headerChecksum: 1129732062,
  currentLBA: 1,
  backupLBA: 60751871,
  firstLBA: 34,
  lastLBA: 60751838,
  tableOffset: 2,
  entries: 128,
  entrySize: 128,
  tableChecksum: 4191805727,
  partitions:
   [ PartitionEntry {
       type: 'C12A7328-F81F-11D2-BA4B-00A0C93EC93B',
       guid: 'BC7E4D81-59CC-40A6-84BF-43253C95AE0D',
       name: 'EFI System Partition',
       firstLBA: 40,
       lastLBA: 409639,
       attr: 0 },
     PartitionEntry {
       type: 'EBD0A0A2-B9E5-4433-87C0-68B6B72699C7',
       guid: '1885EDDC-5F6E-45CD-8C5C-E0485563F3CC',
       name: '',
       firstLBA: 411648,
       lastLBA: 60749823,
       attr: 0 } ] }

Backup: GPT {
  blockSize: 512,
  guid: 'D871C3D8-25BA-4792-BE54-171138CFA926',
  revision: 65536,
  headerSize: 92,
  headerChecksum: 4122036460,
  currentLBA: 60751871,
  backupLBA: 1,
  firstLBA: 34,
  lastLBA: 60751838,
  tableOffset: 60751839,
  entries: 128,
  entrySize: 128,
  tableChecksum: 4191805727,
  partitions:
   [ PartitionEntry {
       type: 'C12A7328-F81F-11D2-BA4B-00A0C93EC93B',
       guid: 'BC7E4D81-59CC-40A6-84BF-43253C95AE0D',
       name: 'EFI System Partition',
       firstLBA: 40,
       lastLBA: 409639,
       attr: 0 },
     PartitionEntry {
       type: 'EBD0A0A2-B9E5-4433-87C0-68B6B72699C7',
       guid: '1885EDDC-5F6E-45CD-8C5C-E0485563F3CC',
       name: '',
       firstLBA: 411648,
       lastLBA: 60749823,
       attr: 0 } ] }

[OK]
```

</details>

### Finding the EFI Partition

The indicator for a GPT formatted device is a protective or hybrid Master Boot Record, containing a partition marked with a type of either `0xEE` or `0xEF` respectively. Thus we need to read & parse the MBR to determine whether a GPT is present or not:

```js
var MBR = require( 'mbr' )
```

```js
function readMBR() {
  var buffer = Buffer.alloc( 512 )
  fs.readSync( fd, buffer, 0, buffer.length, 0 )
  return MBR.parse( buffer )
}

var mbr = readMBR()
var efiPart = mbr.getEFIPart()

if( efiPart == null ) {
  console.log( 'No EFI partition found' )
}
```

### Reading the Primary GPT

```js
function readPrimaryGPT( efiPart ) {
  
  // NOTE: You'll need to know / determine the logical block size of the storage device;
  // For the sake of brevity, we'll just go with the still most common 512 bytes
  var gpt = new GPT({ blockSize: 512 })
  
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
  
  return GPT.parse( buffer )
  
}

var primaryGPT = readPrimaryGPT( efiPart )
```

**NOTE:** Reading & parsing a GPT like above will just work in most cases, but to cover all situations (i.e. padding between header & table, custom table entry sizes, etc.), see the **"Accounting for everything"** example below:

<details>
<summary><b>Accounting for everything</b></summary>

```js
function readPrimaryGPT( efiPart ) {
  
  // NOTE: You'll need to know / determine the logical block size of the storage device;
  // For the sake of brevity, we'll just go with the still most common 512 bytes
  var gpt = new GPT({ blockSize: 512 })
  
  // NOTE: For protective GPTs (0xEF), the MBR's partitions
  // attempt to span as much of the device as they can to protect
  // against systems attempting to action on the device,
  // so the GPT is then located at LBA 1, not the EFI partition's first LBA
  var offset = efiPart.type == 0xEE ?
    efiPart.firstLBA * gpt.blockSize :
    gpt.blockSize
  
  // First, we need to read & parse the GPT header, which will declare various
  // sizes and offsets for us to calculate where & how long the table and backup are
  var headerBuffer = Buffer.alloc( gpt.blockSize )
  
  fs.readSync( fd, headerBuffer, 0, headerBuffer.length, offset )
  gpt.parseHeader( headerBuffer )
  
  // Now on to reading the actual partition table
  var tableBuffer = Buffer.alloc( gpt.tableSize )
  var tableOffset = gpt.tableOffset * gpt.blockSize
  
  fs.readSync( fd, tableBuffer, 0, tableBuffer.length, tableOffset )
  
  // We need to parse the first 4 partition entries & the rest separately
  // as the first 4 table entries always occupy one block,
  // with the rest following in subsequent blocks
  gpt.parseTable( tableBuffer, 0, gpt.blockSize )
  gpt.parseTable( tableBuffer, gpt.blockSize, gpt.tableSize )
  
  return gpt
  
}

var primaryGPT = readPrimaryGPT( efiPart )
```

</details>

### Reading the Backup GPT

```js
function readBackupGPT(primaryGPT) {
  
  var backupGPT = new GPT({ blockSize: primaryGPT.blockSize })
  var buffer = Buffer.alloc( 33 * primaryGPT.blockSize )
  var offset = ( ( primaryGPT.backupLBA - 32 ) * blockSize )
  
  fs.readSync( fd, buffer, 0, buffer.length, offset )
  backupGPT.parseBackup( buffer )
  
  return backupGPT
  
}

var backupGPT = readBackupGPT(primaryGPT)
```

<details>
<summary><b>Accounting for everything</b></summary>

```js
function readBackupGPT(primaryGPT) {
  
  var backupGPT = new GPT({ blockSize: primaryGPT.blockSize })
  
  return backupGPT
  
}

var backupGPT = readBackupGPT(primaryGPT)
```

</details>

### Verifying the GPT

```js
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
  console.log('Everything\'s alright')
}
```

### Creating a GPT

```js
var gpt = new GPT({
  // The block size of the device
  // the GPT will be written to
  // (optional, defaults to 512)
  blockSize: 512,
  // The GUID of the GPT (needs to be generated when creating)
  guid: '00000000-0000-0000-0000-000000000000'
  // Header size in bytes
  // (min. 92, defaults to 92)
  headerSize: 92,
  // LBA of current GPT copy
  currentLBA: 1,
  // LBA of backup GPT
  backupLBA: 123456,
  // LBA of first "user-space" block
  firstLBA: 34,
  // LBA of last "user-space" block
  lastLBA: 556789,
  // LBA of partition table
  // (defaults to 2)
  tableOffset: 2,
  // Number of partition entries
  // (min. 128, defaults to 128)
  entries: 128,
  // Size of partition entry in bytes
  // (defaults to 128)
  entrySize: 128,
})
```

```js
gpt.partitions.push( new GPT.PartitionEntry({
  type: 'C12A7328-F81F-11D2-BA4B-00A0C93EC93B',
  guid: 'BC7E4D81-59CC-40A6-84BF-43253C95AE0D',
  name: 'EFI System Partition',
  firstLBA: 40,
  lastLBA: 409639,
}))
```

### Writing the GPT

You can either let the module create the buffers for you;

```js
var primaryGPTBuffer = gpt.write()
var backupGPTBuffer = gpt.writeBackupFromPrimary()
```

Or pass in a buffer & optional offset (i.e. to write MBR & primary GPT in one go);

```js
var buffer = Buffer.alloc( blockSize + ( 33 * blockSize ) )
var backupGPTBuffer = Buffer.alloc( 33 * blockSize )

mbr.write( buffer )

gpt.write( buffer, blockSize )
gpt.writeBackupFromPrimary( backupGPTBuffer )
```

```js
// Write out MBR & primary GPT
fs.writeSync( fd, buffer, 0, buffer.length, 0 )

// Write out backup GPT to end of device
// NOTE: remeber to set `gpt.backupLBA` accordingly
fs.writeSync( fd, backupGPTBuffer, 0, backupGPTBuffer.length, gpt.backupLBA * blockSize )
```
