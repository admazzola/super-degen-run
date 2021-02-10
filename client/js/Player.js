

var web3utils = require('web3-utils')


module.exports = class Player   {


   constructor(pubAddress)
 {
    this.publicAddress = pubAddress.toLowerCase()


 }

 async personalSignWithMetamask( challenge,address, web3provider)
 {
   console.log('personal signing ', challenge, address)


  var challengeHash =    web3utils.fromUtf8 (challenge)

   var sig =   await new Promise(async (resolve,reject) => {

      web3provider.eth.personal.sign( challengeHash , address, function (err,result){
            if (err) {return console.error(err)}
            console.log('PERSONAL SIGNED:' + result)
            resolve(result);
     })

   })

   return sig;

 }


   async web3ecRecover(challenge,signature, web3provider)
  {


    console.log('ecrecover ', challenge, signature, web3)

    var addr =   await new Promise(async (resolve,reject) => {

       web3provider.eth.personal.ecRecover( web3utils.fromUtf8 (challenge) , signature, function (err,result){
             if (err) {return console.error(err)}
             console.log('ecrecover:' + result)
             resolve(result);
      })

    })

    return addr;

  }




}
