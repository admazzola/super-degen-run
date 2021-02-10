<template>
  <div class="p12" v-if="activeStationPanel=='inventory'" >

    <div class="text-lg"> Inventory   </div>

    <table class="table-fixed text-xs text-gray-100 mt-4 border-t-0 border-b-0"   >

      <thead>
       <tr>
          <th class="px-1 py-1">Icon</th>
         <th class="px-1 py-1">Name</th>
         <th class="px-1 py-1">Volume (m3)</th>
         <th class="px-1 py-1">Quantity</th>
         <th class="px-1 py-1">Est. Price</th>
       </tr>
     </thead>
     <tbody>
      <tr v-for="item in itemRows" v-bind:key="item.id"  @mousedown.right="onRowClicked(item)" class="cursor-pointer">
        <td class="border px-4 py-4 text-right border-gray-700">   </td>

        <td class="border px-4 py-4 capitalize  border-gray-700 " > {{ item.name }}</td>
        <td class="border px-4 py-4 text-right border-gray-700"> {{ item.totalVolume }} </td>
        <td class="border px-4 py-4 text-right border-gray-700"> {{ item.stackQuantity }} </td>
        <td class="border px-4 py-4 text-right border-gray-700"> {{ item.estPrice }} </td>
      </tr>
    </tbody>

    </table>


  </div>
</template>


<script>

 
import ItemHelper from '../../../shared/lib/ItemHelper'



export default {


  name: 'InventoryPanel',
  props: ['rightClickRowCallback','dataRequestCallback','stationUnitId','activeStationPanel'],
  components: {

  },
  data() {
    return {
      itemRows: [],
      focusedRowId: null,
      myPlayer: null

    }
  },
  mounted(){
      this.requestItemsFromAPI()
      setInterval( this.requestItemsFromAPI, 5000 )
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

    onRowClicked: function(item)
    {
        console.log('on row clicked ')


        item.itemType = 'item'

         this.rightClickRowCallback(item)

    },


    inventoryDataChanged: function(inventoryData)
    {

        this.itemRows = []

        for(var i in inventoryData)
        {
          let typedata = ItemHelper.getItemTypeByInternalName(inventoryData[i].internalName)

          let row = {
            name: typedata.name,
            internalName: typedata.internalName,
            volume: typedata.volume,
            totalVolume: typedata.volume*inventoryData[i].stackQuantity,
            stackQuantity: inventoryData[i].stackQuantity,
            id: inventoryData[i]._id

          }

          this.itemRows.push(row)
        }


    },


    setActiveForm: function(formName)
    {

      this.activeForm = formName

    },

    requestItemsFromAPI: async function()
    {
      if(this.activeStationPanel == 'inventory') {
        console.log('request items from api ')
        console.log('this.activeStationPanel',this.activeStationPanel)
        var results = await this.dataRequestCallback({requestType:'inventory', containerOwnerId: this.stationUnitId})

        this.inventoryDataChanged(results.data)
      }


    }




  }

}
</script>
