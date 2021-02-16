 


const THREE = require('three')


const tileImages = require('../../worlddata/tileimages.json')
const tileTypes = require('../../worlddata/tiletypes.json')

const GreedyMesher = require('./greedymesher')
const CulledMesher = require('./culledmesher')



import {VoxelTextureManager} from './voxeltexturemanager'
 

import ChunkManager from './chunkmanager'
import VoxelWorldGenerator from './VoxelWorldGenerator'

const VoxelUtils = require('./voxelutils')

const neighborOffsets = [
  [ 0,  0,  0], // self
  [-1,  0,  0], // left
  [ 1,  0,  0], // right
  [ 0, -1,  0], // down
  [ 0,  1,  0], // up
  [ 0,  0, -1], // back
  [ 0,  0,  1], // front
];




export default class VoxelWorld {
  constructor(options) {
    this.worldPivot =  new THREE.Object3D()
    
    if(options){
      this.headless = options.headless
    }
    
    //this.chunkSize = options.chunkSize;
   // this.tileSize = options.tileSize;
    //this.tileTextureWidth = options.tileTextureWidth;
   // this.tileTextureHeight = options.tileTextureHeight;
  //  const {chunkSize} = this;
   // this.chunkSliceSize = chunkSize * chunkSize;
   // this.cells = {}; // contains the chunks which are each a uint8 flat array

  //  this.scaleFactor = 5;


   // this.cellIdToMesh = {};

    //this.renderRequested = false;

    if(this.headless){



    this.chunkManager = new ChunkManager({
      headless:this.headless,
      chunkDistance:1,
      blockSize:1,
     // mesher: new GreedyMesher(),
      chunkSize:32,
      //this will come from cache - from server-  when its ready 
      
      container:  {} ,
      textureManager:  {} ,
  } );


     


    }else {




      this.chunkManager = new ChunkManager({
        headless:this.headless,
        chunkDistance:1,
        blockSize:1,
        mesher: new GreedyMesher(),
        chunkSize:32,
        //this will come from cache - from server-  when its ready 
        
        container: new THREE.Group(),
        textureManager: new VoxelTextureManager({aoEnabled:false}),
    } );


  const tilesPath = './assets/textures/Tiles/'
  
  let texturesDataArray = tileImages.map(t => {return {id: t.id, src: tilesPath.concat(t.imgurl) } } )
    

  //this comes from TileTypes.json 
  this.chunkManager.textureManager.loadTextures(texturesDataArray).then(()=>{
    //  this.chunkManager.rebuildAllMeshes()
    //   this.chunkManager.requestMissingChunks(new THREE.Vector3(0,0,0))
     
  })

  //attach the mesh to the scene
  this.worldPivot.add( this.chunkManager.container )



    }



  }


  offlineGen(){


    let worldseed = 0 

    let voxelWorldGenerator = new VoxelWorldGenerator()
    voxelWorldGenerator.buildNoiseMaps(worldseed) 


    this.chunkManager.generateVoxelChunk = function( lowBounds, highBounds, chunkCoords, chunkSize ){
      
      return voxelWorldGenerator.generateChunkInfo(  lowBounds, highBounds, chunkCoords, chunkSize )
    
    } 

     
    this.chunkManager.generateChunksNearPosition(new THREE.Vector3(0,0,0), 4)
    this.chunkManager.rebuildAllMeshes()
 

 
  }

  getWorldPivot(){
    return this.worldPivot
  }

  //this is how the server gives us chunk data ! 
  //we need to be able to request this and compare hashes of this data 
  receiveChunkInfoFromServer(chunkInfo){
    let chunk = this.chunkManager.makeChunkFromData(chunkInfo)
    this.chunkManager.rebuildMesh(chunk)
  }



  getChunkDeltaCountersFromCache( chunkKeysArray ){

    let results = {}

    for (let chunkId of chunkKeysArray){
      let chunk = this.chunkManager.findChunkById(chunkId)
 
      if(chunk && chunk.deltaCounter){
        results[chunkId] = chunk.deltaCounter 
      }

    }

    return results

  }


