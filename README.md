# GPT - GUID Partition Table
[![npm](http://img.shields.io/npm/v/gpt.svg?style=flat)](https://npmjs.org/gpt)
[![npm downloads](http://img.shields.io/npm/dm/gpt.svg?style=flat)](https://npmjs.org/gpt)
[![build status](http://img.shields.io/travis/jhermsmeier/node-gpt.svg?style=flat)](https://travis-ci.org/jhermsmeier/node-gpt)


## Install via [npm](https://npmjs.org)

```sh
$ npm install gpt
```

## Usage

```js
var GPT = require( 'gpt' )
```

```js
// Parse a buffer read from disk
var gpt = GPT.parse( buffer )
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
