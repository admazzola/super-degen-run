const express = require('express')
const http = require('http')
const cors = require('cors')
const compression = require('compression')
const path = require('path')
const app = express()
const server = http.createServer(app)
const serverConfig = require('../../../server.config')


const bodyParser = require('body-parser')

 
var GridUpdater = require('./util/gridupdater')

 
 var GameState = require('./gamestate')

let redisInterface = require('./redis-interface')

import MongoInterface from './mongo-interface'  

var mongoInterface = new MongoInterface()


var socketServer

const port = serverConfig.gridServer.port

  //only for testing
const ENABLE_DEVELOPER_COMMANDS = true;



module.exports =  class GameServer {




  async start(serverMode, callback)
  {
    console.log('Booting game server: ',serverMode)

    




    await redisInterface.init()
    await mongoInterface.init('polyvoxels_'.concat(serverMode))
 
 
 


    let gridUpdater = new GridUpdater(1, mongoInterface,redisInterface )
    gridUpdater.start();

 


    server.listen(port, () => {
      console.log('Grid Server is listening on http://localhost:' + port)
    })

    callback(mongoInterface, redisInterface)


  }
 



    async shutdown( callback ){
      await mongoInterface.shutdown()
      await socketServer.shutdown()
      await server.close()

      callback()

    }

}
