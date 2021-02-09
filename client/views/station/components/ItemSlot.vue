<template>
  <div class="border-2 border-white m-4 inline-block" style="width: 64px; height:64px">
    Hi

  </div>
</template>


<script>




import GalaxyHelper from '../../../../shared/lib/GalaxyHelper'


export default {


  name: 'ItemSlot',
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
