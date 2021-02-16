const express = require('express')
const http = require('http')
const cors = require('cors')
const compression = require('compression')
const path = require('path')
const app = express()
const server = http.createServer(app)
const serverConfig = require('../../../server.config')


const bodyParser = require('body-parser')
 
var GridManager = require('./GridManager')
 
const ItemHelper = require('../../../shared/lib/ItemHelper')

 var GameState = require('./gamestate')

let redisInterface = require('./redis-interface')
import MongoInterface from './mongo-interface'  

var mongoInterface = new MongoInterface()


var socketServer


  //only for testing
const ENABLE_DEVELOPER_COMMANDS = true;

const port = serverConfig.gameServer.port

module.exports =  class GameServer {




  async start(serverMode, callback)
  {
    console.log('Booting game server: ',serverMode)
 



    await redisInterface.init()
    await mongoInterface.init('polyvoxels_'.concat(serverMode))

    
     let gameState = new GameState(mongoInterface, redisInterface)

 

     let gridManager = new GridManager(mongoInterface)  
      await gridManager.init()  //gridPhases 

 
 
     //this.initApiPostRequests( app , inventoryManager )



    server.listen(port, () => {
      console.log('Game Server is listening on http://localhost:' + port)
    })

    callback(mongoInterface, redisInterface)


  }

  initApiPostRequests(expressapp, inventoryManager )
  {


      expressapp.post('/api/v1/', async function(req, res) {
          let data = req.body

          let publicAddress = data.publicAddress
          //just use socketserv class for this method .. dont actually use sockets for the API

          var authed = await socketServer.verifyAuthToken(data)

          var response = {
            success:authed,
            requestType: data.requestType
          }

          if( authed ){
            //console.log('got api request', data)

            if(data.requestType == 'inventory')
            {
              let containerOwnerId = data.containerOwnerId

              let container = await ItemHelper.getContainerFromPlayerAndUnitOwner( publicAddress, containerOwnerId, mongoInterface )

              if(container)
              {
                let hasAccess = await inventoryManager.playerAddressHasAccessToContainer(publicAddress, container  )

                if(hasAccess)
                {
                  response.data = await inventoryManager.getItemsWithinContainer( container  )

                }else{
                  console.log('WARN: DOES NOT HAVE ACCESS')
                }
              }


            }


            if(ENABLE_DEVELOPER_COMMANDS)
            {
              if(data.requestType == 'spawnItem')
              {

                response.data = await inventoryManager.createItemForPlayerByAddress( {playerAddress: publicAddress , itemInternalName: 'metalscrap', quantity: 5}  )
              }

            }


          }

          //console.log('sending api response', response)
          res.end(JSON.stringify(response))

      });

  }





    async shutdown( callback ){
      await mongoInterface.shutdown()
      await socketServer.shutdown()
      await server.close()

      callback()

    }

}
