
var hash = require('object-hash');

var LZUTF8 = require('lzutf8');

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
        chunkId: chunk.chunkId,
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
        chunkId: chunk.chunkId,
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
    console.log("comp vox ", compressedVoxelArray)


    let uArray =   LZUTF8.decompress(compressedVoxelArray ,{inputEncoding: "Buffer" , outputEncoding: 'ByteArray'});
     
    //need to make it an object ? 

    let voxels = {}
    let i = 0;

    for(let i in uArray){ 
        voxels[i] = uArray[i]
    }

    console.log("decomp vox ", voxels)

    return voxels
}


static findDesyncedChunks(localChunks,  actualChunks){
    let result = [] 


    for (const [key, chunk] of Object.entries(localChunks)) {
        console.log(`${key}: ${chunk}`);

        if(typeof chunk == 'undefined' || chunk == null){
            result.push( key )
            continue 
        }   

        let actualChunk = actualChunks[ key ]

        if(  chunk.hash != actualChunk.hash){
            result.push( key )
            continue 
        }  
        
      }


    return result 
}




static chunkArrayToFingerprints(chunkArray){
    let result = {}

    

    for (const [key, value] of Object.entries(chunkArray)) {
        console.log(`${key}: ${value}`);

        result[key] = VoxelHelper.chunkToFingerprint( value )
      }

     

    return result 
}


static chunkToFingerprint(chunk){

    if(typeof chunk == 'undefined'){
        return null
    }


    return {
        hash: hash(chunk.voxels),
        deltaCounter: chunk.deltaCounter, 
        id: chunk.id  
    }

}



//SERVER ONLY 
static async readChunksFromDatabase(chunkKeys, mongoInterface){
    let chunkArray = {}

    for (let key of chunkKeys) {

        console.log('read chunk with key', key.toString()) 

        ///not working !? 
        let chunk =  await mongoInterface.findOne('chunks', {'chunkId': '-1|0|0'})

         console.log('read chunk from db', chunk.chunkId, Object.keys(chunk) ) 

        chunkArray[key] = chunk 

    }

    return chunkArray

}


}