const THREE = require('three')


const GRID_UPDATE_RATE = 500;

const  GalaxyHelper = require('../../../../shared/lib/WorldHelper')

const UnitHelper = require('../../../../shared/lib/UnitHelper')


var clientChangedGridCallback //for socket server



module.exports = class GridUpdater {

  //this talks to mongo and redis heavily

  constructor( gridUpdaterId, mongoInterface, redisInterface)
  {
    console.log('server booted gridupdater')
    this.mongoInterface = mongoInterface
    this.redisInterface = redisInterface



    this.gridUpdaterId = gridUpdaterId
  }

  //used when a client player changes his grid....forces them into a different socket server channel
 /* setClientChangedGridCallback(callback)
  {
    clientChangedGridCallback = callback;


  }*/



  start()
  {

    setInterval(this.updateOwnedGrids.bind(this), GRID_UPDATE_RATE)

  }

  async updateOwnedGrids()
  {
    let ownedGrids = await this.mongoInterface.findAll('celestialgrid', {ownedByGridUpdaterId: this.gridUpdaterId})

    for(var i in ownedGrids)
    {
      let uuid = ownedGrids[i].uuid

      this.updateGrid(uuid,GRID_UPDATE_RATE)

    }


  }


  /*
  This can be done in a vacuum; a thread that is just watching mongo
  */

     async updateGrid(gridUUID, updateRate)
     {


         var existingGrid = await this.mongoInterface.findOne('celestialgrid',{uuid: gridUUID  } )

         let gridTickNumber = existingGrid.gridTick+1 ;
         //updated in an atomic way..    this has more finesse and is more threadsafe
         var grid = await this.mongoInterface.updateOne('celestialgrid',{uuid: gridUUID  },    { gridTick: gridTickNumber }     )



       var updateRateSeconds = updateRate / 1000.0;
       var units = await this.mongoInterface.findAll('units', {grid: gridUUID, active:true, isStatic:false })
       var statics = await this.mongoInterface.findAll('units', {grid: gridUUID, active:true, isStatic:true })
        //var allEntities = units.concat(statics)

       for(var i in units)
       {
         var item = units[i]

         //update unit forward velocity
         //be sure you are cloning vectors or else you will affect them
         if( UnitHelper.unitIsActiveInSpace( item )   /*&&   !(item.velocityVector.x==0&&item.velocityVector.y==0&&item.velocityVector.z==0 )*/ ) //if active and moving
         {


          var locVector =   new THREE.Vector3(item.locationVector.x,item.locationVector.y,item.locationVector.z )
          var velVector =   new THREE.Vector3(item.velocityVector.x,item.velocityVector.y,item.velocityVector.z )

          var futureLocation = locVector.clone().add( velVector.clone().multiplyScalar(updateRateSeconds)   )
            //make sure there is nothing in the way !

            var result =  UnitHelper.collidingWithAnyEntity( futureLocation.clone(), statics  )
            if( result == null || UnitHelper.unitHasWarpDestination(item) ){
               item.locationVector = locVector.clone().add( velVector.clone().multiplyScalar(updateRateSeconds)   )

            }else{
              // bounce off
          //    console.log( 'meep', locVector ,  result.locationVector )
              var vectorAway = (locVector.clone().sub( result.locationVector  )).normalize()

              if(vectorAway.x==0 && vectorAway.y==0 && vectorAway.z==0){ vectorAway.x = 1;}

              var bumpOutVelocity = 5;

              var insideOfCollidable =  UnitHelper.collidingWithAnyEntity( locVector.clone(), statics  )
              if(insideOfCollidable)
              {
                bumpOutVelocity = 100
              }

            //  var velVector =   new THREE.Vector3(item.velocityVector.x,item.velocityVector.y,item.velocityVector.z )
      //        console.log('colliding - vec away',vectorAway , vectorAway.clone().multiplyScalar(updateRateSeconds).multiplyScalar(100) )
              item.locationVector = locVector.clone().add( vectorAway.clone().multiplyScalar(updateRateSeconds).multiplyScalar(  bumpOutVelocity )   ) //shoot out
              item.velocityVector = vectorAway.clone().normalize()
            }//BUG - this can get stuck in a planet !
         }


         if( UnitHelper.unitIsActiveInSpace( item )   && UnitHelper.unitHasWarpDestination(item)  )  //is warping
         {


           //var gridTick = gridTickNumber

            var ticksToStartWarp = UnitHelper.getTicksToStartWarp(item)
            var ticksToFinishWarp = UnitHelper.getTicksToFinishWarp(item)

               console.log('unit is trying to warp...', gridTickNumber , item.warpStartTick, ticksToStartWarp )

            if(gridTickNumber >= (item.warpStartTick + ticksToFinishWarp )){

              console.log("Finishing Warp ", item )

               item = await this.warpUnitToNewGrid( item , item.warpDestinationGridUUID )
               continue;//no need to update mongo for this unit again this tick


            }else if(gridTickNumber >= (item.warpStartTick + ticksToStartWarp )){



             var canWarp = this.checkWarpStatus(item)

             if(canWarp)
             {
                console.log('Starting Warp')
                 var originGrid = await this.mongoInterface.findOne('celestialgrid', {uuid: item.grid })
                 var destinationGrid = await this.mongoInterface.findOne('celestialgrid', {uuid: item.warpDestinationGridUUID })

                 var warpSpeed = 5000;

                 //preparing to warp!! face the proper way -- overriding your commanded velocity
                 item.velocityVector = GalaxyHelper.getFacingVectorFromGridToGrid(  originGrid ,destinationGrid ).normalize().multiplyScalar( warpSpeed )
                 console.log('start warp vel', item.velocityVector )

             }else{ //cancel warp
               item.warpStartTick = 0;
               item.warpDestinationGridUUID = null;
             }
            }else{
              //preparing to warp
            //  console.log('preparing to warp' , gridTick , item.warpStartTick + ticksToStartWarp  )
             var originGrid = await this.mongoInterface.findOne('celestialgrid', {uuid: item.grid })
             var destinationGrid = await this.mongoInterface.findOne('celestialgrid', {uuid: item.warpDestinationGridUUID })

             //preparing to warp!! face the proper way -- overriding your commanded velocity
             item.velocityVector = GalaxyHelper.getFacingVectorFromGridToGrid(  originGrid ,destinationGrid ).normalize()

           }


         }


         //only update exactly what we are concerned with - atomically and more thread safe .
         await this.mongoInterface.updateOne('units',
         {_id: item._id },
         {velocityVector: item.velocityVector,
           locationVector: item.locationVector,
           grid: item.grid,
            warpStartTick: item.warpStartTick,
            warpDestinationGridUUID: item.warpDestinationGridUUID } )


       }

       //if an entity has 0 health, destroy it

       //move location vectors by the velocity vector


     }





        async checkWarpStatus( entity  )
        {
          //  and look at their warp core strength COMPUTED
          //IMPLEMENT ME

          return true
        }

       async warpUnitToNewGrid(entity, newGridUUID )
       {
         if(newGridUUID == null ){
           console.log('WARN - CANNOT WARP TO NULL GRID ', entity)
         }


         var newCoords = new THREE.Vector3(0,0,0); //get the coords of the celestial
         //you move it and the player !!
          var player = await this.mongoInterface.findOne('activePlayers', {possessedUnitId: entity._id })
         // player.grid = newGridUUID;
         var unit = await this.mongoInterface.findOne('units', {_id: entity._id })




         //set the warp tick value to 0


         //need to fix their socket channel !   //(clientPublicAddress, newGridUUID)
         clientChangedGridCallback( player.publicAddress, newGridUUID)

         entity.grid = newGridUUID
         entity.locationVector = newCoords
         entity.velocityVector = new THREE.Vector3(0.1,0,0.1);
         entity.warpStartTick = 0;
         entity.warpDestinationGridUUID = null;

         await this.mongoInterface.updateOne('activePlayers', {_id: player._id }, {grid: newGridUUID })


         await this.mongoInterface.updateOne('units',
           {_id: entity._id} ,
           {grid:entity.grid,
           locationVector:newCoords,
           velocityVector:new THREE.Vector3(0.1,0,0.1),
           warpStartTick: 0,
           warpDestinationGridUUID: null  } )


         return entity;

       }





}
