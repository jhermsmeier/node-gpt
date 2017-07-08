# GPT - GUID Partition Table
[![npm](https://img.shields.io/npm/v/gpt.svg?style=flat-square)](https://npmjs.com/package/gpt)
[![npm downloads](https://img.shields.io/npm/dm/gpt.svg?style=flat-square)](https://npmjs.com/package/gpt)
[![build status](https://img.shields.io/travis/jhermsmeier/node-gpt.svg?style=flat-square)](https://travis-ci.org/jhermsmeier/node-gpt)

## Install via [npm](https://npmjs.com)

```sh
$ npm install --save gpt
```

## Related Modules

- [mbr](https://github.com/jhermsmeier/node-mbr) – Parse / construct Master Boot Records
- [apple-partition-map](https://github.com/jhermsmeier/node-gpt) – Parse / construct Apple Partition Maps
- [disk](https://github.com/jhermsmeier/node-disk) – ...
- [blockdevice](https://github.com/jhermsmeier/node-blockdevice) – Read from / write to block devices

## In Use

- [Etcher](https://github.com/resin-io/etcher) – Flash OS images to SD cards & USB drives, safely and easily (https://etcher.io)

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

```js
// Parse a buffer read from disk
var gpt = GPT.parse( buffer, options )
```

```js
// Or, create a new one
var gpt = new GPT({
  // The block size of the device
  // the GPT will be written to
  // (optional, defaults to 512)
  blockSize: 512,
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
// Get the buffers
var buffer = gpt.toBuffer()
var headerBuffer = gpt.toBuffer( true, false )
var tableBuffer = gpt.toBuffer( false, true )
```

```js
// Verify against a backup GPT
gpt.verify( backupGPT )
```
