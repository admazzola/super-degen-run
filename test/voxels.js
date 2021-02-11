var assert = require('chai').assert;
var expect = require('chai').expect;


const Web3 = require('web3')

const Delay = require('delay');
const EthereumHelper = require('../shared/lib/EthereumHelper')
const MarketManager = require('../server/src/lib/MarketManager')


//const Player = require('../client/js/Player')
//const ClientConnection = require('../client/js/ClientConnection')

const VoxelWorld = require('../client/js/VoxelWorld')
 
const GreedyMesh = require('../client/js/voxels/greedymesh').mesher
 


const web3connectionconfig = require('../shared/contracts/web3connection.config')

const web3utils = require('web3-utils')

describe(' voxels tests', function() {



  it(" can run tests ", async () => {

    assert.ok(true);

  })


  it(" can greedy mesh   ", async () => {

    let v = [3,7,2,2,2,1,1,1,1 ]
    let d = [3,3,3]

    let result = GreedyMesh( v, d)

    console.log('greedy quads', result )
     
  })

  

 








});
