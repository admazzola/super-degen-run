const THREE = require('three')

const  GalaxyHelper = require('../../../shared/lib/GalaxyHelper')
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
      galaxy: 'toast prime',
      griduuid: '361c0d2091b08f0c',
      locationVector: new THREE.Vector3( 0, 0, 0 ),
      velocityVector: new THREE.Vector3( 5, 0, 0 )
    }

  }



  //used for brand new players and used for undocking
  async spawnPlayerShip( data, shiptype , location)
  {
    console.log('spawning player ship', data)
    //make sure the ship is not already spawned

    let result;
      try{
          result = await this.mongoInterface.findOne('activePlayers', {publicAddress: data.publicAddress })
      }catch(e)
      {
        console.log('cannot find possessed unit')
      }




    if(result)
    {
      console.log('error - player ship exists - cannot spawn')

      var unitId = result.possessedUnitId;
      var unit = await this.mongoInterface.findOne('units',  {_id:unitId} )

      if(!unit)
      {
        return {error: 'no unit for possession - corrupted database'}
      }

      //this is false ?
      return {unitId: unitId, gridUUID: unit.grid }

      //  return {error: 'error - player ship exists - cannot spawn' }
    }else{

      var basetype = shiptype



      await this.mongoInterface.upsertOne('activePlayers',
        {publicAddress: data.publicAddress},
        {publicAddress: data.publicAddress,  active:true}
        )

      let player = await this.mongoInterface.findOne('activePlayers',{publicAddress: data.publicAddress})


      var newUnitData = {
        galaxy: location.galaxy,
        grid: location.griduuid,
        locationVector: location.locationVector,// new THREE.Vector3( 0, 1, 0 )  {x: location.x, y: location.y},
        velocityVector: location.velocityVector,
        basetype: basetype,
        unittype: 'ship',
        stats: UnitHelper.getInitialStatsForEntityType( basetype ),
        active:  true,   //owner not logged out
        invisible: false,
        isStatic:false,
        owningPlayerId: player._id,

        warpStartTick: 0,
        warpDestinationGridUUID: null
    //    warping: false  //for animations and leaving the camera behind
         }



      var response = await this.mongoInterface.insertOne('units',  newUnitData )

      var insertedId = response.insertedId ;
      console.log('got insert one response',insertedId)


      await this.mongoInterface.upsertOne('activePlayers',
      {publicAddress: data.publicAddress},
        {publicAddress: data.publicAddress,
          possessedUnitId: insertedId,
          grid: newUnitData.grid,
          active:true
        }
      )

      return {possessedUnitId: insertedId, gridUUID: newUnitData.grid }
    }


  }

  //returns uuid of grids

  //figures out which grids have active players and manages grid updater ids
  async updateGridActivity()
  {

    var activeGrids = [];

    await this.mongoInterface.updateMany('celestialgrid', {},{ hasActivePlayers:false })

    //stub code for now ..before multiple clusters
    await this.mongoInterface.updateMany('celestialgrid',  {}, { ownedByGridUpdaterId:1 })



    var results = await this.mongoInterface.findAll('activePlayers', { active:true })

    for(var i in results)
    {
      var unit = await this.mongoInterface.findOne('units', {_id: results[i].possessedUnitId})

      if(unit)
      {
        var griduuid = unit.grid
       if( !activeGrids.includes(griduuid)  )
       {

         await this.mongoInterface.updateOne('celestialgrid', {uuid: griduuid},{ hasActivePlayers:true })

         activeGrids.push(griduuid)
       }
      }
    }
  }

  async getListOfGridsWithPlayers()
  {


      var activeGrids = await this.mongoInterface.findAll('celestialgrid', { hasActivePlayers:true })

      return activeGrids ;

  }

  async getEntitiesOnGrid( gridUUID )
   {
      // var statics = this.getStaticEntitiesOnGrid( gridUUID ) // use mongo


       var existingGrid = await this.mongoInterface.findOne('celestialgrid',{uuid: gridUUID  }  )


       var entities = await this.mongoInterface.findAll('units', {grid: gridUUID, active:true  })
    //   var statics = await this.mongoInterface.findAll('units', {grid: gridUUID, active:true, isStatic:true })
      // var gridentities = entities.concat(statics)


    //   var unitStatuses = await this.mongoInterface.findAll('unitStatuses', {grid: gridUUID, active:true })
    //   var entityStatuses = await redisInterface.findHashInRedis('entityStatus', )

       var players = await this.mongoInterface.findAll('activePlayers', {grid: gridUUID })

       return { grid:existingGrid, entities: entities,    players: players   }


   }


   async update()
   {

     await this.updatePlayerActiveActions(  )


   }

   async updatePlayerActiveActions()
   {


        let playersWithActions = await this.redisInterface.getResultsOfKeyInRedis('activeAction')

      if(playersWithActions.length <= 0)
      {
        console.log('WARN: no queued actions')
        return
      }


  //   var players = await this.mongoInterface.findAll('activePlayers', {grid: gridUUID })

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

     if(data.cmdName === 'setShipDirectionVector')
     {
       var speedPercent = 1.0; //could accept this from client


       var facingVec = new THREE.Vector3(cmdParams.vector.x,cmdParams.vector.y,cmdParams.vector.z).normalize()

       await this.setUnitVelocityTowardsDirection( unit, facingVec )
       /*
       var shipSpeedFactor = UnitHelper.getInitialStatsForEntityType(unit.basetype).speed

       var newVelocityVector = facingVec.multiplyScalar(shipSpeedFactor).multiplyScalar(speedPercent);


       unit.velocityVector =  newVelocityVector;
       console.log('updated ship velocity ', unit.velocityVector)

       var unit = await this.mongoInterface.upsertOne('units', {_id: unit._id} , unit )*/

     }

     if(data.cmdName === 'initiateWarp')
     {
       //need to set ship warping stat = true
       //need to exponentially affect velocity while ship is warping -- in its current direction


       //need to keep track of the time at which the ship started warp and keep polling for when its done -- then we change the grid
       //if the ship is warp jammed at the end of the time limit, the warp is cancelled
       var gridTick = await this.getGridTickNumber(unit.grid)



       console.log('meep', unit )


       var unit = await this.mongoInterface.upsertOne('units', {_id: unit._id} , {warpStartTick: gridTick,warpDestinationGridUUID:cmdParams.griduuid } )

     }


     if(data.cmdName === 'approach')
     {




     }

     if(data.cmdName === 'dock')
     {
          var targetUnitId = cmdParams.targetUnitId;

          console.log('got docking cmd ', unit, targetUnitId)

          var dockTarget = await this.mongoInterface.findById('units',   targetUnitId  )

          var targetIsDockable = UnitHelper.unitHasService( dockTarget, 'docking'  )
          var targetWithinServiceRange = UnitHelper.unitsWithinServiceRange(unit, dockTarget )

          if(targetWithinServiceRange)
          {

            if(targetIsDockable)
            {
              await this.dockUnitInEntity(unit,dockTarget)
            }

          }else{
            let activeActionData = {
              actionName: 'dock',
              targetUnitId: targetUnitId
            }


            //queue approachAndDock as the players current ActiveAction in redis
            this.setPlayerActiveAction(publicAddress, activeActionData)
          }




     }


     if(data.cmdName === 'undock')
     {
    //  set active to true
        await this.undockUnitFromEntity( unit )
     }


   }



  //YAY This works
  async dockUnitInEntity( unit, dockTarget )
  {
      var player = await this.mongoInterface.findOne('activePlayers', {possessedUnitId: unit._id })
      var unit = await this.mongoInterface.findOne('units', {_id:unit._id})


      var targetIsDockable = UnitHelper.unitHasService( dockTarget, 'docking'  )

      if(targetIsDockable )
      {
        this.clearPlayerActiveAction( player )


        console.log('docking  ', unit, dockTarget)


        await this.mongoInterface.updateOne('units', {_id:unit._id}, {dockedInStation: dockTarget._id } )
        await this.mongoInterface.updateOne('activePlayers', {_id:player._id}, {dockedInStation: dockTarget._id } )




      }else{
        console.log('WARN: dockTarget not dockable ')
      }


  }

  async undockUnitFromEntity( unit )
  {

    var player = await this.mongoInterface.findOne('activePlayers', {possessedUnitId: unit._id })
    var unit = await this.mongoInterface.findOne('units', {_id:unit._id})



    if( GalaxyHelper.playerIsDocked( player ) ){



      await this.mongoInterface.updateOne('units', {_id:unit._id}, {dockedInStation:null} )
      await this.mongoInterface.updateOne('activePlayers', {_id:player._id}, {dockedInStation:null} )

    }



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
     var existingGrid = await this.mongoInterface.findOne('celestialgrid',{uuid: gridUUID  }  )
     return existingGrid.gridTick
   }


   setClientChangedGridCallback(callback)
   {


     gridUpdater.setClientChangedGridCallback( callback )
   }


}
