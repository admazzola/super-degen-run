
var GameServer = require('./lib/GameServer')
var gameServer = new GameServer()

var RelayServer = require('./lib/RelayServer')
var relayServer = new RelayServer()

var GridServer = require('./lib/GridServer')
var gridServer = new GridServer()


async function init()
{


  var serverMode = "production"
  if( process.argv[2] == "staging" )
  {
    serverMode = 'staging'
  }



    gameServer.start(serverMode, function(){
      console.log('booted game server ')
    });



    relayServer.start(serverMode, function(){
      console.log('booted relay server ')
    });


    gridServer.start(serverMode, function(){
      console.log('booted grid server ')
    });



}

init()
