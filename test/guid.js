var assert = require( 'assert' )
var inspect = require( './inspect' )
var GPT = require( '../' )

context( 'GUID', function() {

  context( '.toString()', function() {

    test( '0x00 fill', function() {
      var buffer = Buffer.alloc( 16 )
      var actual = GPT.GUID.toString( buffer )
      assert.equal( actual, GPT.GUID.ZERO )
    })

    test( '0xFF fill', function() {
      var buffer = Buffer.alloc( 16, 0xFF )
      var expected = 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF'
      var actual = GPT.GUID.toString( buffer )
      assert.equal( actual, expected )
    })

    test( 'pattern', function() {
      var buffer = Buffer.from([ 0xAA, 0xAA, 0xAA, 0xAA, 0xBB, 0xBB, 0xCC, 0xCC, 0xDD, 0xDD, 0xEE, 0xEE, 0xEE, 0xEE, 0xEE, 0xEE ])
      var expected = 'AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE'
      var actual = GPT.GUID.toString( buffer )
      assert.equal( actual, expected )
    })

    test( 'endianness', function() {
      var buffer = Buffer.from([ 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10 ])
      var expected = '04030201-0605-0807-090A-0B0C0D0E0F10'
      var actual = GPT.GUID.toString( buffer )
      assert.equal( actual, expected )
    })

  })

  context( '.write()', function() {

    test( '0x00 fill', function() {
      var buffer = Buffer.alloc( 16 )
      var expected = Buffer.alloc( 16 )
      var actual = GPT.GUID.write( GPT.GUID.ZERO, buffer )
      assert.deepEqual( actual, expected )
    })

    test( '0xFF fill', function() {
      var buffer = Buffer.alloc( 16 )
      var expected = Buffer.alloc( 16, 0xFF )
      var value = 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF'
      var actual = GPT.GUID.write( value, buffer )
      assert.deepEqual( actual, expected )
    })

    test( 'pattern', function() {
      var buffer = Buffer.alloc( 16 )
      var expected = Buffer.from([ 0xAA, 0xAA, 0xAA, 0xAA, 0xBB, 0xBB, 0xCC, 0xCC, 0xDD, 0xDD, 0xEE, 0xEE, 0xEE, 0xEE, 0xEE, 0xEE ])
      var value = 'AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE'
      var actual = GPT.GUID.write( value, buffer )
      assert.deepEqual( actual, expected )
    })

    test( 'endianness', function() {
      var buffer = Buffer.alloc( 16 )
      var expected = Buffer.from([ 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10 ])
      var value = '04030201-0605-0807-090A-0B0C0D0E0F10'
      var actual = GPT.GUID.write( value, buffer )
      assert.deepEqual( actual, expected )
    })

  })

})
