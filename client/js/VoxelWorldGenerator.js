  
var SimplexNoise = require('simplex-noise')

export default class VoxelWorldGenerator {
   
  
  
  
  generateWorld(worldseed, cellSize, setVoxelCallback ){

    var simplex = new SimplexNoise(worldseed);
     

    this.cellSize = cellSize
 

    for (let y = 0; y < this.cellSize; ++y) {
      for (let z = 0; z < this.cellSize; ++z) {
        for (let x = 0; x < this.cellSize; ++x) {

          var noiseOutput = 15 + Math.abs( simplex.noise2D(x,z) ) * 2 ;


          const height = (Math.sin(x / this.cellSize * Math.PI * 2) + Math.sin(z / this.cellSize * Math.PI * 3)) * (this.cellSize / 6) + (this.cellSize / 2);
          if (y <   (noiseOutput)) {
            setVoxelCallback(x, y, z, this.randInt(1, 4));
          }
        }
      }
    }
     


  }



  randInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  }



}