  getChunksFromCache( chunkKeysArray ){

    let results = {}

    for (let chunkId of chunkKeysArray){
      let chunk = this.chunkManager.findChunkById(chunkId)
     
     
      
      let isValid = (chunk != null && chunk.deltaCounter != null)
 
      if(isValid){
         

        results[chunkId] = chunk 
      }

    }

    return results

  }

  saveChunksToCache(chunkArray){

    let results = {}

   

    for (const [key, chunk ] of Object.entries(chunkArray)) {
      
      console.log('save chunk ', key, {chunkId: chunk.chunkId})

      
      if(!chunk.voxels){
        console.log('WARN: saveChunkToCache has no voxels', key)
      }

        let outputChunk= this.chunkManager.makeChunkFromData(chunk)
      results[key] = outputChunk
      console.log('saved local chunk ',key, outputChunk.id, outputChunk.deltaCounter)
    }

    return results

  }



  chunkInfoIsNewerThanLocalState(chunkInfo){

    let chunkId = chunkInfo.chunkId 
    let deltaCounter = chunkInfo.deltaCounter

    let existingChunkInfo = this.chunkManager.findChunkById(chunkId)

    if(!existingChunkInfo || existingChunkInfo.deltaCounter < deltaCounter){
      return true 
    }
    return false 
  }




}

/*
const faces = [
  { // left
    uvRow: 0,
    dir: [ -1,  0,  0, ],
    corners: [
      { pos: [ 0, 1, 0 ], uv: [ 0, 1 ], },
      { pos: [ 0, 0, 0 ], uv: [ 0, 0 ], },
      { pos: [ 0, 1, 1 ], uv: [ 1, 1 ], },
      { pos: [ 0, 0, 1 ], uv: [ 1, 0 ], },
    ],
  },
  { // right
    uvRow: 0,
    dir: [  1,  0,  0, ],
    corners: [
      { pos: [ 1, 1, 1 ], uv: [ 0, 1 ], },
      { pos: [ 1, 0, 1 ], uv: [ 0, 0 ], },
      { pos: [ 1, 1, 0 ], uv: [ 1, 1 ], },
      { pos: [ 1, 0, 0 ], uv: [ 1, 0 ], },
    ],
  },
  { // bottom
    uvRow: 1,
    dir: [  0, -1,  0, ],
    corners: [
      { pos: [ 1, 0, 1 ], uv: [ 1, 0 ], },
      { pos: [ 0, 0, 1 ], uv: [ 0, 0 ], },
      { pos: [ 1, 0, 0 ], uv: [ 1, 1 ], },
      { pos: [ 0, 0, 0 ], uv: [ 0, 1 ], },
    ],
  },
  { // top
    uvRow: 2,
    dir: [  0,  1,  0, ],
    corners: [
      { pos: [ 0, 1, 1 ], uv: [ 1, 1 ], },
      { pos: [ 1, 1, 1 ], uv: [ 0, 1 ], },
      { pos: [ 0, 1, 0 ], uv: [ 1, 0 ], },
      { pos: [ 1, 1, 0 ], uv: [ 0, 0 ], },
    ],
  },
  { // back
    uvRow: 0,
    dir: [  0,  0, -1, ],
    corners: [
      { pos: [ 1, 0, 0 ], uv: [ 0, 0 ], },
      { pos: [ 0, 0, 0 ], uv: [ 1, 0 ], },
      { pos: [ 1, 1, 0 ], uv: [ 0, 1 ], },
      { pos: [ 0, 1, 0 ], uv: [ 1, 1 ], },
    ],
  },
  { // front
    uvRow: 0,
    dir: [  0,  0,  1, ],
    corners: [
      { pos: [ 0, 0, 1 ], uv: [ 0, 0 ], },
      { pos: [ 1, 0, 1 ], uv: [ 1, 0 ], },
      { pos: [ 0, 1, 1 ], uv: [ 0, 1 ], },
      { pos: [ 1, 1, 1 ], uv: [ 1, 1 ], },
    ],
  },
];*/
