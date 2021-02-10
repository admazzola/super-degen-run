<template>
  <div v-if="activeStationPanel=='ships'" >
     Hangar

  </div>
</template>


<script>


 

export default {


  name: 'HangarPanel',
  props: ['clickedButtonCallback','activeStationPanel'],
  components: {

  },
  data() {
    return {

      myPlayer: null

    }
  },
  methods: {



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

    },


    playersChanged: function(myPlayer, playersOnGrid)
    {


    },

    setActiveForm: function(formName)
    {

      this.activeForm = formName

    }




  }

}
</script>
