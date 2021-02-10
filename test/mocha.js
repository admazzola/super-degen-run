var assert = require('chai').assert;
var expect = require('chai').expect;

const Delay = require('delay');
const EthereumHelper = require('../shared/lib/EthereumHelper')
const MarketManager = require('../server/src/lib/MarketManager')




var GameServer = require('../server/src/lib/GameServer')





const web3connectionconfig = require('../shared/contracts/web3connection.config')

const web3utils = require('web3-utils')

describe('  server tests', function() {



  it(" can run tests ", async () => {

    assert.ok(true);

  })


  it(" can get expected uuid  ", async () => {
    var invoiceData = {
      description: 'test',
      nonce: 1,
      token: "0x7132C9f36abE62EAb74CdfDd08C154c9AE45691B",
      amountDue: 0,
      payTo: "0x7132C9f36abE62EAb74CdfDd08C154c9AE45691B",
      expiresAt: 0

    }
    let uuid = EthereumHelper.getExpectedInvoiceUUID( invoiceData )

    expect(uuid).to.equal('0x08d47b6275fdc87ac5006ebf8e3a3fdd34d0801049c314ccc0f25216392972cf');

  })


  it(" can make market order  ", async () => {
    var requestData = {
      item: {
          id: 0,
          name: 'test'

      },
      pricePerUnit: 2.0,
      quantity: 1,
      publicAddress: "0x7132C9f36abE62EAb74CdfDd08C154c9AE45691B"


    }
    let result = MarketManager.getOrderDataFromRequest( requestData )



    expect(result.amountDue).to.equal( 200000000 );
    expect(result.itemId).to.equal( 0 );
    expect(result.nonce).to.exist


  })


  it(" can run the server   ", async () => {
    var gameServer = new GameServer()

 
    await gameServer.start('test', function(){  });

    console.log('booted test game server ')



  })
 








});
