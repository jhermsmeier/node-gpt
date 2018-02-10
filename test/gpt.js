var fs = require( 'fs' )
var path = require( 'path' )
var assert = require( 'assert' )
var inspect = require( './inspect' )
var GPT = require( '../' )

describe( 'GUID Partition Table', function() {

  // TODO:
  // - Add a test GPT blob with entries set to zero
  //   (the thing that still crashes Windows due to division by zero)

  describe( 'BOOTCAMP', function() {

    var data = fs.readFileSync( path.join( __dirname, 'data', 'bootcamp.bin' ) )
    var backupData = fs.readFileSync( path.join( __dirname, 'data', 'bootcamp-backup.bin' ) )

    it( 'should be able to parse a BootCamp GPT', function() {
      var gpt = GPT.parse( data )
      assert.equal( gpt.tableSize, 32 * gpt.blockSize )
      inspect.log( gpt )
    })

    it( 'in/out buffer equality', function() {
      var gpt = GPT.parse( data )
      var buffer = gpt.write()
      assert.equal( data.length, buffer.length )
      assert.deepEqual( data, buffer )
    })

    it( 'verifies', function() {
      var gpt = GPT.parse( data )
      assert.ok( gpt.verify() )
    })

    it( 'should be able to parse a backup GPT', function() {
      var gpt = GPT.parseBackup( backupData )
      inspect.log( gpt )
    })

    it( 'backup in/out buffer equality', function() {
      var gpt = GPT.parseBackup( backupData )
      var buffer = gpt.writeBackup()
      assert.equal( backupData.length, buffer.length )
      assert.deepEqual( backupData, buffer )
    })

    it( 'verifies a backup GPT', function() {
      var gpt = GPT.parseBackup( backupData )
      assert.ok( gpt.verify() )
    })

  })

  describe( 'RASPBERRY PI MBR', function() {

    const DATAPATH = __dirname + '/data/raspberry.bin'
    var data = fs.readFileSync( DATAPATH )

    it( 'should throw "Invalid Signature"', function() {
      assert.throws( function() {
        GPT.parse( data )
      })
    })

  })

})

context( 'GUID', function() {

  context( '.toString()', function() {

    specify( '0x00 fill', function() {
      var buffer = Buffer.alloc( 16 )
      var actual = GPT.GUID.toString( buffer )
      assert.equal( actual, GPT.GUID.ZERO )
    })

    specify( '0xFF fill', function() {
      var buffer = Buffer.alloc( 16, 0xFF )
      var expected = 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF'
      var actual = GPT.GUID.toString( buffer )
      assert.equal( actual, expected )
    })

    specify( 'pattern', function() {
      var buffer = Buffer.from([ 0xAA, 0xAA, 0xAA, 0xAA, 0xBB, 0xBB, 0xCC, 0xCC, 0xDD, 0xDD, 0xEE, 0xEE, 0xEE, 0xEE, 0xEE, 0xEE ])
      var expected = 'AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE'
      var actual = GPT.GUID.toString( buffer )
      assert.equal( actual, expected )
    })

    specify( 'endianness', function() {
      var buffer = Buffer.from([ 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10 ])
      var expected = '04030201-0605-0807-090A-0B0C0D0E0F10'
      var actual = GPT.GUID.toString( buffer )
      assert.equal( actual, expected )
    })

  })

  context( '.write()', function() {

    specify( '0x00 fill', function() {
      var buffer = Buffer.alloc( 16 )
      var expected = Buffer.alloc( 16 )
      var actual = GPT.GUID.write( GPT.GUID.ZERO, buffer )
      assert.deepEqual( actual, expected )
    })

    specify( '0xFF fill', function() {
      var buffer = Buffer.alloc( 16 )
      var expected = Buffer.alloc( 16, 0xFF )
      var value = 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF'
      var actual = GPT.GUID.write( value, buffer )
      assert.deepEqual( actual, expected )
    })

    specify( 'pattern', function() {
      var buffer = Buffer.alloc( 16 )
      var expected = Buffer.from([ 0xAA, 0xAA, 0xAA, 0xAA, 0xBB, 0xBB, 0xCC, 0xCC, 0xDD, 0xDD, 0xEE, 0xEE, 0xEE, 0xEE, 0xEE, 0xEE ])
      var value = 'AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE'
      var actual = GPT.GUID.write( value, buffer )
      assert.deepEqual( actual, expected )
    })

    specify( 'endianness', function() {
      var buffer = Buffer.alloc( 16 )
      var expected = Buffer.from([ 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10 ])
      var value = '04030201-0605-0807-090A-0B0C0D0E0F10'
      var actual = GPT.GUID.write( value, buffer )
      assert.deepEqual( actual, expected )
    })

  })

})
