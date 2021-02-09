import * as THREE from 'three'

const EventEmitter = require('events');
const entitiesEmitter = new EventEmitter();

const UnitHelper = require('../../shared/lib/UnitHelper')

var entitytypes = require('../../shared/worlddata/entitybasetypes.json')


var lerpProgressMs = 0;

var pastGridEntities = new Map() //cache of entities on grid, n-1 ticks (for lerping)
var currentGridEntities = new Map() //cache of current enities on grid
var sceneObjectsMap = new Map() //cache of the scene objects for entities on grid

var playersOnGrid = new Map()
//var newGridEntities = [];

var clickableEntities = []
//var currentGridUUID;
var loadingGrid = false;

var currentGridTick;

const SERVER_GRID_UPDATE_RATE = 500; //this much match the servers


export default class EntityManager {


 constructor(player, scene, loader ) {
   this.player = player;
   this.scene = scene;
   this.loader = loader;

    //do this once we receive data from server about where we are
   //this.loadGrid()
 }

 /*setOverview(oview)
 {
   this.overview=oview;
 }
 setShipHud(hud)
 {
   this.shiphud=hud;
 }

 if(this.overview)
 {
   this.overview.setGridEntities(newGridEntities, this.getMyPossessedUnit())
 }
 if(this.shiphud)
 {
   this.shiphud.setMyPossessedUnit(  this.getMyPossessedUnit())
 }*/

getEntitiesEventEmitter()
{
 return  entitiesEmitter;
}

getClickableEntities()
{
  return clickableEntities;
}

getMyPlayerData()
{
  var address = this.player.publicAddress

  return playersOnGrid.get( address )
}

 /*async setCurrentGrid(data)
 {
   currentGridUUID = data.gridUUID;
   console.log('set grid ', currentGridUUID)
 }*/

 async clearGrid()
 {

 }


