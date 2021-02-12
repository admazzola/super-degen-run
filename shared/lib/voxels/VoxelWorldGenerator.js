  
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
  
  
  generateChunkInfo(worldseed, lowBounds, highBounds, chunkCoords, chunkSize ){

    const id = [chunkCoords.x,chunkCoords.y,chunkCoords.z].join('|')

    var simplex = new SimplexNoise(worldseed);

    let dimensions = [ highBounds[0]-lowBounds[0], highBounds[1]-lowBounds[1], highBounds[2]-lowBounds[2] ]
    let voxelsArray = new Int32Array(dimensions[0]*dimensions[1]*dimensions[2])

    //let tilesArray = this.getTilesForChunk(worldseed, chunkCoords, chunkSize)
    //gen noise maps here 

    console.log('generateChunkInfo ', id   )


    for (let y = lowBounds[1]; y < highBounds[1]; ++y) {
      for (let z = lowBounds[2]; z < highBounds[2]; ++z) {
        for (let x = lowBounds[0]; x < highBounds[0]; ++x) {


          let index = x + chunkSize*y + chunkSize*chunkSize*z
 
           
 
        }
      }
    }
     

      return {
        chunkId: id,
        low:lowBounds,
        high:highBounds,
        voxels:voxelsArray,
        dims:dimensions,
    };


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
