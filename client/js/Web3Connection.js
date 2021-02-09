


const web3connectionconfig = require('../../shared/contracts/web3connection.config')

const EthereumHelper = require('../../shared/lib/EthereumHelper')


import Web3 from 'web3'
const web3utils = require('web3-utils')

export default class Web3Connection {

  constructor()
  {
    this.web3 = new Web3( Web3.givenProvider );



  }



/*
  let formData = {
    formType: 'makeMarketOrder',
    item: this.targetData,
    quantity: this.quantityToSell,
    pricePerUnit: this.pricePerUnit

  }
*/

  async takeMarketOrder( orderData, player )
  {


  }

/*
  async createMarketOrder( formData, player )
  {
    if(isNaN(formData.quantity) || isNaN(formData.pricePerUnit))
    {
      return {success: false, error: 'Invalid entry: Not a Number (NAN)' }
    }



    let pricePerUnitRaw = Math.pow(  parseFloat(formData.pricePerUnit) , web3connectionconfig.tokenDecimals )


     //string memory description, uint256 nonce, address token, uint256 amountDue, address payTo, uint256 ethBlockExpiresAt, bytes32 expecteduuid

    let amountDueRaw = Math.floor(pricePerUnitRaw) * Math.floor( formData.quantity );

    var txData = {
      description: formData.item.name,
      nonce: parseInt(web3utils.randomHex(8)) ,
      token: web3connectionconfig.tokenContractAddress,
      amountDue:  amountDueRaw,
      payTo: player.publicAddress,
      expiresAt: 0
    }

    let uuid = EthereumHelper.getExpectedInvoiceUUID(txData)
    txData.invoiceUUID = uuid

    console.log(' create  market order for web3 ', formData, txData)
    return {success: true }
  }

  */ 

  async getNetworkBlockNumber()
  {
    return 0 //implement
  }


  getTokenContract()
  {



  }

}
