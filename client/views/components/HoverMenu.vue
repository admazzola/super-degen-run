<template>
  <div class="relative">
    <button @click="toggleMenu()" class="block p-2"  >
      {{ title }}
    </button>

    <div v-if="!hidden" class="absolute top-0  z-110 bg-black text-white" style="left:100px" >

      <button v-for="item in optionArray" :key="item.id " @click="clickedOption( item.id  )" class="block p-2 capitalize"   >
        {{item.name }}
      </button>


    </div>

  </div>
</template>
<script>
import * as THREE from 'three'

export default {
  name: 'HoverMenu',
  props: ['title', 'optionArray','commandCallback','openedCallback'],
  data() {
    return {
      hidden: true,

    }
  },
  methods: {



    setHidden: function(hidden){
        this.hidden=hidden

    },

    toggleMenu()
    {


      this.openedCallback(  this.hidden   )

      this.setHidden(!this.hidden)
      
    },
    clickedOption: function(optionId){
      console.log('clicked', optionId)
      this.commandCallback(this.title,optionId)
    },









  }

}
</script>
