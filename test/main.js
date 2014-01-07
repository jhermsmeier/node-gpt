var fs = require( 'fs' )
var assert = require( 'assert' )
var GPT = require( '../' )

describe( 'GUID Partition Table', function() {
  
  describe( 'BOOTCAMP', function() {
    
    const DATAPATH = __dirname + '/data/bootcamp.bin'
    var data = fs.readFileSync( DATAPATH )
    
    it( 'should be able to parse a BootCamp GPT', function() {
      new GPT( data )
    })
    
    it( 'in/out buffer equality', function() {
      var gpt = new GPT( data )
      assert.deepEqual( data, gpt.buffer )
    })
    
  })
  
  describe( 'RASPBERRY PI MBR', function() {
    
    const DATAPATH = __dirname + '/data/raspberry.bin'
    var data = fs.readFileSync( DATAPATH )
    
    it( 'should throw "Invalid Signature"', function() {
      assert.throws( function() {
        new GPT( data )
      })
    })
    
  })
  
})
