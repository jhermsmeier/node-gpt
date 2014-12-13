var fs = require( 'fs' )
var assert = require( 'assert' )
var GPT = require( '../' )

describe( 'GUID Partition Table', function() {
  
  describe( 'BOOTCAMP', function() {
    
    const DATAPATH = __dirname + '/data/bootcamp.bin'
    var data = fs.readFileSync( DATAPATH )
    var gpt = null
    
    it( 'should be able to parse a BootCamp GPT', function() {
      gpt = GPT.parse( data )
      // console.log( gpt )
    })
    
    it( 'in/out buffer equality', function() {
      var buffer = gpt.toBuffer()
      // fs.writeFileSync( __dirname + '/data/bootcamp.diff.bin', buffer )
      assert.equal( gpt.toBuffer( true, false ).length, 92 )
      assert.equal( gpt.toBuffer( false, true ).length, gpt.entrySize * gpt.entries )
      assert.equal( data.length, buffer.length )
      assert.deepEqual( data, buffer )
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
