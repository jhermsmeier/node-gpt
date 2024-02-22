var fs = require( 'fs' )
var path = require( 'path' )
var bench = require( 'nanobench' )
var GPT = require( '..' )

var primaryPath = path.join( __dirname, '..', 'test', 'data', 'bootcamp.bin' )
var backupPath = path.join( __dirname, '..', 'test', 'data', 'bootcamp-backup.bin' )
var primary = fs.readFileSync( primaryPath )
var backup = fs.readFileSync( backupPath )

var ITERATIONS = 10_000
var gpt = new GPT()

bench( `GPT.parse() × ${ITERATIONS}`, function( run ) {
  run.start()
  for( var i = 0; i < ITERATIONS; i++ ) {
    GPT.parse( primary )
  }
  run.end()
})

bench( `gpt.parse() × ${ITERATIONS}`, function( run ) {
  run.start()
  for( var i = 0; i < ITERATIONS; i++ ) {
    gpt.parse( primary )
  }
  run.end()
})

bench( `gpt.parseBackup() × ${ITERATIONS}`, function( run ) {
  run.start()
  for( var i = 0; i < ITERATIONS; i++ ) {
    gpt.parseBackup( backup )
  }
  run.end()
})

bench( `gpt.write() × ${ITERATIONS}`, function( run ) {
  run.start()
  for( var i = 0; i < ITERATIONS; i++ ) {
    gpt.write()
  }
  run.end()
})
