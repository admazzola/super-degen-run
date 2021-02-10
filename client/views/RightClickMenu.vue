<template>
  <div
   v-if="!hidden"
  :style="{top: offset.top, left:offset.left}"
  style="position:absolute;background-color:#1119;z-index:99"
  class="p-2 text-white hover:text-red text-sm mb-4">
    <span class="capitalize" >   {{getMenuTitle()}}</span>
    <br>
    <button @click="command('warp')" class="block p-2" v-if="targettingData.canWarp" >
      Warp to --
    </button>
    <button @click="command('approach')" class="block p-2" v-if="targettingData.canApproach">
      Approach
    </button>
    <button @click="command('activate')" class="block p-2" v-if="targettingData.canActivate">
      Activate
    </button>
    <button @click="command('lock')" class="block p-2" v-if="targettingData.canLock">
      Lock
    </button>
    <button @click="command('dock')" class="block p-2" v-if="targettingData.canDock">
      Dock
    </button>

    <div v-if="celestials && targettingData.showCelestials">
      <HoverMenu :class="{hidden: celestials.warpgates.length ==0}"
        title="Warp Gates"
        v-bind:optionArray="celestials.warpgates"
        v-bind:commandCallback="clickedHoverMenuOption"
        v-bind:openedCallback="clickedHoverMenu"
        ref="warpgateMenu"
       />
       <HoverMenu :class="{hidden: celestials.planets.length ==0}"
         title="Planets"
         v-bind:optionArray="celestials.planets"
         v-bind:commandCallback="clickedHoverMenuOption"
         v-bind:openedCallback="clickedHoverMenu"
         ref="planetMenu"
        />
        <HoverMenu :class="{hidden: celestials.structures.length ==0}"
          title="Structures"
          v-bind:optionArray="celestials.structures"
          v-bind:commandCallback="clickedHoverMenuOption"
          v-bind:openedCallback="clickedHoverMenu"
          ref="structureMenu"
         />
         <HoverMenu :class="{hidden: celestials.anomalies.length ==0}"
           title="Anomalies"
           v-bind:optionArray="celestials.anomalies"
           v-bind:commandCallback="clickedHoverMenuOption"
           v-bind:openedCallback="clickedHoverMenu"
           ref="anomalyMenu"
          />
    </div>



  </div>
</template>
<script>
import * as THREE from 'three'

import HoverMenu from './components/HoverMenu'
 
export default {
  name: 'RightClickMenu',
  props: ['commandCallback'],
  components: {
     HoverMenu,
  },
  data() {
    return {
      hidden: true,
      offset: {top:0, left:0},
      targettingData: {},
      celestials: null,
    //  warpGates: [],
    //  planets:  [],
    //  anomalies: []
    }
  },
  methods: {

    /// need player and solar system data
    entitiesChanged: function(myPossessedUnit, entities){

      /*
      if(myPossessedUnit)
      {
        var myGridUUID = myPossessedUnit.grid;
        var myGalaxyName = myPossessedUnit.galaxy;
    //    console.log("rclickmenu knows im at ", myGridUUID, myGalaxyName)

        var celestials = GalaxyHelper.getCelestialsInGalaxy( myGalaxyName )

      //  console.log("celestials ", celestials)

        this.celestials = {

          warpgates:[],
          planets:[],
          anomalies:[],
          structures:[]

        }

        for(var i in celestials)
        {
          var cData = GalaxyHelper.getCelestialData(celestials[i])

          if(cData.celestialtype === 'warpgate')
          {
            this.celestials.warpgates.push(  {
              name: cData.name,
              id: cData.uuid
            })
          }
          if(cData.celestialtype === 'anomaly')
          {
              this.celestials.anomalies.push(  {
              name: cData.name,
              id: cData.uuid
            })
          }
          if(cData.celestialtype === 'planet')
          {
            this.celestials.planets.push(  {
              name: cData.name,
              id: cData.uuid
            })
          }
          if(cData.celestialtype === 'structure')
          {
              this.celestials.structures.push(  {
              name: cData.name,
              id: cData.uuid
            })
          }

          //do other types too
        }

      //  this.celestialswarpGates = warpGateOptions

      }*/

    },

    setHidden: function(hidden){
        this.hidden=hidden

    },

    clickedHoverMenu: function(hoverMenuName,opened){
      this.$refs.warpgateMenu.setHidden(true);
      this.$refs.planetMenu.setHidden(true);
      this.$refs.anomalyMenu.setHidden(true);
      this.$refs.structureMenu.setHidden(true);
    },

    clickedHoverMenuOption: function(hoverMenuName,optionId){
          console.log(hoverMenuName, optionId)
          this.setHidden(true)

          if(hoverMenuName === 'Warp Gates' || hoverMenuName === 'Planets' || hoverMenuName === 'Structures' || hoverMenuName === 'Anomalies')
          {

           this.commandCallback('initiateWarp', {griduuid:optionId}  ) //param needs to have the new grid uuid
          }
    },

    setOffsets: function(offset){
        this.offset=offset
        console.log('offset',offset)
    },

    command: function(cmdName){
      console.log('command',cmdName, this.targettingData )

      var targetId = this.targettingData.targetId;

      if(cmdName == 'dock')
      {
         this.commandCallback('dock', {targetUnitId: targetId}  )   // 5f7aab8282f5ae6884aaa2ff ???

      }

      this.setHidden(true)
    },

    getMenuTitle: function()
    {
        if(this.targettingData.targetName)
        {
          return this.targettingData.targetName
        }

        return 'Navigation'
    },
    buildTargettingData: function(entity)  //entity null ?
   {

     //this is not working properly!

      if(!entity || entity.name == 'skybox'  )
      {
        this.targettingData = {
          targetName: "",
          target: null,
          canApproach: false,
          canDock: false,
          canLock: false,
          canActivate: false,
          showCelestials: true
        }
        return
      }

      var ultimateParent = entity

     // for SOME REASON the corvettes parent is teh station !?

      while(ultimateParent.parent && typeof ultimateParent.userData.basetype == 'undefined')
      {
        ultimateParent = ultimateParent.parent
      }

      console.log('ultimateParent 2', ultimateParent )

      //get services from basetype

      console.log('build right click target data ', ultimateParent  )
        this.targettingData = {
          targetName: ultimateParent.userData.basetype,
          targetId: ultimateParent.userData._id,
          canApproach: true,
          canDock: true,
          canLock: true,
          canActivate: true,
          showCelestials: false
        }



      /*
        Approach
        if its a gate -- Jump
        if its a station -- dock
        if its a ship -- lock

      */

   },




  }

}
</script>
