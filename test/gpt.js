var fs = require( 'fs' )
var path = require( 'path' )
var assert = require( 'assert' )
var MBR = require( 'mbr' )
var GPT = require( '../' )
var inspect = require( './inspect' )

context( 'GUID Partition Table', function() {

  // TODO:
  // - Add a test GPT blob with entries set to zero
  //   (the thing that still crashes Windows due to division by zero)
  // - Add tests with different blocksize disks (512, 2048, 4096, 8192)

  context( 'BOOTCAMP', function() {

    var data = fs.readFileSync( path.join( __dirname, 'data', 'bootcamp.bin' ) )
    var backupData = fs.readFileSync( path.join( __dirname, 'data', 'bootcamp-backup.bin' ) )

    test( 'should be able to parse a BootCamp GPT', function() {
      var gpt = GPT.parse( data )
      assert.equal( gpt.tableSize, 32 * gpt.blockSize )
      inspect.log( gpt )
    })

    test( 'in/out buffer equality', function() {
      var gpt = GPT.parse( data )
      var buffer = gpt.write()
      assert.equal( data.length, buffer.length )
      assert.deepEqual( data, buffer )
    })

    test( 'verifies', function() {
      var gpt = GPT.parse( data )
      assert.ok( gpt.verify() )
    })

    test( 'should be able to parse a backup GPT', function() {
      var gpt = GPT.parseBackup( backupData )
      inspect.log( gpt )
    })

    test( 'backup in/out buffer equality', function() {
      var gpt = GPT.parseBackup( backupData )
      var buffer = gpt.writeBackup()
      assert.equal( backupData.length, buffer.length )
      assert.deepEqual( backupData, buffer )
    })

    test( 'verifies a backup GPT', function() {
      var gpt = GPT.parseBackup( backupData )
      assert.ok( gpt.verify() )
    })

  })

  context( 'ExFAT', function() {

    var blockSize = 512
    var data = fs.readFileSync( path.join( __dirname, 'data', 'gpt-primary-exfat.bin' ) )
    var backupData = fs.readFileSync( path.join( __dirname, 'data', 'gpt-backup-exfat.bin' ) )

    test( 'should be able to parse a BootCamp GPT', function() {
      var mbr = MBR.parse( data )
      var gpt = GPT.parse( data, mbr.getEFIPart().firstLBA * blockSize )
      assert.equal( gpt.tableSize, 32 * gpt.blockSize )
      inspect.log( gpt )
    })

    test( 'in/out buffer equality', function() {
      var mbr = MBR.parse( data )
      var offset = mbr.getEFIPart().firstLBA * blockSize
      var gpt = GPT.parse( data, offset )
      var buffer = gpt.write()
      assert.equal( data.length - offset, buffer.length )
      assert.deepEqual( data.slice( offset ), buffer )
    })

    test( 'verifies', function() {
      var mbr = MBR.parse( data )
      var offset = mbr.getEFIPart().firstLBA * blockSize
      var gpt = GPT.parse( data, offset )
      assert.ok( gpt.verify() )
    })

    test( 'should be able to parse a backup GPT', function() {
      var gpt = GPT.parseBackup( backupData )
      inspect.log( gpt )
    })

    test( 'backup in/out buffer equality', function() {
      var gpt = GPT.parseBackup( backupData )
      var buffer = gpt.writeBackup()
      assert.equal( backupData.length, buffer.length )
      assert.deepEqual( backupData, buffer )
    })

    test( 'verifies a backup GPT', function() {
      var gpt = GPT.parseBackup( backupData )
      assert.ok( gpt.verify() )
    })

    test( 'writes a backup from primary', function() {
      var gpt = GPT.parse( data, 512 )
      var buffer = gpt.writeBackupFromPrimary()
      assert.equal( backupData.length, buffer.length )
      assert.deepEqual( backupData, buffer )
    })

  })

  context( 'RASPBERRY PI MBR', function() {

    const DATAPATH = __dirname + '/data/raspberry.bin'
    var data = fs.readFileSync( DATAPATH )

    test( 'should throw "Invalid Signature"', function() {
      assert.throws( function() {
        GPT.parse( data )
      })
    })

  })

})
