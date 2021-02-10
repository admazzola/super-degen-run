<template>
  <div  v-if="!hidden" class="absolute p-0 m-0" style="background:#111a; width:80%; height:80%; margin:   auto;top: 0; left: 0; bottom: 0; right: 0; ">


    <div class="m-4 p-4 h-full" style="margin:auto">


       <div class="flex h-full bg-gray-800 font-roboto">

        <Sidebar
        ref="sidebar"
         v-bind:buttonClickedCallback="sidebarButtonClicked"
        />

        <div class="flex-1 flex flex-col overflow-hidden">

          <Header class="hidden"/>

          <div class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-900 relative">
            <div class="container mx-auto px-6 py-8 ">




                <div class="text-centered w-full text-gray-100">

                   <InventoryPanel

                    v-bind:rightClickRowCallback="handleItemActionMenuCallback"
                    v-bind:dataRequestCallback="dataRequestCallback"
                    v-bind:stationUnitId="stationUnitId"
                    v-bind:activeStationPanel="activePanel"
                    ref="inventorypanel"
                    />

                    <WalletPanel

                     v-bind:dataRequestCallback="dataRequestCallback"
                     v-bind:localActionCallback="localActionCallback"
                     v-bind:activeStationPanel="activePanel"
                     />

                    <HangarPanel

                     v-bind:activeStationPanel="activePanel"
                     />

                     <MarketPanel

                      v-bind:rightClickRowCallback="handleItemActionMenuCallback"
                      v-bind:dataRequestCallback="dataRequestCallback"
                      v-bind:stationUnitId="stationUnitId"
                      v-bind:activeStationPanel="activePanel"
                      ref="marketpanel"
                      />

                      <DevPanel

                       v-bind:devtoolsCallback="devToolsCallback"
                       v-bind:activeStationPanel="activePanel"
                       />


                </div>



              </div>

              <ModalContainer
              ref="modalContainer"
              v-bind:formSubmittedCallback="modalFormSubmitted"
              />




            </div>
          </div>

        </div>

        <div>



        </div>

      </div>




    </div>


</template>
<script>
/*

Will have subpanels for:

Your item storage (make folders for the user?)

Production  --certain modules can only be built in certain areas of space
Recycling
Fitting panel - upper half is your ships slots, lower half is your items (rows)


*/



//import GalaxyHelper from '../../../shared/lib/GalaxyHelper'
import Sidebar from './components/Sidebar.vue'
import Header from './components/Header.vue'
import ModalContainer from './components/ModalContainer.vue'


import InventoryPanel from './InventoryPanel.vue'
import HangarPanel from './HangarPanel.vue'
import MarketPanel from './MarketPanel.vue'
import WalletPanel from './WalletPanel.vue'
import DevPanel from './DevPanel.vue'
//import RecyclingPanel from './RecyclingPanel.vue'

import Web3Connection from '../../js/Web3Connection'

var web3Connection

export default {

  name: 'StationPanel',
  components: {
     Sidebar,Header,ModalContainer,
     InventoryPanel,HangarPanel,MarketPanel,
     DevPanel, WalletPanel
  },
  props: ['commandCallback','dataRequestCallback','devToolsCallback','handleItemActionMenuCallback','localActionCallback'],
  data() {
    return {
      myPlayer: null,
      hidden: true,
      activePanel: 'ships',
      stationUnitId: null
    }
  },
  mounted() {
    web3Connection = new Web3Connection()
  },
  methods: {


    setHidden: function(hidden){
        this.hidden=hidden
        //console.log('station panel is hidden: ', hidden)
    },

    /*handleRequestingAPIData: function(dataRequest){
          this.dataRequestCallback(dataRequest)
    },*/




    playersChanged: function(myPlayer, playersOnGrid)
    {
      this.myPlayer = myPlayer

      this.stationUnitId = myPlayer.dockedInStation

      /*if(GalaxyHelper.playerIsDocked(myPlayer ))
      {
        this.setHidden(false)
      }else{
        this.setHidden(true)
      }
    */

    },

    sidebarButtonClicked: function(buttonName)
    {


      if(buttonName == 'undock')
      {
        this.commandCallback('undock')

      }else{

        this.setActivePanel( buttonName )

      }

      this.localActionCallback('closeRightClickMenus')


    },

    modalFormSubmitted : function(formData)
    {
      console.log( 'modalFormSubmitted' , formData )

      //if(formData.requestType == 'makeMarketOrder'){
          this.dataRequestCallback( formData )

      //    web3Connection.createMarketOrder( formData , this.myPlayer)
      //}

        this.$refs.modalContainer.setHidden(true)
    },

    setActivePanel: function(panelName)
    {
      console.log("set panel ", panelName)
      this.$refs.sidebar.setActivePanel( panelName )
      this.activePanel = panelName
    },


    startSellingItem : function( item )
    {
      console.log('start selling ', )

      this.$refs.modalContainer.setHidden(false)
      this.$refs.modalContainer.setActiveForm('makeMarketOrder')
      this.$refs.modalContainer.setTargetData(item)

    }




  }

}
</script>
