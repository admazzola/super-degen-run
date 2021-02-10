

// import geckos.io client
//import geckos from '@geckos.io/client'

const geckos = require('@geckos.io/client').default

//import Web3 from 'web3'
const Web3 = require('web3')

var web3utils = require('web3-utils')

var channel = null
var publicAddress = null
var entityManager = null

const axios = require('axios').default;

const serverConfig = require('../../server.config')




module.exports = class ClientConnection {




 constructor()
 {

 }


 async init(  player, authedCallback )
 {
   var web3 = new Web3(Web3.givenProvider );

   this.web3 = web3;

   //console.log('web3 is ',web3)

   /**
    * start geckos client with these options
    * @param options.url default is `${location.protocol}//${location.hostname}`
    * @param options.port default is 9208
    * @param options.label Default: 'geckos.io'
    * @param options.iceServers Default: []
    * @param options.iceTransportPolicy Default: 'all'
    */

    var auth = ""

    let options = {
    //  authorization: auth,
      url: serverConfig.gameServer.url, //"http://localhost",
      port: serverConfig.gameServer.port
    }

     channel = geckos(options)


     publicAddress = player.publicAddress
  // var id = "game"
   //var maxMessageSize = 512;

   // the channel's id and maxMessageSize (in bytes)
//   const { id, maxMessageSize } = channel

   // once the channel is connected to the server
   channel.onConnect(error => {     //THIS is failing in mocha ...
     if (error) console.error(error.message)

     // listens for a disconnection
     channel.onDisconnect(() => {})

     // listens for a custom event from the server
     channel.on('chat message', data => {})


     channel.on('errormessage', data => {
       console.log('got error from server', data.message)

     })


     channel.on('challenge', async (data) => {
       console.log('got challenge from socket serv  ')


       let existingAuthData =  await this.getSessionAuthDataCache()

       console.log('existingAuthData  ', existingAuthData)

       if(existingAuthData && existingAuthData.challenge == data.challenge){

        channel.emit('signature', {publicAddress: publicAddress, authToken: existingAuthData.authToken   } )
       }else{

        console.log(' ..opening web3 to personalsign')


        var signature = await player.personalSignWithMetamask(data.challenge, publicAddress, this.web3)

        var recAddress = await player.web3ecRecover(data.challenge, signature, this.web3)
  
         if(recAddress.toLowerCase() != publicAddress.toLowerCase()){
           console.log('ERROR: client side check of sig failed ', recAddress ,  publicAddress)
         }
  
         console.log('made signature',signature)
  
         channel.emit('signature', {publicAddress: publicAddress, signature: signature   } )
       }


     })

     channel.on('authorized', async (data) => {

       //save the auth token so we can send it with all socket messages to the server
       window.sessionStorage.setItem('authToken', JSON.stringify({challenge: data.challenge, authToken: data.authToken}) );
       console.log('saved auth data  ', {challenge: data.challenge, authToken: data.authToken})

       authedCallback()

     })


     channel.on('setGrid', async (data) => {

         //DEPRECATED

      //  entityManager.setCurrentGrid( data )


        //channel.join(  data.gridUUID  ) //join room
     })

     //receive data about all entities on my grid
     channel.on('gridState', async (data) => {

       await entityManager.receivedGridStateFromServer( data )

     })

     // emits a message to the server
    // channel.emit('chat message', 'Hi!')

    var datagram = {publicAddress: publicAddress}
    channel.emit('connect', datagram )  //start trying to connect !  Uses metamask to prove ownership
  //   channel.emit('connect', publicAddress )
     console.log('emit ', datagram )

     // closes the WebRTC connection
//     channel.close()
   })




 }

 setEntityManager(entMgr)
 {
    entityManager = entMgr;
 }

 getPublicAddress()
 {
   return publicAddress
 }

 async requestSpawn()
 {


  let existingAuthData =  await this.getSessionAuthDataCache()
 
   var datagram = {authToken: existingAuthData.authToken, publicAddress: publicAddress }

   console.log(channel )
     channel.emit('spawn', datagram , { reliable: true })
 }

/* async requestGridState( entityManager )
 {
   //DEPRECATED
  // var datagram = {authToken: this.getSessionAuthDataCache(), publicAddress: publicAddress }
  //   channel.emit('getGridState', datagram , { reliable: true })
}*/


 async sendClientCommand(cmdName, cmdParams)
 {

   /*
     ('setShipDirectionVector',{vector: x})
     ('initiateWarp',{griduuid: x})
   */
   console.log('sending client command ', cmdName, cmdParams)
   var datagram = {cmdName: cmdName, cmdParams:cmdParams, authToken: this.getSessionAuthDataCache().authToken, publicAddress: publicAddress}
    channel.emit('clientCommand', datagram , { reliable: true })

 }


 async getSessionAuthDataCache()
 {
     return JSON.parse( window.sessionStorage.getItem('authToken' )  );
 }



 static getServerNameForDataRequest(dataRequest)
 {
   console.log('get server name ', dataRequest)
   switch(dataRequest.requestType)
   {
     case 'inventory': return 'gameServer';
     case 'orders': return 'marketServer';
     case 'walletDetails': return 'marketServer';
     case 'makeMarketOrder': return 'marketServer';
     case 'buyoutOrderTx': return 'marketServer';

     default: return 'gameServer';

   }


 }

 //may need to change me !
 async requestAPIData(dataRequest){




    let serverName = ClientConnection.getServerNameForDataRequest(dataRequest)
    let serverProperties = serverConfig[serverName]

    console.log('server name for request is ', serverName)
   //let url = "http://localhost:9208/api/v1"

   let url = serverProperties.url + ':' + serverProperties.port + '/api/v1'


   var postData =  Object.assign({}, dataRequest);

   postData.authToken = await this.getSessionAuthDataCache().authToken
   postData.publicAddress = publicAddress

  /* var postData = {
     requestType: dataRequest.requestType,
     authToken: await this.getSessionAuthDataCache(),
     publicAddress: publicAddress
   }*/


/*
     let options = {
       url: serverConfig.gameServer.url,
       port: serverConfig.gameServer.port
     }
*/



   let response = await axios({
        method: 'post',
        url: url,
        data: postData
      });

    let results = response.data

    console.log('got from api ', results)

    if(results.success)
    {
      return results ;

    }




 }


/*
 async personalSignWithMetamask(challenge,address, web3provider)
 {
   console.log('personal signing ', challenge, address, web3provider)


  var challengeHash =    web3utils.fromUtf8 (challenge)

   var sig =   await new Promise(async (resolve,reject) => {

      web3provider.personal.sign( challengeHash , address, function (err,result){
            if (err) {return console.error(err)}
            console.log('PERSONAL SIGNED:' + result)
            resolve(result);
     })

   })

   return sig;

 }




  async web3ecRecover(challenge,signature)
 {


   console.log('ecrecover ', challenge, signature, web3)

   var addr =   await new Promise(async (resolve,reject) => {

      this.web3.personal.ecRecover( web3.fromUtf8 (challenge) , signature, function (err,result){
            if (err) {return console.error(err)}
            console.log('ecrecover:' + result)
            resolve(result);
     })

   })

   return addr;

 }
*/

}
