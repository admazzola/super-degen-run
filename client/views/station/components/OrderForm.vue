<template>
  <div >


    <form class="w-full max-w-lg"  v-if="targetData" >
  <div class="flex flex-wrap -mx-3 mb-6">
    <div class="w-full md:w-1/2 px-3 mb-6 md:mb-0">
      <label class="block uppercase tracking-wide text-gray-200 text-xs font-bold mb-2" for="grid-first-name">
        Item Name
      </label>
      <input disabled class="appearance-none  block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white"  type="text" v-model="targetData.name ">
      <p class=" hidden text-red-500 text-xs italic">Please fill out this field.</p>
    </div>
    <div class="w-full md:w-1/2 px-3">
      <label class="block uppercase tracking-wide text-gray-200 text-xs font-bold mb-2" for="grid-last-name">
        Quantity To Sell
      </label>
      <input class="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"  type="text" v-model="quantityToSell">
    </div>
  </div>
  <div class="flex flex-wrap -mx-3 mb-6">
    <div class="w-full md:w-1/2 px-3">
      <label class="block uppercase tracking-wide text-gray-200 text-xs font-bold mb-2" for="grid-password">
        Price per Unit ({{this.currencyName}})
      </label>
      <input class="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"  type="text"  v-model="pricePerUnit">

    </div>
    <div class="w-full md:w-1/2 px-3">
      <label class="block uppercase tracking-wide text-gray-200 text-xs font-bold mb-2" for="grid-password">
        Total Price
      </label>
      <div  class="appearance-none  block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white"  type="text"  >{{totalPrice() }}</div>

    </div>
  </div>

  <div >
     <button @click="submit" class="float-right bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline cursor-pointer hover:bg-yellow-500" type="button">
        Create Sell Order
      </button>
  </div>

</form>

  </div>
</template>


<script>



 
const web3connectionconfig = require('../../../../shared/contracts/web3connection.config')

export default {


  name: 'OrderForm',
  props: ['formSubmittedCallback','targetData'],
  components: {

  },
  data() {
    return {

      quantityToSell: 0,
      pricePerUnit: 0,
      currencyName: ""

    }
  },
  created()
  {
    this.currencyName = web3connectionconfig.tokenName
  },
  methods: {



    submit: function()
    {


      let formData = {
        requestType: 'makeMarketOrder',
        item: this.targetData,
        quantity: this.quantityToSell,
        pricePerUnit: this.pricePerUnit

      }

      this.formSubmittedCallback( formData  )



      this.reset()

    },
    reset: function()
    {
      this.quantity=0;
      this.pricePerUnit=0;
    },

    totalPrice: function(){
      if( this.pricePerUnit && this.quantityToSell){
        return  ( parseFloat(this.pricePerUnit) * parseFloat(this.quantityToSell) ).toFixed(8)
      }
      return '?'
    }



  /*  clickedButton: function(buttonName)
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
      if(GalaxyHelper.playerIsDocked(myPlayer ))
      {
        this.setHidden(false)
      }else{
        this.setHidden(true)
      }


    },*/




  }

}
</script>
