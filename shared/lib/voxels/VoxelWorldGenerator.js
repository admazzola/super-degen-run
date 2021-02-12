  
var SimplexNoise = require('simplex-noise')

const tiletypes = require('../../worlddata/tiletypes.json')

import ChunkManager from './chunkmanager'

export default class VoxelWorldGenerator {
   
  constructor(){
    this.builtNoiseMaps = false 
  }

  buildNoiseMaps(worldseed){

    this.worldseed=worldseed
    this.simplex = new SimplexNoise(worldseed) 

   /* this.noiseMaps = {
      base: this.simplex.noise2D(x,z)
       

    }*/

    this.builtNoiseMaps = true 
  }

  getBiomeTypeForChunk(worldseed, chunkX, chunkZ){
      return 0
  } 



  getTilesForChunk( lowBounds,highBounds  ){
    if(!this.builtNoiseMaps){
      this.buildNoiseMaps(0)
      console.error('Warn: noise maps not prebuilt')
    }
  

    /*let output = new Uint8Array(  chunkSize * chunkSize * chunkSize    )


    for (let y = 0; y < chunkSize; ++y) {
      for (let z = 0; z < chunkSize; ++z) {
        for (let x = 0; x < chunkSize; ++x) {

 
          var noiseOutput = 15 + Math.abs( simplex.noise2D(x,z) ) * 2 ;

          let index = x + chunkSize*y + chunkSize*chunkSize*z

         // const height = (Math.sin(x / chunkSize * Math.PI * 2) + Math.sin(z / chunkSize * Math.PI * 3)) * (chunkSize / 6) + (chunkSize / 2);
          if (y <   (noiseOutput)) {
            output[index] = this.randInt(1, 1);
          }
        }
      }
    }*/
    console.log('generateChunk '   )

    const worldBounds = ChunkManager.getWorldBounds()


    let dimensions = [ highBounds[0]-lowBounds[0], highBounds[1]-lowBounds[1], highBounds[2]-lowBounds[2] ]
    
    let voxelsArray = new Int32Array(dimensions[0]*dimensions[1]*dimensions[2])


    for (let y = lowBounds[1]; y < highBounds[1]; ++y) {
      for (let z = lowBounds[2]; z < highBounds[2]; ++z) {
        for (let x = lowBounds[0]; x < highBounds[0]; ++x) {

          var dirtThreshold = 5 +  ( this.simplex.noise2D(x/50,z/50) ) * 15 ;

          let index = x + dimensions[0]*y + dimensions[0]*dimensions[1]*z
          
           //impenetrable greystone at bottom 
           if (y < -1*worldBounds[1] + 10 + this.simplex.noise2D(x,z)) { 
            voxelsArray[index] = ( this.findTileIdByName('greystone').id )
            continue
          }

          if (y <   (dirtThreshold)) { 
            voxelsArray[index] = ( this.findTileIdByName('dirt').id )
            continue
          }

         

          voxelsArray[index] = 0//( this.findTileIdByName('air').id )
          continue
 
        }
      }
    }
     
    return {voxelsArray,dimensions} 


  }
  
  
  generateChunkInfo(lowBounds, highBounds, chunkCoords, chunkSize ){

    const id = ChunkManager.getChunkId( chunkCoords  )
  

    console.log('generateChunkInfo ', id   )

    const {voxelsArray,dimensions} = this.getTilesForChunk(lowBounds, highBounds)
     

      return {
        chunkId: id,
        low:lowBounds,
        high:highBounds,
        voxels:voxelsArray,
        dims:dimensions,
    };


  }

  findTileIdByName(name){
    let tiletypesarray = Object.values(tiletypes)

    for(let type of tiletypesarray){
      if(type.name == name){
        return type
      }

    }

    console.error('Warn: Could not find tile ', name)
    return tiletypesarray[0]
  }



  randInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  }


   /* const flatGen = (i,j,k) => {
           //an gap in the floor made of air
           // if(j <1 && k < -5 && k > -10 ) return 0
           //the floor is brick, from depth 0 to -10
           if(j < 1 && j > -10) return 1

           //move back 10
           k+=20
           // a dome
           if((i*i + j*j + k*k) < 80) {
               return 2
           }
           //nothing else in the world
           return 0
       }
       
       
export function generateChunkInfoFromFunction(l, h, f) {
    let d = [ h[0]-l[0], h[1]-l[1], h[2]-l[2] ]
    let v = new Int32Array(d[0]*d[1]*d[2])
    let n = 0;
    for(let k=l[2]; k<h[2]; ++k)
        for(let j=l[1]; j<h[1]; ++j)
            for(let i=l[0]; i<h[0]; ++i, ++n) {
                v[n] = f(i,j,k);
            }
    return {
        low:l,
        high:h,
        voxels:v,
        dims:d,
    };
}


*/





}
