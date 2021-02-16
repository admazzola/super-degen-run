
var hash = require('object-hash');

var LZUTF8 = require('lzutf8');

import ChunkManager from './chunkmanager'

module.exports=  class VoxelHelper{
    
    

static getCompressedChunkArray(chunkArray){
    
    let result = {}

    for (const [key, chunk] of Object.entries(chunkArray)) {
        result[key] = VoxelHelper.getCompressedChunkData(chunk)
    }

    return result 

}


static getDecompressedChunkData(chunk){
    
    if(typeof chunk == 'undefined' ){
       
        return {} 
    }

    return {
        id: chunk.id,
        dims: chunk.dims,
        chunkBits: chunk.chunkBits, 
        chunkPosition: chunk.chunkPosition,
        hash: chunk.hash,
        deltaCounter: chunk.deltaCounter ,
        voxels: VoxelHelper.decompressVoxelArray(  chunk.compressedVoxels  )
    }
    
}

static getCompressedChunkData(chunk){
    
    if(typeof chunk == 'undefined' ){
       
        return {} 
    }

    return {
        id: chunk.id,
        dims: chunk.dims,
        chunkBits: chunk.chunkBits, 
        chunkPosition: chunk.chunkPosition,
        hash: chunk.hash,
        deltaCounter: chunk.deltaCounter ,
        compressedVoxels: VoxelHelper.compressVoxelArray( Object.values(chunk.voxels) )
    }
    
}

//todo 
static compressVoxelArray(voxelArray){

    console.log('voxelArray length', voxelArray.length )

    let uint8Array =   Uint8Array.from( voxelArray )

    let cArray =   LZUTF8.compress(uint8Array ,{outputEncoding: "Buffer" });
 
    return cArray
}

//this works now 
static decompressVoxelArray(compressedVoxelArray){

    
    compressedVoxelArray =  Buffer.from(compressedVoxelArray)
    //console.log("comp vox ", compressedVoxelArray)


    let uArray =   LZUTF8.decompress(compressedVoxelArray ,{inputEncoding: "Buffer" , outputEncoding: 'ByteArray'});
     
    //need to make it an object ? 

    let voxels = {}
    let i = 0;

    for(let i in uArray){ 
        voxels[i] = uArray[i]
    }

    //console.log("decomp vox ", voxels)

    return voxels
}


static findMissingChunks(localChunks,  actualChunks){
    let result = [] 


    for (const [key, chunk] of Object.entries(localChunks)) {
        console.log(`${key}: ${chunk}`);

        if(typeof chunk == 'undefined' || chunk == null){
            result.push( key )
            continue 
        }   

        let actualChunk = actualChunks[ key ]

        if(  chunk.deltaCounter < actualChunk.deltaCounter - 10){
            result.push( key )
            continue 
        }  
        
      }


    return result 
}

static findDesyncedChunks(localChunks,  actualChunks){
    let result = [] 


    for (const [key, chunk] of Object.entries(localChunks)) {
        

        let actualChunk = actualChunks[ key ]

        if(chunk && chunk.deltaCounter < actualChunk.deltaCounter && chunk.deltaCounter >  actualChunk.deltaCounter - 10){
            result.push( key )
            continue 
        }  
        
      }


    return result 
}




static chunkArrayToFingerprints(chunkArray){
    let result = {}

    

    for (const [key, value] of Object.entries(chunkArray)) {
       // console.log(`${key}: ${value}`);

        result[key] = VoxelHelper.chunkToFingerprint( value )
      }

     

    return result 
}


static chunkToFingerprint(chunk){

    if(typeof chunk == 'undefined'){
        return null
    }


    return {
       // hash: hash(chunk.voxels),
        deltaCounter: chunk.deltaCounter, 
        id: chunk.id  
    }

}



//SERVER ONLY 
static async readChunksFromDatabase(chunkKeys, mongoInterface){
    let chunkArray = {}

    for (let key of chunkKeys) {

        console.log('read chunk with key', key.toString()) 
 
     
        let chunk =  await mongoInterface.findOne('chunks', {'chunkId': key.toString()})

        if(chunk){
            console.log('read chunk from db', key,  chunk.id, Object.keys(chunk), chunk.deltaCounter ) 

            if(!chunk.deltaCounter){
                chunk.deltaCounter = 0
            }
             


            chunkArray[key] = chunk 
        }else{
            console.log('WARN: cannot find chunk in mongo', key )
        }
        

    }

    return chunkArray

}

static async readChunkDeltaCountersFromDatabase(chunkKeys, mongoInterface){
    let chunkArray = {}

    for (let key of chunkKeys) {
 
        let chunk =  await mongoInterface.findOne('chunks', {'id': key.toString()})

        if(chunk){ 

            chunkArray[key] =  chunk.deltaCounter
        }else{
            console.log('WARN: cannot find chunk in mongo', key )
        }
        

    }

    return chunkArray

}


/*
  This will not overwrite existing chunks 
*/
static async storeNewChunk(chunkInfo, mongoInterface){
  

    let existingChunk = await mongoInterface.findOne('chunks',{id: chunkInfo.id})
  
   
  
  
    if(!existingChunk){


            let chunkStore = {
                id: chunkInfo.id,
                dims: chunkInfo.dims,
                voxels: chunkInfo.voxels,
                chunkPosition: chunkInfo.chunkPosition//,
            // voxelsHash: ChunkManager.getChunkHash( chunkInfo ) 
            }
        
            
            console.log('Storing new chunk in mongo ', chunkInfo.id)
            await mongoInterface.insertOne('chunks', chunkStore )
            }else{
            console.log('Chunk already stored in mongo ', chunkInfo.id)
            }
    
  
  }
  
  static async updateExistingStoredChunk(){
  
    
  }



}