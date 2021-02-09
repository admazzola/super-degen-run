<template>
  <div class="p12" v-if="activeStationPanel=='dev'" >

    <div class="text-lg"> Developer Tools   </div>
    <br>
    <div @click="clickedButton('spawnItem')" class="cursor-pointer m-4 p-4 bg-yellow-500 text-black text-lg ">  Spawn Item </div>


  </div>
</template>


<script>




import GalaxyHelper from '../../../shared/lib/GalaxyHelper'




export default {


  name: 'DevPanel',
  props: ['devtoolsCallback','activeStationPanel'],
  components: {

  },
  data() {
    return {
      myPlayer: null

    }
  },
  mounted(){

  },

  methods: {


    clickedButton: function(buttonName)
    {
      //bubble out to a callback
      if(buttonName == 'spawnItem')
      {
          this.devtoolsCallback({requestType: 'spawnItem'})
      }

    }




  }

}
</script>