 async loadGrid( newGridEntities, newGridPlayers ) {
   if(loadingGrid) return;  //thread lock
   loadingGrid = true;

   //update hud items

   /// --

   playersOnGrid.clear();

   if(newGridPlayers && newGridPlayers.length > 0)
   {
     newGridPlayers.forEach(element => playersOnGrid.set(element.publicAddress, element))
     //console.log('p on grid', playersOnGrid)
   }else{
     console.log('WARN - no grid players')
   }

   entitiesEmitter.emit('entitiesChanged',this.getMyPossessedUnit(), newGridEntities )

   entitiesEmitter.emit('playersChanged', this.getMyPlayerData(), newGridPlayers )



   //copy into past entities for lerping purposes
    pastGridEntities = new Map(currentGridEntities)
    lerpProgressMs = 0;


    await this.examineGridChangesForEvents(currentGridEntities, newGridEntities)

  // var missingEntities = [];  //in old but not in new .. remove their scene objects


  //setting stale doesnt work !
   //console.log('load grid ', currentGridEntities.entries())
  for (const [key, value] of currentGridEntities.entries()) {
    var entry = currentGridEntities.get(key)
    entry.stale = true
    currentGridEntities.set(key, entry)
    //  console.log('set stale ', currentGridEntities.get(key))
  }

  clickableEntities = []


   for( var i in newGridEntities )
   {
     var item = newGridEntities[i];

    // console.log('loading entity from server ', item)

  //   var existingSceneObject = currentGridEntities[item._id];

     if( currentGridEntities.has(item._id) )
     {

       item.sceneObjectUUID = currentGridEntities.get(item._id).sceneObjectUUID;

       //this has the added side effect of getting rid of 'stale' automatically
       currentGridEntities.set(item._id, item) //updates the data -course

       var sceneObj = sceneObjectsMap.get(item.sceneObjectUUID)
       if(sceneObj){
         sceneObj.location=  new THREE.Vector3(item.locationVector.x,item.locationVector.y,item.locationVector.z )
         clickableEntities.push(sceneObj)
        // console.log('meep',clickableEntities)
       }else{
         //console.log('WARN: COULD NOT UPDATE LOC', item, sceneObj)
       }

       let visible = UnitHelper.unitIsActiveInSpace(item)
        this.setVisibilityOfSceneObject(sceneObj, visible );



     }else{
       //make it
       var basetype= item.basetype;
       var modelname = entitytypes[basetype].modelname
       var shipModel = await this.loader.loadModel( modelname )



        // shipModel.userData = item;  //store server unit data in the mesh
          var scaleFactor = entitytypes[basetype].scaleFactor
          shipModel.scale.set(scaleFactor,scaleFactor,scaleFactor)



          this.scene.add(  shipModel  );
          var newObj = shipModel
      //    THREE.SceneUtils.attach( child, scene, parent );


            var startingLocationVector = new THREE.Vector3(item.locationVector.x,item.locationVector.y,item.locationVector.z )
             shipModel.location= (startingLocationVector )

          newObj.name=basetype
          newObj.userData = item;
          shipModel.userData = item;

          item.sceneObjectUUID = shipModel.uuid;    //this might be broken

         console.log('add object to scene ', item._id, item.sceneObjectUUID, newObj)

         clickableEntities.push(shipModel)

          currentGridEntities.set(item._id, item) //add it
          sceneObjectsMap.set(item.sceneObjectUUID,shipModel)//cache it  -- why does putting newObj here not work !?
          console.log(   'scenegraph entries ', sceneObjectsMap.entries() )
     }
    // gridEntities.push( item  )
   }


   for (const [key, value] of currentGridEntities.entries()) {
     if(currentGridEntities.get(key).stale)
     {

           var sceneObj = sceneObjectsMap.get( currentGridEntities.get(key).sceneObjectUUID )
           this.scene.remove( sceneObj );

           sceneObjectsMap.delete(currentGridEntities.get(key).sceneObjectUUID)
           currentGridEntities.delete(key)
           console.log('removed stale object from scene ',key)
     }
   }


     loadingGrid = false;
 }


//this doesnt work for your own ship unfortunately..
async examineGridChangesForEvents(currentEntities, newEntitiesArray)
{
  var newEntities = new Map( newEntitiesArray.map(i => [i._id, i])  )

//  console.log('meep ',newEntitiesArray , newEntities )

  //events for old units
     for (const [key, value] of currentEntities.entries()) {

        var currentInstance = currentEntities.get(key)
        if(UnitHelper.getUnitType(currentInstance) =="ship"){


          var newInstance= newEntities.get(key)

          //warp out sound for self and others
          if(currentInstance.warpDestinationGridUUID!=null  )
          {
            console.log('meep ', currentInstance.warpStartTick,   currentGridTick - UnitHelper.getTicksToStartWarp( currentInstance ) )

            if( currentInstance.warpStartTick == currentGridTick - UnitHelper.getTicksToStartWarp( currentInstance )  )
            {

              var soundEventData = {
                playerUnit: this.getMyPossessedUnit(),
                actionUnit: currentInstance,
                soundName: 'warpout'
              }
              entitiesEmitter.emit('entitySoundEvent', soundEventData )
            }

          }




        }


     }

     //events for new units
     for (const [key, value] of newEntities.entries()) {

       var newInstance = newEntities.get(key)



        if(UnitHelper.getUnitType(newInstance) =="ship"){


          var currentInstance = currentGridEntities.get(key)

          if(newInstance.warpDestinationGridUUID==null  )
          {

            if(typeof currentInstance  == 'undefined' || currentInstance.grid != newInstance.grid)
            {
              var soundEventData = {
                playerUnit: this.getMyPossessedUnit(),
                actionUnit: currentInstance,
                soundName: 'warpin'
              }
              entitiesEmitter.emit('entitySoundEvent', soundEventData )
            }

          }

        }


     }




}


//OPTIMIZATION: probably want each grid to be a socket channel, this data will automatically be broadcasted by the server-- not asked for
 async receivedGridStateFromServer(data)
 {

   //console.log('received grid state from server', data )

   var newGridEntities = data.entities;
   var gridUUID = data.grid.uuid;
   var newGridPlayers = data.players;

   currentGridTick = data.grid.gridTick

   /*if(currentGridUUID != gridUUID)
   {
     console.log('WARN: server grid and client grid UUIDs mismatching for me-- ?')

     console.log(currentGridUUID , gridUUID)
   }*/

   await this.loadGrid( newGridEntities, newGridPlayers  )


 }


