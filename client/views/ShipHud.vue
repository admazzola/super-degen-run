<template>
  <div v-if="!hidden"   class="absolute  py-4 px-6 left-0  " style="background:#111a; bottom: 10%">

  <div   class="text-centered w-full text-gray-100  cursor-pointer mb-4 capitalize">  {{getMenuTitle()}} </div>



  <div class="bg-blue-500 text-xs text-white p-1" style="width:200px;height:20px;"> Shields {{compiledStats.currentShields}}/{{compiledStats.maxShields}} </div>
  <div class="bg-gray-700 text-xs text-white p-1" style="width:200px;height:20px;"> Armor {{compiledStats.currentArmor}}/{{compiledStats.maxArmor}} </div>
  <div class="bg-yellow-700 text-xs text-white p-1" style="width:200px;height:20px;"> Energy {{compiledStats.currentEnergy}}/{{compiledStats.maxEnergy}} </div>
  <br>
  <div class="bg-gray-400 text-xs text-black p-1" style="width:200px;height:20px;"> Velocity {{compiledStats.speed}}km/s </div>

  <br>
  <div class="bg-gray-800 text-xs text-black p-1" v-if="myPossessedUnit"> {{myPossessedUnit.grid}} </div>
  <div class="bg-gray-800 text-xs text-black p-1" v-if="myPossessedUnit"> {{myPossessedUnit.locationVector}} </div>

  </div>

</template>
<script>
import * as THREE from 'three'
 
import UnitHelper from '../../shared/lib/UnitHelper'

export default {
  name: 'ShipHud',
  data() {
    return {
      hidden: false,
      myPossessedUnit: null,
      compiledStats: {}
    }
  },
  methods: {



    entitiesChanged: function(myPossessedUnit, entities){

    //  console.log('meep',myPossessedUnit )
      this.myPossessedUnit=myPossessedUnit;

      this.compiledStats = UnitHelper.getCompiledStats(myPossessedUnit)

      //show slider bar for armor stat, shield stat
    },
    getMenuTitle: function()
    {
        if(this.myPossessedUnit )
        {
          return this.myPossessedUnit.basetype
        }
        return ''
    },

    setHidden: function(hidden){
        this.hidden=hidden

    },



    playersChanged: function(myPlayer, playersOnGrid)
    {
      console.log(myPlayer)
      /*if(GalaxyHelper.playerIsDocked(myPlayer ))
      {
        this.setHidden(true)
      }else{
        this.setHidden(false)
      }*/


    }

  }

}
</script>
