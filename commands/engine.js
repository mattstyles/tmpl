
'use strict'

/**
 * Manages the currently configured templating engines
 *
 * @example
 *   temple engine --all
 *   temple engine --all --json
 *   temple engine hogan
 *   temple engine hogan.extensions hbs hogan hulk
 *   echo '{"module":"hogan.js"}' | temple engine hogan
 *   temple engine hogan < engine.json
 *   temple engine --install hogan
 *   temple engine hogan --install
 *   temple engine --rm hogan
 *   temple engine hogan --rm
 */

const path = require( 'path' )
const spawn = require( 'child_process' ).spawn
const usage = require( '../lib/usage' )
const conf = require( '../lib/conf' )()
const pkg = require( '../package.json' )
const engineCore = require( '../lib/engine' )
const stream = require( '../lib/stream' )

const ENGINE_KEY = 'engines'
const core = engineCore( conf.get( ENGINE_KEY ) )

/**
 * Manages behaviours surrounding the templating engines
 */
// module.exports = function( opts ) {
//   /**
//    * Show all engine data
//    */
//   if ( opts.all ) {
//     core.showAll( opts )
//     return
//   }
//
//   /**
//    * Install specific engine if it exists
//    */
//   if ( opts.install ) {
//     core.install( opts._[ 0 ] || opts.install )
//     return
//   }
//
//   /**
//    * Remove an engine
//    */
//   if ( opts.delete ) {
//     core.remove( opts._[ 0 ] || opts.delete )
//     return
//   }
//
//   /**
//    * Show help on 'temple engine'
//    */
//   if ( !opts._ || !opts._.length ) {
//     usage( 'engine' )
//     return
//   }
//
//   /**
//    * Handle getting and setting engine conf data
//    */
//   let engines = conf.get( ENGINE_KEY )
//   let key = opts._[ 0 ]
//   let value = opts._[ 1 ]
//
//   // Try getting the engine data
//   if ( !value && process.stdin.isTTY ) {
//     let engine = engines.find( engine => engine.name === key )
//
//     if ( !engine ) {
//       console.log( `${ pkg.shortname }: Can not find specified engine` )
//       console.log( `See '${ pkg.shortname } engine --help'` )
//       return
//     }
//
//     // @TODO make tabular
//     process.stdout.write( JSON.stringify( engine ) )
//     return
//   }
//
//   // Try setting the specific key for the engine
//   let keypath = key.split( '.' )
//
//   // Handle setting the whole meta for an engine
//   if ( keypath.length === 1 ) {
//     core.write( keypath[ 0 ] )
//     return
//   }
//
//   // Handle variadic
//   if ( opts._.length > 2 ) {
//     value = opts._.slice( 1, opts._.length )
//   }
//
//   // Handle setting a specific key
//   let engine = engines.find( engine => engine.name === keypath[ 0 ] )
//   engine[ keypath[ 1 ] ] = value
//   conf.set( ENGINE_KEY, engines )
// }


module.exports = function engine( opts ) {

  if ( opts.delete ) {
    let engines = core.remove( opts._[ 0 ] || opts.delete )
    conf.set( ENGINE_KEY, engines )
    return
  }

  if ( opts.all ) {
    core.showAll({
      json: opts.json
    })
    return
  }

  if ( opts.install ) {
    // @TODO
    return
  }

  if ( !opts._ || !opts._.length ) {
    usage( 'engine' )
    return
  }

  // Handle getting and setting engine data
  let key = opts._.shift()
  let value = opts._.length > 1
    ? opts._
    : opts._[ 0 ]

  // With no values and no streaming, show an engine
  if ( ( !value || !value.length ) && process.stdin.isTTY ) {
    core.show( key )
    return
  }

  // @TODO handle setting a specific key
  let keypath = key.split( '.' )

  // Set the whole meta if only supplied with an engine name
  if ( keypath.length > 1 ) {
    let engines = core.writeKey( keypath.shift(), keypath , value )
    conf.set( ENGINE_KEY, engines )
    return
  }

  // Prep for setting by grabbing the data
  stream( opts.data
    ? fs.createReadStream( opts.data )
    : process.stdin
  )
    .then( data => {
      if ( !data.name ) {
        data.name = key
      } else {
        key = data.name
      }

      let engines = core.write( key, data )
      conf.set( ENGINE_KEY, engines )
    })
    .catch( err => {
      if ( err instanceof SyntaxError ) {
        console.log( `${ pkg.shortname }: Can not parse data` )
        console.log( `see '${ pkg.shortname } engine --help'` )
        return
      }
      throw new Error( 'Error streaming data source' )
    })
}
