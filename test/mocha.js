var assert = require('chai').assert;
var expect = require('chai').expect;


const Web3 = require('web3')

const Delay = require('delay');
const EthereumHelper = require('../shared/lib/EthereumHelper')
const MarketManager = require('../server/src/lib/MarketManager')


//const Player = require('../client/js/Player')
//const ClientConnection = require('../client/js/ClientConnection')

const GameServer = require('../server/src/lib/GameServer')
const GameState = require('../server/src/lib/gamestate')




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
    

 
    await gameServer.start('test', function(mongoInterface,redisInterface){ 
      this.mongoInterface = mongoInterface
     }.bind(this));

    console.log('booted test game server ')

     
    let web3 = new Web3()

    let ethAcct = web3.eth.accounts.create() 

    let spawnLoc = GameState.getNewPlayerSpawnLocation()
    

    await GameState.spawnPlayerUnit( {publicAddress:ethAcct.address }, 'humanMale', spawnLoc, this.mongoInterface )
      
    console.log('spawned player unit  ')

  })

/*
  it(" client can join the server   ", async () => {

    let web3 = new Web3()

    let ethAcct = web3.eth.accounts.create() 
    
    console.log('ethAcct',ethAcct)

    let player = new Player( ethAcct.address )

    let clientConnection = new ClientConnection( )
     
    await clientConnection.init( player, function(){ } )


    console.log('client connected to server  ')
      

  })
 
*/


 








});