 //need to add a lerp loop
 async update(scene,delta)
 {

   if(delta > 0 && delta < 1000 ){
      this.lerpEntities(scene,delta)
   }


 }




// map is empty??
 async lerpEntities(scene,delta)
 {
   lerpProgressMs+= delta;

   var lerpAlpha = lerpProgressMs/SERVER_GRID_UPDATE_RATE;

   if(lerpAlpha < 0) lerpAlpha = 0;
   if(lerpAlpha > 1) lerpAlpha = 1;





   //var delta_seconds = delta / 1000.0;
// console.log('lerpEntities ',delta ,currentGridEntities.entries()  )// why si this empty
   for (const [key, value] of currentGridEntities.entries()) {

    // var vz = 5   //velocity
     var entityPast = pastGridEntities.get(key) //start of lerp
     var entityNow = currentGridEntities.get(key)  //end of lerp


     if(!entityPast || !entityNow) return


    // var velocityVectorLerped = entityNow.velocityVector

     //need to lerp the facing and position

     var pastLocVec = new THREE.Vector3(entityPast.locationVector.x,entityPast.locationVector.y,entityPast.locationVector.z)
     var pastFacVec = new THREE.Vector3(entityPast.velocityVector.x,entityPast.velocityVector.y,entityPast.velocityVector.z).normalize()
     var currentFacVec = new THREE.Vector3(entityNow.velocityVector.x,entityNow.velocityVector.y,entityNow.velocityVector.z).normalize()

     var locationVectorLerped = pastLocVec.lerp(entityNow.locationVector,  lerpAlpha )

     var facingVectorLerped = pastFacVec.lerp(currentFacVec,  lerpAlpha )


     var sceneObj = this.getSceneObjectForEntity(key)
     sceneObj.position = locationVectorLerped


      //console.log('fac vec', currentFacVec)  //this is correct
     //this is busted
     //sceneObj.rotation.setFromVector3( facingVectorLerped )

     var pos = new THREE.Vector3(sceneObj.position.x,sceneObj.position.y,sceneObj.position.z )
     var futurePos = pos.add( facingVectorLerped  )


     sceneObj.lookAt( futurePos   )

   }



 }

 setVisibilityOfSceneObject(obj, vis)
 {
   obj.traverse ( function (child) {
    if (child instanceof THREE.Mesh) {
        child.visible = vis;
    }
  });
 }

 getDataForEntityById(entityId)
 {
   return currentGridEntities.get(entityId)
 }

 getSceneObjectForEntity(entityId)  // ._id of entity -- the mongo id of the record on the server
 {
   var sceneObjectId = currentGridEntities.get(entityId).sceneObjectUUID;

   return sceneObjectsMap.get(sceneObjectId)

 }

 getMyPossessedUnit()
 {
    var myPlayerOnGrid;

  //  console.log('meeep', playersOnGrid.entries() , this.player)
     for (const [key, value] of playersOnGrid.entries()) {

       if(playersOnGrid.get(key).publicAddress == this.player.publicAddress)
       {
         myPlayerOnGrid = playersOnGrid.get(key)
       }
     }

     if(myPlayerOnGrid)
     {
       var myPossessedUnitId = myPlayerOnGrid.possessedUnitId;
       var myPossessedUnit = currentGridEntities.get(myPossessedUnitId)

       return myPossessedUnit;
     }

     return null

 }




}
