const THREE = require('three')

var entitybasetypes = require('../../shared/worlddata/entitybasetypes.json')


module.exports =  class UnitHelper   {



 constructor()
 {

 }



 static getInitialStatsForEntityType(basetype)
 {
   return entitybasetypes[basetype].stats;
 }

   static getTicksToStartWarp(entitydata)  // a tick is 500 ms
   {
     return UnitHelper.getCompiledStats(entitydata).mass / 10;
   }

   static getTicksToFinishWarp(entitydata)  // a tick is 500 ms
   {
     return (UnitHelper.getTicksToStartWarp(entitydata) + (UnitHelper.getCompiledStats(entitydata).mass / 10));
   }


   static getFinalizedStats(entitydata, activeModuleData) //after modules applied
   {
     //modules reduce warp core str...
    }



  static getCompiledStats(entitydata)
  {


    if(entitydata)
    {

      var baseStats = UnitHelper.getInitialStatsForEntityType( entitydata.basetype )


      return {
        currentEnergy: entitydata.stats.energy ,
        maxEnergy: baseStats.energy,
        currentArmor: entitydata.stats.armor ,
        maxArmor: baseStats.armor,
        currentShields: entitydata.stats.shields ,
        maxShields: baseStats.shields,
        speed: entitydata.stats.speed,
        maxSpeed: baseStats.speed,
        mass: baseStats.mass

      }
    }else{
      return {
        currentEnergy: 0,
        maxEnergy: 0,
        currentArmor: 0,
        maxArmor: 0,
        currentShields:0,
        maxShields:0,
        speed: 0,
        maxSpeed: 0,
        mass: 0

      }
    }


  }

  static getBaseTypeData(unit)
  {
    if(unit)
    {
      return entitybasetypes[unit.basetype]
    }
    return null
  }

  //an entity is a unit
  static getDistanceBetweenUnits(unitA, unitB)
  {
    var locVector = new THREE.Vector3(unitA.locationVector.x,unitA.locationVector.y,unitA.locationVector.z)
    return locVector.distanceTo(unitB.locationVector)
  }

  static collidingWithAnyEntity(loc, entityArray)
  {
    var locVector = new THREE.Vector3(loc.x,loc.y,loc.z)
    for(var entity of entityArray)
    {
      console.log('entity',entity)

      var typedata = entitybasetypes[entity.basetype]
      var dist = locVector.distanceTo(entity.locationVector)
    //  console.log('meep',typedata.collisionRadius, dist  )
      if(dist <  typedata.collisionRadius )
      {
        return entity
      }
    }

    return null;



  }


  static unitIdsAreEqual(unitIdA, unitIdB)
  {
    return unitIdA.toString() == unitIdB.toString()
  }

  static playerOwnsUnit(player,unit)
  {
    return unit.owningPlayerId == player._id
  }


   static getNameForEntity(basetype)
   {
      return entitybasetypes[basetype].name;


   }


   static getInitialStatsForEntityType(basetype)
   {
     return entitybasetypes[basetype].stats;
   }



   static getFacingVectorFromUnitToLocation(unit,location)
   {

     var fromVector = new THREE.Vector3(unit.locationVector.x,unit.locationVector.y,unit.locationVector.z  )

     var facing = (fromVector.clone().sub( location )).normalize().negate()
     return facing;

   }

  static getFacingVectorFromUnitToUnit(from,to)
  {
    return UnitHelper.getFacingVectorFromUnitToLocation(from, to.locationVector)
    /*var fromVector = new THREE.Vector3(from.locationVector.x,from.locationVector.y,from.locationVector.z  )

    var facing = (fromVector.clone().sub(to.locationVector)).normalize()
    return facing;*/

  }


  static unitHasWarpDestination( entity )
  {
      return (entity.warpDestinationGridUUID != null)
  }

  static unitPreparingToWarp( entity )
  {
      return (entity.warpDestinationGridUUID != null)
  }

  static unitsWithinServiceRange(unit, serviceTarget)
  {
    var actualDistance = UnitHelper.getDistanceBetweenUnits(unit,serviceTarget)
    let typedata = UnitHelper.getBaseTypeData( serviceTarget )
    var serviceDistance = typedata.interactRadius

    return (actualDistance <= serviceDistance)

  }

  static unitIsActiveInSpace( unit )
  {
      return (unit.active && unit.dockedInStation == null)


  }


  // 'docking', 'market', 'recycling', 'gate'
  static unitHasService(unit, serviceType )
  {
    if(unit)
    {
      let typedata = UnitHelper.getBaseTypeData( unit )
      return typedata.services.includes(serviceType)

    }
    console.log('WARN: unitHasService(null) ')
    return false
  }


  static getUnitType( entity )
  {
    if(entity)
    {
      return entity.unittype
    }
    return null
  }


}
