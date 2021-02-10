<template>
  <div v-if="activeStationPanel=='market'">
     <div class="text-lg"> Market Orders   </div>


     <table class="table-fixed text-xs text-gray-100 mt-4 border-t-0 border-b-0"   >

       <thead>
        <tr>
           <th class="px-1 py-1">Icon</th>
          <th class="px-1 py-1">Name</th>
          <th class="px-1 py-1">Price Per Unit </th>
          <th class="px-1 py-1">Quantity</th>
          <th class="px-1 py-1">Total Price </th>
        </tr>
      </thead>
      <tbody>
       <tr v-for="item in orderRows" v-if="item.status == 'pending'" v-bind:key="item.itemId"  @mousedown.right="onRowClicked(item)" class="cursor-pointer">
         <td class="border px-4 py-4 text-right border-gray-700">   </td>
         <td class="border px-4 py-4 capitalize  border-gray-700 " > {{ item.itemName }}</td>
         <td class="border px-4 py-4 text-right border-gray-700"> {{ item.pricePerUnit }} </td>

        <td class="border px-4 py-4 text-right border-gray-700"> {{ item.quantity }} </td>
             <td class="border px-4 py-4 text-right border-gray-700"> {{ item.amountDueFormatted }} </td>
       </tr>
     </tbody>

     </table>


  </div>
</template>


<script>

const web3connectionconfig = require('../../../shared/contracts/web3connection.config.js')

 
import EthereumHelper from '../../../shared/lib/EthereumHelper'


export default {


  name: 'MarketPanel',
  props: ['rightClickRowCallback','dataRequestCallback','stationUnitId','activeStationPanel'],
  components: {

  },
  data() {
    return {

      myPlayer: null,
      focusItemSlot: null,
      orderRows: []
    }
  },
  mounted(){
      this.requestOrdersFromAPI()
      setInterval( this.requestOrdersFromAPI, 5000 )
  },
  methods: {



    clickedButton: function(buttonName)
    {


    },

    onRowClicked: function(item)
    {
        console.log('on row clicked ')

         item.itemType = 'order'

         this.rightClickRowCallback(item)

    },

    ordersChanged: function(ordersData )
    {
      console.log('got new order data', ordersData )
      this.orderRows = []

      for(var i in ordersData)
      {

        let result = ordersData[i]
        result.amountDueFormatted = EthereumHelper.formatTokenAmount(result.amountDue, web3connectionconfig.tokenDecimals )

        this.orderRows.push(result)
      }



    },


    playersChanged: function(myPlayer, playersOnGrid)
    {


    },

    takeMarketOrder: function(orderData)
    {
        web3Connection.takeMarketOrder( formData , this.myPlayer)
    },

    requestOrdersFromAPI: async function()
    {
      if(this.activeStationPanel == 'market') {
      // could pass the station id here so players can look at orders in remote stations...
      var results = await this.dataRequestCallback({ requestType:'orders' })

      this.ordersChanged(results.data )
      }
    }





  }

}
</script>
