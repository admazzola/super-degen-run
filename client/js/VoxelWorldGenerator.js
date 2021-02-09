  


export default class VoxelWorldGenerator {
   
  
  
  
  generateWorld(cellSize, setVoxelCallback ){

    this.cellSize = cellSize
 

    for (let y = 0; y < this.cellSize; ++y) {
      for (let z = 0; z < this.cellSize; ++z) {
        for (let x = 0; x < this.cellSize; ++x) {
          const height = (Math.sin(x / this.cellSize * Math.PI * 2) + Math.sin(z / this.cellSize * Math.PI * 3)) * (this.cellSize / 6) + (this.cellSize / 2);
          if (y < height) {
            setVoxelCallback(x, y, z, this.randInt(1, 17));
          }
        }
      }
    }
     


  }



  randInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  }



}
