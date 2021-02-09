const express = require('express')
const http = require('http')
const cors = require('cors')
const compression = require('compression')
const path = require('path')
const app = express()
const server = http.createServer(app)
const serverConfig = require('../../../server.config')
const port = serverConfig.marketServer.port


var MarketManager = require('./MarketManager')



const bodyParser = require('body-parser')

let mongoInterface = require('./mongo-interface')

let redisInterface = require('./redis-interface')
//var socketServer;


/*
Allows users to create new offchain Payspec orders and save them to mongo
Allows other users to query those offchain orders

Scans the sidechain to detect Payspec transactions to then finalize an order -> queue buffer for game server to fetch out

(items in the market go in Escrow in mongo so as to mitigate race conditions)



REMEMBER: EVERY TABLE MUST HAVE ONLY 1 SERVER ALLOWED TO EVER WRITE TO IT

*/


module.exports =  class MarketServer {




  async start(serverMode, callback)
  {
    console.log('Booting game server: ',serverMode)

    app.use(cors())
    app.use(compression())



    redisInterface.init()



      app.use( bodyParser.json() );       // to support JSON-encoded bodies
      app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
        extended: true
      }));


      await mongoInterface.init('outerspace_market_'.concat(serverMode))


      let marketManager = new MarketManager(mongoInterface)

     this.initApiPostRequests( app , marketManager)




    server.listen(port, () => {
      console.log('Market Server is listening on http://localhost:' + port)
    })

    callback()


  }


/*

requestType: 'makeMarketOrder',
item: {
  name: 'Metal Scrap',
  internalName: 'metalscrap',
  volume: 1,
  totalVolume: 5,
  stackQuantity: 5,
  id: '5f7d071e81e7a509b141d722'
},
quantity: 0,
pricePerUnit: 0,
authToken: '0xc2f939f783b35eaaf1d65ee7300024b861c94776',
publicAddress: '0x7132c9f36abe62eab74cdfdd08c154c9ae45691b'


*/

  initApiPostRequests(expressapp, marketManager)
  {


      expressapp.post('/api/v1/', async function(req, res) {
          let data = req.body

          let publicAddress = data.publicAddress
          //just use socketserv class for this method .. dont actually use sockets for the API

          var authed = await this.verifyAuthToken(data)

          var response = {
            success:authed,
            requestType: data.requestType
          }

          if( authed ){
            console.log('got market api request', data)

            if(data.requestType == 'orders')  //get
            {

            response.data = await marketManager.getMarketOrders( data )

            }




            if(data.requestType == 'buyoutOrderTx') //just to collect data on opening metamask ..no guaranteed that they bought
            {
              response.data = await marketManager.clientSubmittedBuyoutOrder( data )

            }

          if(data.requestType == 'makeMarketOrder')
          {
            response.data = await marketManager.storeNewMarketOrder( data )


          }



          }else{
            console.log('auth failed ', data )
          }

          console.log('market sending api response', response)
          res.end(JSON.stringify(response))

      }.bind(this));

  }

  async verifyAuthToken(credentials)
  {
    var token = credentials.authToken;
    var publicAddress = credentials.publicAddress;

    console.log('market server checking credentials', credentials)

    var existingJSON  = await redisInterface.findHashInRedis('auth_token',publicAddress )
    var existing = JSON.parse(existingJSON)
    console.log('found record ', existing)

    if(existing.authToken == token)
    {
      return true
    }

    return false;
  }




    async shutdown( callback ){
      await mongoInterface.shutdown()

      await server.close()

      callback()

    }

}
