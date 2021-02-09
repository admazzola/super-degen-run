
var GameServer = require('./lib/GameServer')
var gameServer = new GameServer()

var MarketServer = require('./lib/MarketServer')
var marketServer = new MarketServer()

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


    marketServer.start(serverMode, function(){
      console.log('booted market server ')
    });



}

init()
