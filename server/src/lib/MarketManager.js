

const ItemHelper = require('../../../shared/lib/ItemHelper')
const GalaxyHelper = require('../../../shared/lib/GalaxyHelper')
const UnitHelper = require('../../../shared/lib/UnitHelper')

const Web3 = require('web3')


const web3connectionconfig = require('../../../shared/contracts/web3connection.config')

const EthereumHelper = require('../../../shared/lib/EthereumHelper')

const web3utils = require('web3-utils')
const delay = require('delay');


module.exports = class MarketManager {


    constructor(mongoInterface)
    {
      this.mongoInterface = mongoInterface

      this.web3 = new Web3( EthereumHelper.getNetworkDetails().dedicated_rpc )

      setTimeout( this.updateMarketOrders.bind(this), 5000  )

      //setTimeout( this.updateMarketOrders.bind(this), 5000  )

    }





    async getMarketOrders( requestData )
    {
      let player = await this.mongoInterface.findOne('activePlayers', {publicAddress: requestData.publicAddress })

      let playerStationUnitId = player.dockedInStation;


      let orders =  await this.mongoInterface.findAll('marketOrder', {stationUnitId:  playerStationUnitId, status:'pending'   }  )


      return orders
    }



    /*
      Need to put the item in escrow but need to make sure that I do it in a
      threadsafe way...
    */
    /*store new market order {
        requestType: 'makeMarketOrder',
        item: {
          name: 'Metal Scrap',
          internalName: 'metalscrap',
          volume: 1,
          totalVolume: 5,
          stackQuantity: 5,
          id: '5f7d032e8cf1697df0c8c6c8'
        },
        quantity: 0,
        pricePerUnit: 0,
        authToken: '0x5413eee2cf6c34f60590a9f44339daa8b7ac0280',
        publicAddress: '0x7132c9f36abe62eab74cdfdd08c154c9ae45691b'
      }

      */


    async storeNewMarketOrder( requestData )
    {


      if(isNaN(requestData.quantity) || isNaN(requestData.pricePerUnit))
      {
        return {success: false, error: 'Invalid entry: Not a Number (NAN)' }
      }

      requestData.quantity = Math.floor(requestData.quantity) //make sure it is an integer


      if(requestData.quantity > requestData.item.stackQuantity)
      {
        return {success: false, error: 'Invalid entry: Quantity not present' }
      }

      if(requestData.quantity <= 0 )
      {
        return {success: false, error: 'Invalid entry: Quantity must be greater than zero' }
      }

      var remainingQuantity = (requestData.item.stackQuantity - requestData.quantity)


      //need more checks here to make sure someone cannot insert bogus data for an order



     let item = await this.mongoInterface.findById('items', requestData.item.id )


     let itemType = ItemHelper.getItemTypeByInternalName(item.internalName)




     if(item && ItemHelper.allowedToSellItem(item)){

            let marketData = MarketManager.getOrderDataFromRequest(  requestData )

            let itemContainerId = item.containerId;
            let container = await this.mongoInterface.findById('itemContainer', itemContainerId  )


            marketData.stationUnitId = container.encapsulatingUnitId;
            marketData.status = 'pending' //or expired or complete

            marketData.quantity = requestData.quantity
            marketData.pricePerUnit = requestData.pricePerUnit
            marketData.itemName = itemType.name


            if(marketData.stationUnitId == null){
                return {success: false, error: 'Invalid entry: item is not in a station ' }
            }

            if(marketData.itemId == null){
                return {success: false, error: 'Invalid entry: null item id' }
            }

            let inserted =  await this.mongoInterface.insertOne('marketOrder', marketData  )

            let order = await this.mongoInterface.findById('marketOrder',   inserted.insertedId  )

            if(order)
            {
            //  item.escrowedForMarketOrder = order._id;

              await this.mongoInterface.updateOne('items', {_id: item._id} , {escrowedForMarketOrder: order._id, stackQuantity: order.quantity  } )

              if(remainingQuantity > 0)
              {
                let remainderItem = await ItemHelper.spawnNewItem(this.mongoInterface,{

                  containerId: itemContainerId,
                  internalName: item.internalName,
                  stackQuantity: remainingQuantity

                })
              }

              return {success: true }
            }else{
              console.log('WARN: not able to make order ', requestData)
            }


     }else{
        return {success: false, error: 'Not allowed to sell this item ' }
     }

    // await this.mongoInterface.insertOne( )




    }

/*

{ requestType: 'buyoutOrderTx',
orderData:
 { _id: '5f7fc777b6e8f3151f14e423',
   itemId: '5f7fc770b6e8f3151f14e422',
   description: 'Metal Scrap',
   nonce: '13531077423923532000',
   token: '0x71B821aa52a49F32EEd535fCA6Eb5aa130085978',
   amountDue: 1,
   payTo: '0x7132c9f36abe62eab74cdfdd08c154c9ae45691b',
   expiresAt: 0,
   invoiceUUID:
    '0xbb965f4760a90df27af40bb0624452c273efadbabc59b9120e0b956a38c192c5',
   stationUnitId: '5f7fc6deb6e8f3151f14e41a',
   status: 'pending',
   quantity: 1,
   pricePerUnit: '1',
   itemName: 'Metal Scrap',
   amountDueFormatted: '0.00000001',
   itemType: 'order' },
txSuccess: true,
authToken: '0x1bdb1d6447d1efed54594a7ae0867f81be22bc32',
publicAddress: '0x7132c9f36abe62eab74cdfdd08c154c9ae45691b' }


*/

      async clientSubmittedBuyoutOrder(requestData ){
       console.log('client submitted buyout order ', requestData)

    //  let inserted =  await this.mongoInterface.insertOne('startBuyout', txData  )
      let txSuccess = requestData.txSuccess

      let orderData = requestData.orderData

      let txHash = requestData.txHash

      if( txSuccess)
      {
        let order = await this.mongoInterface.findById('marketOrder',   orderData._id  )

        let result = await this.mongoInterface.updateOne('marketOrder', {_id: order._id},  { txHash: txHash   } )

        console.log( 'stored new tx hash for order ', order)

        await this.updateMarketOrder(  order )

        //just store this in a db table so we know.. so we collect data. no reason.

        return {success:true, result: result }

      }

      return {success:false }

    }


    /*
      Poll the matic network to see if an order is expired or completed .

    */


    async updateMarketOrders(){

      var txHashedOrders = await this.mongoInterface.findAll('marketOrder', { status: 'pending'}   )

      for(var i in txHashedOrders)
      {
        await delay(1000*10); // 10 seconds in between
        await this.updateMarketOrder( txHashedOrders[i] )
      }

      setTimeout( this.updateMarketOrders.bind(this) , 1000*60*60 ) // one hour in between
    }

    /*async updateTxHashedMarketOrders(){
      //if expired  then set status to expired
      // if paid/fulfilled then actually transfer the escrowed item and set status to complete


      var txHashedOrders = await this.mongoInterface.findAll('marketOrder', {txHash:{$exists:true} , status: 'pending'}   )

      for(var i in txHashedOrders)
      {
        await delay(1000);
        await this.updateMarketOrder( txHashedOrders[i] )
      }

      setTimeout( this.updateTxHashedMarketOrders.bind(this) , 1000*60 ) // one minute in between
    }*/

    async updateMarketOrder( order )
    {
        if(!order.invoiceUUID){
          console.log('WARN: Trying to update a market order with a null uuid ')
        }


        let orderInfo = await this.mongoInterface.findOne('marketOrder', { _id: order._id }   )
        if(orderInfo.status != 'pending'){
          return  // no need to update it
        }



        var isExpired = await EthereumHelper.getPaySpecOrderExpiredStatus(  order.invoiceUUID  )

        if(isExpired)
        {
          await this.mongoInterface.updateOne('marketOrder', {_id: order._id} , {status: 'expired'}  )

          return
        }

        var orderPayer = await EthereumHelper.getPaySpecOrderPaidStatus(  order.invoiceUUID  )


        if(orderPayer)
        {

          let orderInfo2 = await this.mongoInterface.findOne('marketOrder', { _id: order._id }   )
          if(orderInfo2.status != 'pending'){
            return  // no need to update it
          }


            await this.mongoInterface.updateOne('marketOrder',  {_id: order._id} , {status: 'complete', paidBy: orderPayer}  )

            let success = await this.transferItemsForOrderCompletion( order, orderPayer )

            if(!success)
            {
              await this.mongoInterface.updateOne('marketOrder',  {_id: order._id} , {status: 'pending'  }  )

              console.log('WARN: Could not transfer items for order completion ')
            }


          return
        }


    }

    async transferItemsForOrderCompletion( order, buyerAddress )
    {

      let itemId = order.itemId;

      let item = await this.mongoInterface.findById('items', itemId)

       let itemContainer = await this.mongoInterface.findOne('itemContainer', {_id: item.containerId })
       let stationContainingItemContainer = itemContainer.encapsulatingUnitId

      let buyingPlayer = await this.mongoInterface.findOne('activePlayers', {publicAddress: buyerAddress })

      let newContainer = await ItemHelper.getContainerFromPlayerAndUnitOwner( buyingPlayer, stationContainingItemContainer , this.mongoInterface)

      await this.mongoInterface.updateOne('items', {_id: item._id}, {escrowedForMarketOrder: null, containerId: newContainer._id })



      return true
    }




   static getOrderDataFromRequest( requestData  ){

      let pricePerUnitRaw = EthereumHelper.formattedTokenAmountToRaw( parseFloat(requestData.pricePerUnit) , web3connectionconfig.tokenDecimals )



      let amountDueRaw = Math.floor(pricePerUnitRaw) * Math.floor( requestData.quantity );

      var txData = {
        itemId: requestData.item.id,
        description: requestData.item.name,
        nonce: parseInt(web3utils.randomHex(8)).toString() ,
        token: web3connectionconfig.tokenContractAddress,
        amountDue:  amountDueRaw,
        payTo: requestData.publicAddress,
        expiresAt: 0
      }

      let uuid = EthereumHelper.getExpectedInvoiceUUID(txData)
      txData.invoiceUUID = uuid




      return txData

    }




}
