
const mongoInterface = require('../src/lib/mongo-interface')
 
import VoxelWorldGenerator from '../../shared/lib/voxels/VoxelWorldGenerator'
import  ChunkManager from '../../shared/lib/voxels/chunkmanager'
import  GreedyMesher from '../../shared/lib/voxels/greedymesher'




async function task()
{
    console.log('start task - proc gen terrain')

    let serverMode = 'production'

    mongoInterface.init( 'polyvoxels_'.concat(serverMode) )

    //Do not overwrite chunks that already exist 

   


    let chunkManager = new ChunkManager({
        chunkDistance:1,
        blockSize:1,
        mesher: new GreedyMesher(),
        chunkSize:32,
        //this will come from cache - from server-  when its ready 
        
        container:  {},
        textureManager:  {} ,
    } );
  


    let worldseed = 0 

    let voxelWorldGenerator = new VoxelWorldGenerator()
    voxelWorldGenerator.buildNoiseMaps(worldseed) 

 
    
    chunkManager.generateVoxelChunk = function( lowBounds, highBounds, chunkCoords, chunkSize ){
      
      return voxelWorldGenerator.generateChunkInfo(  lowBounds, highBounds, chunkCoords, chunkSize )
    
    } 


    chunkManager.generateChunksWithinBounds(  )


    let allChunks = chunkManager.chunks

    console.log(allChunks.length)


}

task()
