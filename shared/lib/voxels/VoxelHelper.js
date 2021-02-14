
var hash = require('object-hash');


export default class VoxelHelper{
    

getCompressedChunkArray(chunkArray){
    
    let result = {}

    for (const [key, chunk] of Object.entries(localChunks)) {
        result[key] = VoxelHelper.getCompressedChunkData(chunk)
    }

    return result 

}

getCompressedChunkData(chunk){

    return {
        id: chunk.id,
        dims: chunk.dims,
        chunkBits: chunk.chunkBits, 
        chunkPosition: chunk.chunkPosition,
        hash: chunk.hash,
        deltaCounter: chunk.deltaCounter 
        compressedVoxels: VoxelHelper.compressVoxelArray( chunk.voxels  )
    }
    
}

//todo 
compressVoxelArray(voxelArray){

    return voxelArray
}

uncompressVoxelArray(compressedVoxelArray){

    return voxelArray
}


findDesyncedChunks(localChunks,  actualChunks){
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




chunkArrayToFingerprints(chunkArray){
    let result = []

    for (const [key, value] of Object.entries(chunkArray)) {
        console.log(`${key}: ${value}`);

        result[key] = VoxelHelper.chunkToFingerprint( value )
      }

     

    return result 
}


chunkToFingerprint(chunk){

    return {
        hash: hash(chunk.voxels),
        deltaCounter: chunk.deltaCounter, 
        id: chunk.id  
    }

}



}