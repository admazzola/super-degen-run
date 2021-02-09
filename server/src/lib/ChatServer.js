const express = require('express')
const http = require('http')
const cors = require('cors')
const compression = require('compression')
const path = require('path')
const app = express()
const server = http.createServer(app)
const serverConfig = require('../../../server.config')
const port = serverConfig.chatServer.port


var SocketServ = require('./socket-serv')



let mongoInterface = require('./mongo-interface')
var socketServer;


/*

*/


module.exports =  class ChatServer {




  async start(serverMode, callback)
  {
    console.log('Booting game server: ',serverMode)

    app.use(cors())
    app.use(compression())




    await mongoInterface.init('outerspace_'.concat(serverMode))

  //  let galaxyState = new GalaxyState(mongoInterface)
    //let gameState = new GameState(mongoInterface)


     socketServer = new SocketServ(server, gameState)

    // await galaxyState.init()


    server.listen(port, () => {
      console.log('Express is listening on http://localhost:' + port)
    })

    callback()


  }

    async shutdown( callback ){
      await mongoInterface.shutdown()
      await socketServer.shutdown()
      await server.close()

      callback()

    }

}
