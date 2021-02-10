<template>
  <div v-if="activeStationPanel=='wallet'" class="relative">




     <div v-if="loading" class="m-1  float-right">

       <svg class="svg-icon  loader-large spin" viewBox="0 0 20 20">
							<path fill="none" d="M3.254,6.572c0.008,0.072,0.048,0.123,0.082,0.187c0.036,0.07,0.06,0.137,0.12,0.187C3.47,6.957,3.47,6.978,3.484,6.988c0.048,0.034,0.108,0.018,0.162,0.035c0.057,0.019,0.1,0.066,0.164,0.066c0.004,0,0.01,0,0.015,0l2.934-0.074c0.317-0.007,0.568-0.271,0.56-0.589C7.311,6.113,7.055,5.865,6.744,5.865c-0.005,0-0.01,0-0.015,0L5.074,5.907c2.146-2.118,5.604-2.634,7.971-1.007c2.775,1.912,3.48,5.726,1.57,8.501c-1.912,2.781-5.729,3.486-8.507,1.572c-0.259-0.18-0.618-0.119-0.799,0.146c-0.18,0.262-0.114,0.621,0.148,0.801c1.254,0.863,2.687,1.279,4.106,1.279c2.313,0,4.591-1.1,6.001-3.146c2.268-3.297,1.432-7.829-1.867-10.101c-2.781-1.913-6.816-1.36-9.351,1.058L4.309,3.567C4.303,3.252,4.036,3.069,3.72,3.007C3.402,3.015,3.151,3.279,3.16,3.597l0.075,2.932C3.234,6.547,3.251,6.556,3.254,6.572z"></path>
						</svg>

     </div>




     <div class="mx-6 my-2 w-2/3" >

       <div class="bg-indigo-900 text-center py-4 lg:px-4">
        <div class="p-2 bg-indigo-800 items-center text-indigo-100 leading-none lg:rounded-full flex lg:inline-flex" role="alert">
            <div class="font-semibold mr-2 text-left flex-auto" > Space Wallet </div>


              <span v-if="hasValidNetwork()" class="  flex rounded-full bg-indigo-500 uppercase px-2 py-1 text-xs font-bold mr-3">Connected</span>
              <span v-if="hasValidNetwork()" class="   mr-2 text-left flex-auto"> Matic Mainnet </span>

              <span v-if="!hasValidNetwork() && !loading" class="  flex rounded-full bg-red-500 uppercase px-2 py-1 text-xs font-bold mr-3">Not Connected </span>
              <span v-if="!hasValidNetwork() && !loading" class="   mr-2 text-left flex-auto"> Wrong Web3 Provider </span>



        </div>
      </div>
        <div v-if="hasValidNetwork()  ">

         <div class="mt-4 bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded">
          Matic Balance:  {{ walletdetails.tokensBalanceFormatted }}  0xBTC
         </div>

         <div class="mt-4 bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-4 border-b-4 border-green-700 hover:border-green-500 rounded">
          Approved For Market: {{ getTokensApproved() }}  0xBTC

          <div @click="clickedButton('approve')" class="inline float-right rounded-full bg-green-700 uppercase px-2 py-1 text-xs font-bold mr-3 cursor-pointer"> Approve </div>

         </div>

         <div>

         </div>

         <br>

         <div v-if="getTokensApproved() == 0"   class="bg-teal-100 border-t-4 border-teal-500 rounded-b text-teal-900 px-4 py-3 shadow-md" role="alert">
            <div class="flex">
              <div class="py-1"><svg class="fill-current h-6 w-6 text-teal-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/></svg></div>
              <div>
                <p class="font-bold">Warning: No tokens approved</p>
                <p class="text-sm">In order to purchase goods from the market, you must approve tokens to the contract.</p>
                <a v-bind:href="getPayspecContractURL()" target='_blank'> >> Read the Contract </a>

              </div>
            </div>
          </div>


       </div>

       <div v-if="!hasValidNetwork()">
         <div role="alert">
          <div class="bg-red-500 text-white font-bold rounded-t px-4 py-2 mt-10">
            Please connect to Matic Mainnet
          </div>
          <div class="border border-t-0 border-red-400 rounded-b bg-red-100 px-4 py-3 text-blue-700">
            <a href="https://medium.com/@admazzola/how-to-use-metamask-with-matic-network-6895a34f6c6e" target='_blank'> Guide: How to connect Metamask to Matic Mainnet </a>
          </div>
        </div>
       </div>

     </div>



  </div>
</template>


<script>

/*
Shows your matic and 0xbtc balance... shows your number approved

Make a faucet that will give you 0.1 matic one time if you have at least 1 0xbtc

*/

 

export default {


  name: 'WalletPanel',
  props: ['dataRequestCallback','localActionCallback','activeStationPanel'],
  components: {

  },
  data() {
    return {
      loading: false,

      myPlayer: null,
      focusItemSlot: null,
      web3details: null,
      walletdetails: null,
      paySpecContractAddress: ""

    }
  },
  mounted(){
      this.requestWalletDetailsFromAPI()
       setInterval( this.requestWalletDetailsFromAPI, 1000 * 5 )
  },
  methods: {

    hasValidNetwork: function()
    {

      return this.web3details && this.web3details.chainId == 137
    },

    getTokensApproved: function()
    {

      return Math.min( this.walletdetails.tokensBalanceFormatted , this.walletdetails.tokensApprovedToPayspecFormatted )
    },

    getPayspecContractURL: function()
    {
          return "https://explorer.matic.network/address/"+this.paySpecContractAddress+"/contracts"
    },

    clickedButton: async function(buttonName)
    {
      //clicked button approve
      await this.localActionCallback( buttonName )
    },


    playersChanged: function(myPlayer, playersOnGrid)
    {



    },

    requestWalletDetailsFromAPI: async function()
    {
      if(this.activeStationPanel =='wallet'){
          this.loading = true
      // could pass the station id here so players can look at orders in remote stations...
          let response = await this.dataRequestCallback({ requestType:'walletDetails' })

          console.log('got wallet details ', response )

          this.web3details = response.web3details
          this.walletdetails = response.walletdetails
          this.paySpecContractAddress = response.paySpecContractAddress

          this.loading = false
      }
    }




  }

}
</script>
