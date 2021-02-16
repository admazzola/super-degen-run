
var web3utils = require('web3-utils');

const ethJsUtil = require('ethereumjs-util')

//let mongoInterface = require('./mongo-interface')
//let redisInterface = require('./redis-interface')

const GameState = require('./gamestate')
const WorldHelper = require('../../../shared/lib/WorldHelper')

const VoxelHelper = require('../../../shared/lib/voxels/VoxelHelper')

const geckos = require('@geckos.io/server').default
const { iceServers } = require('@geckos.io/server');
import   VoxelWorld  from '../../../shared/lib/voxels/VoxelWorld' 

var io;

var broadcastGridsWorker;

var clientSocketChannels = new Map();

const GRID_UPDATE_RATE = 500;
var cachedPlayerData = new Map()

var cachedVoxelWorld; 


module.exports = class SocketServ {

  constructor(  expressServer, mongoInterface, redisInterface )
  {
    this.mongoInterface=mongoInterface;
    this.redisInterface=redisInterface

    
    cachedVoxelWorld = new VoxelWorld({headless:true})
      

    //this.gameState.setClientChangedGridCallback( this.forceClientIntoGridCommsChannel )


    //redisInterface.init()

    var options = {
      autoManageBuffering :false //allow large packets ?  Does not work. 

      //iceServers: process.env.NODE_ENV === 'production' ? iceServers : [],
    } 

      io = geckos(options)



    broadcastGridsWorker =  setInterval( this.update.bind(this) , GRID_UPDATE_RATE)


  io.onConnection(channel => {
   //  console.log('meep ', channel )
  //  console.log(channel.userData) // { username: 'Yannick', level: 13, points: 8987 }


    channel.onDisconnect(() => {
      console.log(`${channel.id} got disconnected`)
    })


    channel.on('connect', async (data) => {
      console.log(`got ${data} from "connect"`)


    

      var publicAddress = data.publicAddress;
      var randomChallenge =  web3utils.randomHex(32 )    //make this prettier ?


      let existingStore = await this.redisInterface.findHashInRedis(  'socket_challenge',publicAddress )
      

      if(existingStore ){
        let existingStoreData = JSON.parse(  existingStore )

        if(existingStoreData.challenge){

          console.log('found existing store ', existingStore, existingStoreData.challenge )
          randomChallenge = existingStoreData.challenge
        }

      }


      console.log('meep', publicAddress)
      console.log('sending randomChallenge ', randomChallenge  )

      /*try{
        var existing = await redisInterface.findHashInRedis('socket_challenge',publicAddress )
        console.log('found existing ', existing)
      }catch(e)
      {
        console.log(e)
      }*/

      let newdata = JSON.stringify({  publicAddress: publicAddress, challenge: randomChallenge})
      //store random challenge along w public address -- in redis
      var store = await this.redisInterface.storeRedisHashData('socket_challenge',publicAddress,newdata)

      channel.emit('challenge', {challenge: randomChallenge})
    })


    channel.on('signature', async (data) => {
      console.log(`got ${data.signature} from "signature"`)

      if(data.authToken){//signing in with existing authToken that is not expired
        var authed = await this.verifyAuthToken(data)

        if(!authed){
          return 
        }

        clientSocketChannels.set(data.publicAddress , channel  );


      }else{ 
        //make and store a new auth token 

        var existingJSON  = await this.redisInterface.findHashInRedis('socket_challenge',data.publicAddress )
        var existing = JSON.parse(existingJSON)
        console.log('found record ', existing)
  
        if(data.publicAddress != existing.publicAddress )
        {
          //throw error
          console.log('error - address mismatch during signature checking')
          return;
        }
  
  
        var recoveredAddress = await this.ethJsUtilecRecover(existing.challenge, data.signature)
  
        if(recoveredAddress != existing.publicAddress )
        {
          //throw error
          console.log('error - recovered address mismatch',recoveredAddress, existing.publicAddress )
          return;
        }
  
        var authToken = web3utils.randomHex(20).toString()
  
        var newdata = JSON.stringify({  publicAddress: recoveredAddress, authToken: authToken})
        var store = await this.redisInterface.storeRedisHashData('auth_token',recoveredAddress,newdata)

        clientSocketChannels.set(recoveredAddress , channel  );

      }

     

     
      //auth token should expire after some time...?
      channel.emit('authorized', {publicAddress: recoveredAddress, authToken: authToken})

    })

    channel.on('chat message', data => {
      console.log(`got ${data} from "chat message"`)
      // emit the "chat message" data to all channels in the same room
       io.room(channel.roomId).emit('chat message', data)

    })



    //client wants to spawn in... lets do that
    channel.on('spawn', async (data) => {
      console.log(`got ${data.publicAddress} from "spawn"`)

      var authed = await this.verifyAuthToken(data)

      if(authed)
      {

        var unittype = 'humanMale' 

        var loc = GameState.getNewPlayerSpawnLocation()

        var result = await GameState.spawnPlayerUnit( data, unittype, loc, this.mongoInterface )

        console.log('spawn result ', result )

        if(result.error)
        {
          channel.emit('errormessage', {message: result.error})
        }else{

 
            clientSocketChannels.set(data.publicAddress , channel  );

         //   this.forceClientIntoGridCommsChannel(data.publicAddress  , result.gridUUID )

            cachedPlayerData.set(data.publicAddress,  {}  )


        }
      }else{
        channel.emit('errormessage', {message: 'unauthorized'})
      }


    })



    channel.on('requestNearbyChunkState', async (data) => {
      console.log(`got ${data} from "requestNearbyChunkState"`)

      var authed = await this.verifyAuthToken(data)

      if(authed)
      {

        let locationVector = data.locationVector
        let nearbyLocalChunks = data.nearbyLocalChunks


        console.log('data', JSON.stringify(data)) 

        let localChunksKeys = Object.keys( nearbyLocalChunks  )

        //console.log('localChunksKeys', localChunksKeys) 


        //use a local chunkManager cache !! To avoid so many DB reads 
        let currentChunkArrayDeltaCounters = await VoxelHelper.readChunkDeltaCountersFromDatabase( localChunksKeys , this.mongoInterface ) 

        let cachedChunkArrayDeltaCounters = cachedVoxelWorld.getChunkDeltaCountersFromCache( localChunksKeys )
        


        let desyncedChunksKeys = []
       // let syncedChunksKeys = [] 

        for( let chunkId of Object.keys(currentChunkArrayDeltaCounters) ){

          if( cachedChunkArrayDeltaCounters[chunkId] == null || 
            currentChunkArrayDeltaCounters[chunkId] > cachedChunkArrayDeltaCounters[chunkId] ){
              desyncedChunksKeys.push( chunkId )
            }else{
            //  syncedChunksKeys.push( chunkId )
            }

        }

        console.log('desynced ' ,desyncedChunksKeys )
        

        let currentChunksFromDatabase =  await VoxelHelper.readChunksFromDatabase( desyncedChunksKeys , this.mongoInterface ) 
       
        cachedVoxelWorld.saveChunksToCache( currentChunksFromDatabase )


        let currentChunksFromCache = cachedVoxelWorld.getChunksFromCache( localChunksKeys ) ; 
       
        let currentChunkArray = Object.assign({} , currentChunksFromCache)  

 
        console.log('meep currentChunkArray', Object.keys(currentChunkArray))

        
        let missingChunkIdArray = VoxelHelper.findMissingChunks(nearbyLocalChunks,currentChunkArray ) 
 
        console.log('missingChunkIdArray', missingChunkIdArray) 

       // console.log('test chunk ', currentChunkArray[ desyncedChunkIdArray[0]])

       let updatedChunkArray = {} 

        for(let key of missingChunkIdArray){
          updatedChunkArray[key] = currentChunkArray[key]

        } 
          

        let updatedCompressedChunkArray = VoxelHelper.getCompressedChunkArray( updatedChunkArray )

        console.log('updatedCompressedChunkArray', Object.keys(updatedCompressedChunkArray) ) 

        //console.log( updatedCompressedChunkArray['-1|0|0'] ) 

        //may have to send chunk slices.. but for now we do this 
        for (const [key, chunk] of Object.entries(updatedCompressedChunkArray)) {

          if(typeof chunk != 'undefined'){
            console.log( 'emit ',  {key:key, chunk:    chunk  } )
            channel.emit('updatedChunk', {chunk:   chunk  })
          }
           
        }



        //need to send deltas for these chunks -- so we can avoid sending the entire chunk in 10 ticks
        let desyncedChunkIdArray = VoxelHelper.findDesyncedChunks(nearbyLocalChunks,currentChunkArray ) 

      

       

      }else{
        channel.emit('errormessage', {message: 'unauthorized'})
      }


    })


    //receive client commands - every 1 second .. queue, turn based ticks
    channel.on('clientCommand', async data => {
      console.log(`got ${data} from "clientCommands"`)

      var authed = await this.verifyAuthToken(data)

      if(authed)
      {
       // var result = await this.gameState.handleClientCommand( data  )



      }else{
        channel.emit('errormessage', {message: 'unauthorized'})
      }

    })




    //send the client the updated state of his grid
  /*  channel.on('getGridState', async (data) => {
      console.log(`got ${data} from "getGridState"`)

      var authed = this.verifyAuthToken(data)

      var result = await this.gameState.getGridState( data  )

      io.emit('gridState', result )
      //make this a broadcast to a channel -- the channel belongs to the grid
    //  io.emit('authorized', {publicAddress: recoveredAddress, authToken: authToken})


      if(result.error)
      {
          io.emit('errormessage', {message: result.error})
      }
    })*/




  })


/*
  io.onConnection((channel: ServerChannel) => {
    console.log(channel.userData) // { username: 'Yannick', level: 13, points: 8987 }
  })*/

    io.addServer(expressServer)

   // io.listen(9208) // default port is 9208

  }














  async update(){ 

    //do this in here?? 
    let result = await GameState.updateGridPhaseActivityMetrics(this.mongoInterface)

    await this.updateClientChangedGridsMonitoring(this.mongoInterface)
    
    await this.broadcastGridDataToRooms()
  }

 


  async updateClientChangedGridsMonitoring(mongoInterface){



    let activePlayerUnits = await mongoInterface.findAll('units',{aiFaction: null, active:true, isStatic:false , dead:false } )

    for(var activePlayerUnit of  activePlayerUnits)
    {
      var player = await mongoInterface.findOne('activePlayers', { possessedUnitId: activePlayerUnit._id })

      if(activePlayerUnit && player)
      {

        var griduuid = activePlayerUnit.gridUUID
        var instanceuuid = activePlayerUnit.instanceUUID

        let cachedPlayer = cachedPlayerData.get(player.publicAddress)


        //console.log('activePlayerUnit',activePlayerUnit , cachedPlayer)
        
        if(cachedPlayer){ 

            let cachedGridUUID = cachedPlayer.gridUUID //cachedPlayerGridUUID.get(player.publicAddress)
            let cachedInstanceUUID = cachedPlayer.instanceUUID
                //check for player grid changes to switch their socket channel
              if(griduuid){
                if(griduuid != cachedGridUUID || instanceuuid!= cachedInstanceUUID){


                    let socketRoomName = WorldHelper.getSocketRoomNameForGridInstance( griduuid,instanceuuid )


                      this.forceClientIntoGridCommsChannel(player.publicAddress, socketRoomName )



                }
              }
         }

         //this map basically remembers the socket channel that each player is in...based on where their possessed unit is 
         cachedPlayerData.set(player.publicAddress, Object.assign( player, {gridUUID: griduuid,instanceUUID:instanceuuid}) )


     }
    }





}



  //not happening 
  async forceClientIntoGridCommsChannel(clientPublicAddress, newGridUUID)
  {
    console.log('force into comms ', clientPublicAddress, newGridUUID)

        var channel = clientSocketChannels.get( clientPublicAddress )
        channel.join( newGridUUID  )//throw the client in the grids room
  }

  async broadcastGridDataToRooms( ){

   
    //update player queued actions
    var activeGridPhases = await this.mongoInterface.findAll('gridphases', { hasActivePlayerUnits:true })
    for(var activePhase of activeGridPhases) 
    {
     
      var gridUUID = activePhase.gridUUID
      var instanceUUID = activePhase.instanceUUID
      var gridPhaseState = await GameState.getGridPhaseStateData(gridUUID,instanceUUID, this.mongoInterface, this.redisInterface);
      let socketRoomName = WorldHelper.getSocketRoomNameForGridInstance( gridUUID , instanceUUID)
      io.room( socketRoomName ).emit('gridPhaseState', gridPhaseState, {reliable: false })
     
    }
  }

  //check the redis db
  //make sure this has an expire time of 24 hours 
  async verifyAuthToken(credentials)
  {
    var token = credentials.authToken;
    var publicAddress = credentials.publicAddress;

    console.log('checking credentials', credentials)

    var existingJSON  = await this.redisInterface.findHashInRedis('auth_token',publicAddress )
    var existing = JSON.parse(existingJSON)
    console.log('found record ', existing, token,  existing.authToken == token )

    if(existing.authToken == token)
    {
      return true
    }

    return false;
  }


async web3ecRecover(challenge,signature)
{
 console.log('ecrecover ', challenge, signature)

 var addr =   await new Promise(async (resolve,reject) => {

    this.web3.personal.ecRecover( challenge , signature, function (err,result){
          if (err) {return console.error(err)}
          console.log('ecrecover:' + result)
          resolve(result);
   })

 })

 return addr;

}

//https://ethereum.stackexchange.com/questions/12033/sign-message-with-metamask-and-verify-with-ethereumjs-utils

  async ethJsUtilecRecover(msg,signature)
  {

    console.log('ecrecover ', msg, signature)
      var res = ethJsUtil.fromRpcSig(signature)

      const msgHash = ethJsUtil.hashPersonalMessage(Buffer.from( msg ) );


      var pubKey = ethJsUtil.ecrecover( ethJsUtil.toBuffer(msgHash) , res.v, res.r, res.s);
      const addrBuf = ethJsUtil.pubToAddress(pubKey);
      const recoveredSignatureSigner    = ethJsUtil.bufferToHex(addrBuf);
      console.log('rec:', recoveredSignatureSigner)


    return recoveredSignatureSigner;

   }


  init()
  {

  }

  async shutdown()
  {
    clearInterval( broadcastGridsWorker );
  }

}
