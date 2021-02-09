<template>
  <div
   v-if="!hidden"
  :style="{top: offset.top, left:offset.left}"
  style="position:absolute;background-color:#111d;z-index:99"
  class="p-2 text-white hover:text-red text-sm mb-4 text-left">

  <div v-if="itemType == 'item'" >
    <button @click="command('startsell')" class="block p-2 hover:bg-gray-600 w-full  "   >
      Sell On Market
    </button>

    <button @click="command('salvage')" class="block p-2 hover:bg-gray-600 w-full"   >
      Salvage
    </button>



    <button @click="command('stackall')" class="block p-2 hover:bg-gray-600 w-full"   >
      Stack All
    </button>

    <hr>

    <button @click="command('trash')" class="block p-2 hover:bg-gray-600 w-full"   >
      Trash
    </button>


  </div>

    <div v-if="itemType == 'order'" >
      <button @click="command('buyout')" class="block p-2 hover:bg-gray-600 w-full  "   >
        Buyout
      </button>

      <button @click="command('orderdetails')" class="block p-2 hover:bg-gray-600 w-full  "   >
        View Order Details
      </button>

      <button v-if="canCancelOrder()" @click="command('cancelorder')" class="block p-2 hover:bg-gray-600 w-full  "   >
        Cancel Order
      </button>
    </div>


  </div>
</template>
<script>
import * as THREE from 'three'

import GalaxyHelper from '../../shared/lib/GalaxyHelper'

export default {
  name: 'ItemActionMenu',
  props: ['dataRequestCallback','localActionCallback'],
  components: {

  },
  data() {
    return {
      hidden: true,
      offset: {top:0, left:0},
      targettingData: {},
      itemType: null,
      myPlayer: null

    }
  },
  methods: {



    setHidden: function(hidden){
        this.hidden=hidden

    },


    playersChanged: function(myPlayer, playersOnGrid)
    {
      this.myPlayer = myPlayer

      //this.stationUnitId = myPlayer.dockedInStation


    },


    canCancelOrder: function(){

      if(this.myPlayer  )
      {
        let publicAddress = this.myPlayer.publicAddress

        return this.targettingData && this.targettingData.payTo && this.targettingData.payTo == publicAddress

      }

      return false

    },

    setOffsets: function(offset){
        this.offset=offset

    },

    command: function(cmdName){

    //  var targetId = this.targettingData.targetId;

      if(cmdName == 'startsell')
      {
         this.localActionCallback('startsell', {item: this.targettingData } )   // 5f7aab8282f5ae6884aaa2ff ???
      }

      if(cmdName == 'cancelorder')
      {
        //an onchain event .. also sends tx data to server
         this.localActionCallback('cancelOrder', this.targettingData )   // 5f7aab8282f5ae6884aaa2ff ???
      }

      if(cmdName == 'buyout')
      {

         this.localActionCallback( 'buyoutOrder', this.targettingData )


       }

      this.setHidden(true)
    },


    buildTargettingData: function( item )  //entity null ?
   {


     this.targettingData = item
     console.log('built tar data', item)

     this.itemType = item.itemType

   },




  }

}
</script>
