var web3utils = require('web3-utils')


const Web3 = require('web3')


const contractData = require('../contracts/contractdata.json').contracts

const payspecContractABI = require('../contracts/abi/PaySpec.json')
const tokenContractABI = require( '../contracts/abi/ERC20.json' )

module.exports =  class EthereumHelper {


   static getNetworkDetails()
   {

     return {
       "networkName": "Matic Mainnet",
       "chainId": 137,
       "rpc": "https://rpc-mainnet.matic.network",
       "explorer": "https://explorer.matic.network",
       "dedicated_rpc": "https://rpc-mainnet.maticvigil.com/v1/3304ec1dd22f6ff1589fd0353a549a70b82d4dfd"
     }
   }

   //for the client to pop up the metamask window
   static getPayspecContract(web3Provider,  options )
   {

    if(!web3Provider)
    {
        var web3Provider = Web3.givenProvider
    }

     let web3 = new Web3( web3Provider )

     return new web3.eth.Contract(payspecContractABI, contractData.matic_network.payspec.address, options);

   }

   static getTokenContract(web3Provider,  options )
   {

     if(!web3Provider)
     {
         var web3Provider = Web3.givenProvider
     }

     let web3 = new Web3( web3Provider )

     return new web3.eth.Contract(tokenContractABI, contractData.matic_network._0xbitcoin.address, options);

   }

   static async getWeb3ProviderDetails()
   {
     let web3 = new Web3( Web3.givenProvider )

      return {
        chainId: await web3.eth.getChainId()

      }

   }


   static async approveTokensToPayspec( publicAddress )
   {

     let options = {
          from:  publicAddress//, // default from address
         // gasPrice: '20000000000' // default gas price in wei, 20 gwei in this case
      }


     let paySpecContract = EthereumHelper.getPayspecContract();
     let paySpecContractAddress = paySpecContract.options.address;


     let tokenContract = EthereumHelper.getTokenContract();
     let tokenContractAddress = tokenContract.options.address;

     let approvalAmount = 2100000000000000;

     let ethTx = await tokenContract.methods.approve(
       paySpecContractAddress, approvalAmount
     ).send( options )
   }

   static async startBuyoutOrderWeb3(requestData ){
     let order = requestData.item;

     let txData = {
       description: order.description,
       nonce: order.nonce ,
       token: order.token,
       amountDue: order.amountDue,
       payTo: order.payTo,
       expiresAt: order.expiresAt,
       invoiceUUID: order.invoiceUUID
     }




     let paySpecContract = EthereumHelper.getPayspecContract();

     if(!paySpecContract  )
     {
       return {success:false, error: 'No valid web3 provider'}
     }


     let options = {
          from: requestData.publicAddress//, // default from address
         // gasPrice: '20000000000' // default gas price in wei, 20 gwei in this case
      }


      try{


           let ethTx = await paySpecContract.methods.createAndPayInvoice(
             txData.description,
             txData.nonce,
             txData.token,
             txData.amountDue,
             txData.payTo,
             txData.expiresAt,
             txData.invoiceUUID

           ).send( options )

            return {success:true, ethTx: ethTx}

     }catch(err)
     {
        return {success:false, error: err}
     }

       return {success:false}
   }


   static formatTokenAmount(amountRaw, decimals)
   {
     return ( amountRaw  / Math.pow(10,decimals)    ).toFixed(decimals)

   }

   static formattedTokenAmountToRaw(amountRaw, decimals)
   {
     return Math.floor( amountRaw  *  Math.pow(10,decimals)    )

   }

   static async getWalletDetails( publicAddress )
   {

      let web3details = await EthereumHelper.getWeb3ProviderDetails();

     let walletDetails = { publicAddress: publicAddress }

     let paySpecContract = EthereumHelper.getPayspecContract();
     let paySpecContractAddress = paySpecContract.options.address;



     let tokenContract = EthereumHelper.getTokenContract();
     let tokenContractAddress = tokenContract.options.address;

     let options = { }

     try{
       walletDetails.tokensBalance = await tokenContract.methods.balanceOf(publicAddress).call(options)

       walletDetails.tokensApprovedToPayspec = await tokenContract.methods.allowance(publicAddress,paySpecContractAddress).call(options)

       walletDetails.tokensBalanceFormatted = EthereumHelper.formatTokenAmount(walletDetails.tokensBalance , 8)
       walletDetails.tokensApprovedToPayspecFormatted = EthereumHelper.formatTokenAmount(walletDetails.tokensApprovedToPayspec , 8)
     }catch(e)
     {
       console.log(e)
     }



     return {success:true, walletdetails: walletDetails, web3details: web3details, paySpecContractAddress: paySpecContractAddress };
   }


   static async getPaySpecOrderPaidStatus( invoiceUUID )
   {
     let provider = EthereumHelper.getNetworkDetails().dedicated_rpc

     let paySpecContract = EthereumHelper.getPayspecContract(provider);

     let options = {}
     let response =  await paySpecContract.methods.getInvoicePayer(invoiceUUID).call(options)

     return response
   }

   static async getPaySpecOrderExpiredStatus( invoiceUUID )
   {
     let provider = EthereumHelper.getNetworkDetails().dedicated_rpc

     let paySpecContract = EthereumHelper.getPayspecContract(provider);

     let options = {}
     let response =  await paySpecContract.methods.invoiceHasExpired(invoiceUUID).call(options)

     return response
   }



   static getExpectedInvoiceUUID( invoiceData )
   {
     var description = invoiceData.description;
     var nonce =invoiceData.nonce;
     var token =invoiceData.token;
     var amountDue =invoiceData.amountDue;
     var payTo =invoiceData.payTo;
     var expiresAt =invoiceData.expiresAt;

     return web3utils.soliditySha3( description, nonce,token, amountDue, payTo, expiresAt )
   }



}
