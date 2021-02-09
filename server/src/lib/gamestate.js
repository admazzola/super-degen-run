const THREE = require('three')

const  dimensionHelper = require('../../../shared/lib/dimensionHelper')
const entitytypes = require('../../../shared/worlddata/entitybasetypes.json')

const UnitHelper = require('../../../shared/lib/UnitHelper')

var InventoryManager = require('./InventoryManager')

var GridUpdater = require('./util/gridupdater')
var gridUpdater;


module.exports = class GameState {

  //this talks to mongo and redis heavily

  constructor( mongoInterface, redisInterface)
  {
    console.log('server booted gamestate')
    this.mongoInterface = mongoInterface
    this.redisInterface = redisInterface

    let inventoryManager = new InventoryManager(mongoInterface)


    gridUpdater = new GridUpdater(1, mongoInterface,redisInterface )
    gridUpdater.start();
  }


  init()
  {

  }

  getInventoryManager()
  {
    return inventoryManager;
  }


  //KEEP IN MIND - the server never stores the facing vector- that is always inferred by the client and lerps
  getNewPlayerSpawnLocation()
  {
    //planet 1 on xel
    return {
      dimension: 'eden',
      instanceUUID:  null, //'361c0d2091b08f0c',
      locationVector: new THREE.Vector3( 0, 0, 0 ),
      velocityVector: new THREE.Vector3( 0, 0, 0 )
    }

  }



  //used for brand new players  
  async spawnPlayerUnit( data, unittype , location)
  {
    console.log('spawning player unit', data)
    //make sure the unit  is not already spawned

    let result;
      try{
          result = await this.mongoInterface.findOne('activePlayers', {publicAddress: data.publicAddress })
      }catch(e)
      {
        console.log('cannot find possessed unit')
      }




    if(result)
    {
      console.log('error - player unit exists - cannot spawn')

      var unitId = result.possessedUnitId;
      var unit = await this.mongoInterface.findOne('units',  {_id:unitId} )

      if(!unit)
      {
        return {error: 'no unit for possession - corrupted database'}
      }

      //this is false ?
      return {unitId: unitId, instanceUUID: unit.instanceUUID }
 
    }else{

      var basetype = unittype



      await this.mongoInterface.upsertOne('activePlayers',
        {publicAddress: data.publicAddress},
        {publicAddress: data.publicAddress,  active:true}
        )

      let player = await this.mongoInterface.findOne('activePlayers',{publicAddress: data.publicAddress})


      var newUnitData = {
        dimension: location.dimension,
        instanceUUID: location.instanceUUID,
        locationVector: location.locationVector,// new THREE.Vector3( 0, 1, 0 )  {x: location.x, y: location.y},
        velocityVector: location.velocityVector,
        basetype: basetype,
        unittype: 'unit',
        stats: UnitHelper.getInitialStatsForEntityType( basetype ),
        active:  true,   //owner not logged out
        invisible: false,
        isStatic:false,
        owningPlayerId: player._id,
 
       }



      var response = await this.mongoInterface.insertOne('units',  newUnitData )

      var insertedId = response.insertedId ;
      console.log('got insert one response',insertedId)


      await this.mongoInterface.upsertOne('activePlayers',
      {publicAddress: data.publicAddress},
        {publicAddress: data.publicAddress,
          possessedUnitId: insertedId,
          instanceUUID: newUnitData.instanceUUID,
          active:true
        }
      )

      return {possessedUnitId: insertedId, instanceUUID: newUnitData.instanceUUID }
    }


  }



  //figures out which gridphases have active players and manages grid updater ids
  async updateGridPhaseActivityMetrics()
  {



    let activePlayerUnits = await this.mongoInterface.findAll('units',{aiFaction: null, active:true, isStatic:false , dead:false/*, unittype: {$ne:'shipwreck'}*/} )

    let totalActivePlayerCount = 0
 

    for(var activePlayerUnit of  activePlayerUnits)
    {
      var player = await this.mongoInterface.findOne('activePlayers', { possessedUnitId: activePlayerUnit._id })

      if(activePlayerUnit && player)
      {
        var griduuid = activePlayerUnit.gridUUID
        var instanceuuid = activePlayerUnit.instanceUUID
 
     }
    }
 

    let allGridPhases = await this.mongoInterface.findAll('gridphases')


    for( var phase of allGridPhases){




        let activePlayerUnitsInGridPhase = activePlayerUnits.filter( x => (x.gridUUID == phase.gridUUID && x.instanceUUID == phase.instanceUUID ))
 
    
        let hasActivePlayerUnits = (activePlayerUnitsInGridPhase && activePlayerUnitsInGridPhase.length>0)

     
  
        if(!isNaN(activePlayerUnitsInGridPhase.length)){
         totalActivePlayerCount = totalActivePlayerCount + parseInt(activePlayerUnitsInGridPhase.length)
       }

       let newGridUpdaterOwnedBy = null;


       let lastTimeWithActivePlayerUnits = phase.lastTimeWithActivePlayerUnits


       if(hasActivePlayerUnits){  //reset the count
         lastTimeWithActivePlayerUnits = Date.now()

         await this.mongoInterface.updateOne('gridphases', {_id: phase._id},
          {
            lastTimeWithActivePlayerUnits:  lastTimeWithActivePlayerUnits
           })
       }


       if( hasActivePlayerUnits || lastTimeWithActivePlayerUnits > Date.now() - 5000  ){
         newGridUpdaterOwnedBy = 1
       }

       //only update if needed
      if(phase.ownedByGridUpdaterId != newGridUpdaterOwnedBy || phase.hasActivePlayerUnits!= hasActivePlayerUnits){

        if(!phase.hasActivePlayerUnits && hasActivePlayerUnits){
          await GameState.handleGridPhaseReactivation( phase.gridUUID, phase.instanceUUID, this.mongoInterface )
        }
 

        if(!phase.hasActivePlayerUnits && !hasActivePlayerUnits && phase.lastMobResetTimestamp < Date.now() - 1000*60*10 ){ //ten minutes
          await GameState.cleanupStaleGridPhase( phase.gridUUID, phase.instanceUUID, this.mongoInterface )
        }
 
        await this.mongoInterface.updateOne('gridphases', {_id: phase._id},
         {
           hasActivePlayerUnits: hasActivePlayerUnits,
           ownedByGridUpdaterId: newGridUpdaterOwnedBy
          })

      }


    }

   //   let newAPIData = {collectionName: 'serverStats' , arg: {activePlayersCount: totalActivePlayerCount}}
    //  await apiServerInterface.upsertNewApiData( newAPIData.collectionName, {}, newAPIData.arg )



  }


  //returns uuid of grids

  //figures out which grids have active players and manages grid updater ids
  /*async updateGridActivity()
  {

    var activeGrids = [];

    await this.mongoInterface.updateMany('dimensionalgrid', {},{ hasActivePlayers:false })

    //stub code for now ..before multiple clusters
    await this.mongoInterface.updateMany('dimensionalgrid',  {}, { ownedByGridUpdaterId:1 })



    var results = await this.mongoInterface.findAll('activePlayers', { active:true })

    for(var i in results)
    {
      var unit = await this.mongoInterface.findOne('units', {_id: results[i].possessedUnitId})

      if(unit)
      {
        var griduuid = unit.grid
       if( !activeGrids.includes(griduuid)  )
       {

         await this.mongoInterface.updateOne('dimensionalgrid', {uuid: griduuid},{ hasActivePlayers:true })

         activeGrids.push(griduuid)
       }
      }
    }
  }*/

  static async handleGridPhaseReactivation(gridUUID, instanceUUID, mongoInterface)
  {

  }
  static async cleanupStaleGridPhase(gridUUID, instanceUUID, mongoInterface)
  {

  }


  async getListOfGridsWithPlayers()
  {


      var activeGrids = await this.mongoInterface.findAll('dimensionalgrid', { hasActivePlayers:true })

      return activeGrids ;

  }

  async getEntitiesOnGrid( gridUUID )
   {
      

       var existingGrid = await this.mongoInterface.findOne('dimensionalgrid',{gridUUID: gridUUID  }  )


       var entities = await this.mongoInterface.findAll('units', {gridUUID: gridUUID, active:true  })
    
       var players = await this.mongoInterface.findAll('activePlayers', {gridUUID: gridUUID })

       return { grid:existingGrid, entities: entities,    players: players   }


   }


   async update()
   {

       // await this.updatePlayerActiveActions(  )


   }


   //move this to mongo 
   /*
   async updatePlayerActiveActions()
   {


        let playersWithActions = await this.redisInterface.getResultsOfKeyInRedis('activeAction')

      if(playersWithActions.length <= 0)
      {
        console.log('WARN: no queued actions')
        return
      }

 

     for(var i in playersWithActions)
     {
       let playerAddress = playersWithActions[i]
      let actionData = await this.redisInterface.findHashInRedis('activeAction', playerAddress )


       let action = JSON.parse(  actionData )

       var player = await this.mongoInterface.findOne('activePlayers', {publicAddress: playerAddress })

       if( !player ) continue;
       var unit = await this.mongoInterface.findOne('units', {_id:player.possessedUnitId})



       if(action.actionName == 'dock')
       {


         var targetUnit = await this.mongoInterface.findById('units', action.targetUnitId )

        // console.log('handle action: ', action.actionName, targetUnit)

         //dock and approach
         if(UnitHelper.unitsWithinServiceRange(unit,targetUnit))
         {

            //dock and cancel this
            await this.dockUnitInEntity( unit,targetUnit )
            await this.clearPlayerActiveAction( player )
         }else{

           console.log(' keep approaching ',  targetUnit )
           //keep approaching
          await this.setUnitVelocityToApproachLocation( unit, targetUnit.locationVector  )

         }


       }

       if(action.actionName == 'approach')
       {


         var targetUnit = await this.mongoInterface.findById('units', action.targetUnitId )

         console.log('handle action: ', action.actionName, targetUnit)

         //dock and approach
         if(UnitHelper.getDistanceBetweenUnits(unit,targetUnit) < 25 ) //approach cancel range
         {
           await this.setUnitVelocityToZero( unit   )
           await this.setPlayerActiveAction(action.playerAddress , JSON.stringify({}) )
         }else{
           await this.setUnitVelocityToApproachLocation( unit, targetUnit.locationVector  )
         }


       }

     }

   }
*/

/*
   async setUnitVelocityToApproachLocation( unit, destination )
   {
      let direction = UnitHelper.getFacingVectorFromUnitToLocation(unit, destination)

      return await this.setUnitVelocityTowardsDirection(unit,direction)
   }

   async setUnitVelocityTowardsDirection( unit, direction )
   {

     var entity = await this.mongoInterface.findOne('units', {_id: unit._id } )

      var shipSpeedFactor = UnitHelper.getInitialStatsForEntityType(unit.basetype).speed

      entity.velocityVector = direction.multiplyScalar( shipSpeedFactor )

     await this.mongoInterface.updateOne('units', {_id: entity._id } , {velocityVector: entity.velocityVector})
   }



    async setUnitVelocityToZero( unit, destination )
    {
      var entity = await this.mongoInterface.findOne('units', {_id: unit._id } )

       entity.velocityVector = new THREE.Vector3(0,0,0)
       await this.mongoInterface.updateOne('units', {_id: entity._id } , {velocityVector: entity.velocityVector})
    }



    async clearPlayerActiveAction(player)
    {
      let playerAddress = player.publicAddress
      await this.setPlayerActiveAction(playerAddress , JSON.stringify({}) )
    }

   async setPlayerActiveAction(playerAddress, activeActionData)
   {

     await this.redisInterface.storeRedisHashData('activeAction',playerAddress, JSON.stringify(activeActionData) )

   }
*/



   /*
     ('setShipDirectionVector',{vector: x})
     ('initiateWarp',{griduuid: x})
     ('activateModule',{targetUnitId: x, moduleId: x})
     ('dock',{targetUnitId: x})
   */
   async handleClientCommand( data )
   {
     console.log('handle client command', data)
     var publicAddress= data.publicAddress;
     var cmdName = data.cmdName;
     var cmdParams = data.cmdParams;

     var player = await this.mongoInterface.findOne('activePlayers', { publicAddress: publicAddress, active:true })

     var unit = await this.mongoInterface.findOne('units', {_id:player.possessedUnitId})



     await this.clearPlayerActiveAction( player )

    /* if(data.cmdName === 'setShipDirectionVector')
     {
       var speedPercent = 1.0; //could accept this from client


       var facingVec = new THREE.Vector3(cmdParams.vector.x,cmdParams.vector.y,cmdParams.vector.z).normalize()

       await this.setUnitVelocityTowardsDirection( unit, facingVec )
       
     }*/

     


   }


 

  async onPlayerDisconnect()
  {
    //you must remove it from units and possessed units !!!
    //and clean up players states who may have been possessing it -- move their cameras or respawn them


  }

  async removeUnit()
  {
    //you must remove it from units and possessed units !!!
    //and clean up players states who may have been possessing it -- move their cameras or respawn them


  }




    async getGridTickNumber(gridUUID)
   {
     var existingGrid = await this.mongoInterface.findOne('dimensionalgrid',{gridUUID: gridUUID  }  )
     return existingGrid.gridTick
   }


   setClientChangedGridCallback(callback)
   {


     gridUpdater.setClientChangedGridCallback( callback )
   }


}
