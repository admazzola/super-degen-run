
var hash = require('object-hash');


module.exports=  class VoxelHelper{
    

static getCompressedChunkArray(chunkArray){
    
    let result = {}

    for (const [key, chunk] of Object.entries(chunkArray)) {
        result[key] = VoxelHelper.getCompressedChunkData(chunk)
    }

    return result 

}

static getCompressedChunkData(chunk){

    return {
        id: chunk.id,
        dims: chunk.dims,
        chunkBits: chunk.chunkBits, 
        chunkPosition: chunk.chunkPosition,
        hash: chunk.hash,
        deltaCounter: chunk.deltaCounter ,
        compressedVoxels: VoxelHelper.compressVoxelArray( chunk.voxels  )
    }
    
}

//todo 
static compressVoxelArray(voxelArray){

    return voxelArray
}

static uncompressVoxelArray(compressedVoxelArray){

    return voxelArray
}


static findDesyncedChunks(localChunks,  actualChunks){
    let result = [] 


    for (const [key, chunk] of Object.entries(localChunks)) {
        console.log(`${key}: ${value}`);

        if(typeof chunk == 'undefined'){
            result.push(chunk.id)
            continue 
        }   

        let actualChunk = actualChunks[chunk.id]

        if(chunk.hash != actualChunk.hash){
            result.push(chunk.id)
            continue 
        }  
        
      }


    return result 
}




static chunkArrayToFingerprints(chunkArray){
    let result = []

    for (const [key, value] of Object.entries(chunkArray)) {
        console.log(`${key}: ${value}`);

        result[key] = VoxelHelper.chunkToFingerprint( value )
      }

     

    return result 
}


static chunkToFingerprint(chunk){

    return {
        hash: hash(chunk.voxels),
        deltaCounter: chunk.deltaCounter, 
        id: chunk.id  
    }

}



}