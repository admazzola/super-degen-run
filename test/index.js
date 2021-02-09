
//test authing in, spawning a ship
 var assert = require('chai').assert;

const Delay = require('delay');
const EthereumHelper = require('../shared/lib/EthereumHelper')



import ClientConnection from '../client/js/ClientConnection'

var clientConnection = new ClientConnection()


 var Web3 = require('web3')
import TestPlayer   from  './lib/TestPlayer'



describe('  server tests', function() {



  it(" can run tests ", async () => {

    assert.ok(true);

  })




  it(" can auth in and spawn  ", async ( ) => {

   var web3 = new Web3('https://mainnet.infura.io/v3/8f3009e6810d4a439161a5cf2bf23ebd');

    var player = new TestPlayer( )

      player.init( web3 )

     await new Promise ((resolve, reject) => {

       clientConnection.init(web3, player, function(){
         resolve()
       } )
     })

     console.log('authed!')


     await clientConnection.requestSpawn()

  })



  it(" can dock at a station ", async ( ) => {
      //command warp to a station

      // command dock at a station




   })

   it(" can add items to the market  ", async ( ) => {
       //command to have a test  item spawned (test only)

       // command to set up a market order - adds a record.. uses payspec invoice




    })




})
