var assert = require('chai').assert;
var expect = require('chai').expect;


const THREE = require('three')

const Web3 = require('web3')
  
import  VoxelWorld from '../shared/lib/voxels/VoxelWorld'
import VoxelWorldGenerator from '../shared/lib/voxels/VoxelWorldGenerator'
import  ChunkManager from '../shared/lib/voxels/chunkmanager'
import  GreedyMesher from '../shared/lib/voxels/greedymesher'
import  {VoxelTextureManager} from '../shared/lib/voxels/voxeltexturemanager'

describe(' voxels tests', function() {



  it(" can run tests ", async () => {

    assert.ok(true);

  })


  it(" can offline gen    ", async () => {
 
     
      /*
    this.voxelWorld = new VoxelWorld({  
       // tileSize, 
      });*/



    this.chunkManager = new ChunkManager({
      chunkDistance:1,
      blockSize:1,
      mesher: new GreedyMesher(),
      chunkSize:32,
      //this will come from cache - from server-  when its ready 
      
      container: new THREE.Group(),
      textureManager:  {} ,
  } );

     


    let worldseed = 0 

    let voxelWorldGenerator = new VoxelWorldGenerator()
    voxelWorldGenerator.buildNoiseMaps(worldseed) 


    this.chunkManager.generateVoxelChunk = function( lowBounds, highBounds, chunkCoords, chunkSize ){
      
      return voxelWorldGenerator.generateChunkInfo(  lowBounds, highBounds, chunkCoords, chunkSize )
    
    } 


   //this.chunkManager.requestMissingChunks(new THREE.Vector3(0,0,0), 4)


   this.chunkManager.nearbyChunks(new THREE.Vector3(0,0,0), 4).map((chunkIndex) => {
    let chunkId = chunkIndex.join('|')
    if (!this.chunkManager.chunks[chunkId]) {
      let chunk = this.chunkManager.generateChunk(  new THREE.Vector3(chunkIndex[0],chunkIndex[1],chunkIndex[2]))

         console.log("meep made chunk ", chunk)
    }
})

     
  })

  
 


});
