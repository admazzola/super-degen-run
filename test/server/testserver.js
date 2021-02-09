
var GameServer = require('../../server/src/lib/GameServer')
var gameServer = new GameServer()


async function init()
{


  console.log('start test server')
    gameServer.start('test', function(){
    console.log('booted server ')
  });



}

init()
