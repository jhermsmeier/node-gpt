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
      inspect.log( gpt )
    })

    it( 'should be able to parse a backup GPT', function() {
      var gpt = new GPT().parseBackup( backupData )
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
