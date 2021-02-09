<template>
  <div  v-if="!hidden" class="absolute p-0 m-0" style="background:#111e; width:70%; height:70%; margin:   auto;top: 0; left: 0; bottom: 0; right: 0; ">

      <div class="flex flex-col m-4 p-4 h-full text-white" style="margin:auto">



            <div class="flex-3 m-4 p-4 bg-blue-800  text-white capitalize"  >
                  {{getTitle()}}

                  <div class="float-right p-2 bg-gray-800 rounded cursor-pointer hover:bg-gray-600" @click="setHidden(true)">  Close </div>
            </div>

            <div class="flex-1 m-4 p-4 bg-blue-900 text-white relative "   >

                   <OrderForm
                    v-if="activeForm == 'makeMarketOrder'"
                    v-bind:targetData='targetData'
                    v-bind:formSubmittedCallback='formSubmittedCallback'
                    />

            </div>


      </div>
</div>
</template>


<script>




import GalaxyHelper from '../../../../shared/lib/GalaxyHelper'

import OrderForm from './OrderForm.vue'


export default {


  name: 'ModalContainer',
  props: ['formSubmittedCallback'],
  components: {
     OrderForm
  },
  data() {
    return {
      hidden: true,
      myPlayer: null,
      activeForm: 'makeMarketOrder',
      targetData: null

    }
  },
  methods: {


    setHidden: function(hidden){
        this.hidden=hidden

    },

    getTitle: function()
    {
      switch(this.activeForm)
      {
        case 'makeMarketOrder': return 'Create Market Order'


      }

    },

   

    playersChanged: function(myPlayer, playersOnGrid)
    {
      if(GalaxyHelper.playerIsDocked(myPlayer ))
      {
        this.setHidden(false)
      }else{
        this.setHidden(true)
      }


    },

    setActiveForm: function(formName)
    {

      this.activeForm = formName

    },

    setTargetData: function(target)
    {
      this.targetData = target
      console.log('target data is ', target)

    }




  }

}
</script>
