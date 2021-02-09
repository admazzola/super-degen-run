const THREE = require('three')

var solarsystems = require('../../shared/worlddata/solarsystems.json').solarsystems
var celestialtypes = require('../../shared/worlddata/celestialtypes.json')
var entitybasetypes = require('../../shared/worlddata/entitybasetypes.json')




module.exports =  class GalaxyHelper {


 constructor()
 {

 }


 static getCelestialsInGalaxy(galaxyName)
 {
   for(var i in solarsystems)
   {
     if(solarsystems[i].name === galaxyName)
     {
       return solarsystems[i].celestials
     }

   }

 }


 static getCelestialData(celestial)
 {
  var celestialtypedata = celestialtypes[celestial.type]

  return {
    name: GalaxyHelper.getCelestialName(celestial,celestialtypedata),
    uuid: celestial.uuid,
    celestialtype: celestialtypedata.celestialtype,
    staticEntities: celestialtypedata.entities,
    warpInLocationVector: new THREE.Vector3( celestial.x, celestial.y, celestial.z ),
    basetype: celestial.type
  }

 }

 static getCelestialName(celestial,celestialtypedata)
 {
  switch(celestialtypedata.celestialtype )
  {
    case 'warpgate': return 'Warp Gate - '.concat(celestial.destination);
    case 'anomaly': return celestial.name   ;
    case 'planet': return celestial.name ;
    case 'structure': return celestial.name ;
  }


 }

 
 //get the ID of the unit or the station-unit that the player is inside
static getActiveItemContainerEncapsulatingUnitIDForPlayer( player )
 {
   //if it doesnt exist then make it.. associate it either to the ship or to the station.  Belogns to a plaer and has a max mass size
   if(GalaxyHelper.playerIsDocked(player))
   {
     return player.dockedInStation
   }else if(player.possessedUnitId){
     return player.possessedUnitId
   }else{
     console.log('WARN: Could not get active item container for ', player)
     return null;

   }



 }


static getFacingVectorFromGridToGrid(from,to)
{

  var fromVector = new THREE.Vector3(from.gridLocationVector.x,from.gridLocationVector.y,from.gridLocationVector.z  )

  var facing = (fromVector.clone().sub(to.gridLocationVector)).normalize().negate()
  return facing;

}

static playerIsDocked(player)
{
  return player.dockedInStation
}




}
