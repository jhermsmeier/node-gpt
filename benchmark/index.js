var fs = require( 'fs' )
var path = require( 'path' )
var GPT = require( '..' )

var primaryPath = path.join( __dirname, '..', 'test', 'data', 'bootcamp.bin' )
var backupPath = path.join( __dirname, '..', 'test', 'data', 'bootcamp-backup.bin' )
var primary = fs.readFileSync( primaryPath )
var backup = fs.readFileSync( backupPath )

suite( 'GUID Partition Table', function() {

  bench( 'GPT.parse()', function() {
    return GPT.parse( primary )
  })

  var gpt = new GPT()

  bench( 'gpt.parse()', function() {
    gpt.parse( primary )
  })

  bench( 'gpt.parseBackup()', function() {
    gpt.parseBackup( backup )
  })

  bench( 'gpt.write()', function() {
    return gpt.write()
  })

})
