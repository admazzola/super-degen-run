<template>
  <div class=" p-1 px-4 border-white m-4 inline-block text-black" style="width: 100%; height:32px; background:#fffa">
    Hi

  </div>
</template>


<script>




import GalaxyHelper from '../../../../shared/lib/GalaxyHelper'


export default {


  name: 'ItemRow',
  props: ['formSubmittedCallback'],
  components: {

  },
  data() {
    return {

      myPlayer: null,
      focusItemSlot: null

    }
  },
  methods: {


    setHidden: function(hidden){
        this.hidden=hidden

    },

    clickedButton: function(buttonName)
    {
      //bubble out to a callback
      if(buttonName == 'submit')
      {
        let formData = {
            formType: this.activeForm
        }

          this.formSubmittedCallback(formData)
      }

    }





  }

}
</script>
