const express = require('express')
const http = require('http')
const cors = require('cors')
const compression = require('compression')
const path = require('path')
const app = express()
const server = http.createServer(app)
const serverConfig = require('../../../server.config')


const bodyParser = require('body-parser')

var SocketServ = require('./socket-serv')
  
let redisInterface = require('./redis-interface')
let mongoInterface = require('./mongo-interface')
var socketServer


  //only for testing
const ENABLE_DEVELOPER_COMMANDS = true;

const port = serverConfig.relayServer.port

module.exports =  class GameServer {




  async start(serverMode, callback)
  {
    console.log('Booting game server: ',serverMode)

    app.use(cors())
    app.use(compression())


    app.use( bodyParser.json() );       // to support JSON-encoded bodies
    app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
      extended: true
    }));




    await redisInterface.init()
    await mongoInterface.init('polyvoxels_'.concat(serverMode))

     
     socketServer = new SocketServ(   server, mongoInterface, redisInterface)

 
     this.initApiPostRequests( app  )



    server.listen(port, () => {
      console.log('Relay Server is listening on http://localhost:' + port)
    })

    callback(mongoInterface, redisInterface)


  }

  initApiPostRequests(expressapp )
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

            /*if(data.requestType == 'inventory')
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


            }*/


            if(ENABLE_DEVELOPER_COMMANDS)
            {
              if(data.requestType == 'spawnItem')
              {

            //    response.data = await inventoryManager.createItemForPlayerByAddress( {playerAddress: publicAddress , itemInternalName: 'metalscrap', quantity: 5}  )
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
