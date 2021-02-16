
const mongoInterface = require('../src/lib/mongo-interface')
 
import  VoxelWorldGenerator from '../../shared/lib/voxels/VoxelWorldGenerator'
import  ChunkManager from '../../shared/lib/voxels/chunkmanager'
import  GreedyMesher from '../../shared/lib/voxels/greedymesher'

const VoxelHelper = require('../../shared/lib/voxels/VoxelHelper')


async function task()
{
    console.log('start task - proc gen terrain')

    let serverMode = 'production'

    await mongoInterface.init( 'polyvoxels_'.concat(serverMode) )

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


    const chunkRows = 16 
    

    for(let i=-chunkRows; i < chunkRows; ++i){

        console.log('meep ',i)

         let lowBounds = [i,-chunkRows,-chunkRows]
         let highBounds = [i,chunkRows,chunkRows]

        chunkManager.generateChunksWithinBounds(lowBounds,highBounds)
 
       
        for(let chunkInfo of  Object.values(chunkManager.chunks) ){

            console.log('chunkInfo', chunkInfo.id)
            let stored = await VoxelHelper.storeNewChunk(chunkInfo, mongoInterface)
        
        }
        
        chunkManager.removeAllChunks()
    }
    
    

 



}

task()
