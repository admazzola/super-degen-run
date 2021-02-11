  
var SimplexNoise = require('simplex-noise')

export default class VoxelWorldGenerator {
   


  getBiomeTypeForChunk(worldseed, chunkX, chunkZ){
      return 0
  } 



  getTilesForChunk(worldseed, chunkX, chunkZ, chunkSize  ){


    var simplex = new SimplexNoise(worldseed);
     

    let output = new Uint8Array(  chunkSize * chunkSize * chunkSize    )


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
    }
     
    return output 


  }
  
  
  generateChunk(worldseed, chunkX, chunkZ, chunkSize, setVoxelCallback ){


    let tilesArray = this.getTilesForChunk(worldseed, chunkX, chunkZ, chunkSize)

    console.log('tilesArray', tilesArray   )


    for (let y = 0; y < chunkSize; ++y) {
      for (let z = 0; z < chunkSize; ++z) {
        for (let x = 0; x < chunkSize; ++x) {


          let index = x + chunkSize*y + chunkSize*chunkSize*z
 
           setVoxelCallback(x, y, z, tilesArray[index]);
 
        }
      }
    }
     


  }



  randInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  }



}
