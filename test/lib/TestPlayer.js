
 var testEthAccount;

 var ethJsUtil = require('ethereumjs-util')
 var web3utils = require('web3-utils')

export default  class TestPlayer {


  init( web3 )
  {
     testEthAccount =   web3.eth.accounts.create();



       this.publicAddress = testEthAccount.address.toLowerCase();

       console.log('test acct', this.publicAddress )

  }

  //actually does not use metamask for the test
  async personalSignWithMetamask( msg,address,web3provider)
  {

    //this is busted


      const msgHash = ethJsUtil.hashPersonalMessage(Buffer.from( msg ) );



//  var challengeHashBuffer =     ethJsUtil.toBuffer(  challengeHash  )
   var privateKeyBuffer = ethJsUtil.toBuffer(testEthAccount.privateKey)
   console.log('personal signing ',msg, msgHash,  address, privateKeyBuffer, testEthAccount.privateKey)



    var rpcsig = ethJsUtil.ecsign(msgHash, privateKeyBuffer  )
   //var sig =  await web3.personal.sign(challengeHash, web3.eth.coinbase, console.log);

/*
    var sig =   await new Promise(async (resolve,reject) => {

       web3.personal.sign( challengeHash , address, function (err,result){
             if (err) {return console.error(err)}
             console.log('PERSONAL SIGNED:' + result)
             resolve(result);
      })

    })
*/

   var sig = ethJsUtil.toRpcSig(rpcsig.v,rpcsig.r,rpcsig.s)

  //  console.log('personal signed ', challenge, address, sig)

    return sig;

  }




     async web3ecRecover(msg,signature, web3provider)
    {




          console.log('ecrecover ', msg, signature)
            var res = ethJsUtil.fromRpcSig(signature)

            const msgHash = ethJsUtil.hashPersonalMessage(Buffer.from( msg ) );


            var pubKey = ethJsUtil.ecrecover( ethJsUtil.toBuffer(msgHash) , res.v, res.r, res.s);
            const addrBuf = ethJsUtil.pubToAddress(pubKey);
            const recoveredSignatureSigner    = ethJsUtil.bufferToHex(addrBuf);
            console.log('rec:', recoveredSignatureSigner)


          return recoveredSignatureSigner.toLowerCase();



/*
      console.log('ecrecover ', challenge, signature, web3)

      var addr =   await new Promise(async (resolve,reject) => {

         var sig = ethJsUtil.ecsign(challengeHash, privateKeyBuffer  )

         web3provider.personal.ecRecover( web3utils.fromUtf8 (challenge) , signature, function (err,result){
               if (err) {return console.error(err)}
               console.log('ecrecover:' + result)
               resolve(result);
        })

      })

      return addr;
*/
    }


}
