//import * as THREE from 'three';


/*
  Integrated from
  https://github.com/joshmarinacci/voxeljs-next/blob/master/examples/simple.html


*/


const THREE = require('three')


const tileImages = require('../../worlddata/tileimages.json')
const tileTypes = require('../../worlddata/tiletypes.json')

const GreedyMesher = require('./greedymesher')
const CulledMesher = require('./culledmesher')
//import {GreedyMesher} from "../src/GreedyMesher.js"


import {VoxelTextureManager} from './voxeltexturemanager'

import ChunkManager from './chunkmanager'

const VoxelUtils = require('./voxelutils')

const neighborOffsets = [
  [ 0,  0,  0], // self
  [-1,  0,  0], // left
  [ 1,  0,  0], // right
  [ 0, -1,  0], // down
  [ 0,  1,  0], // up
  [ 0,  0, -1], // back
  [ 0,  0,  1], // front
];




export default class VoxelWorld {
  constructor(options) {
    this.worldPivot =  new THREE.Object3D()
  //  this.material = options.material;
    this.chunkSize = options.chunkSize;
    this.tileSize = options.tileSize;
    this.tileTextureWidth = options.tileTextureWidth;
    this.tileTextureHeight = options.tileTextureHeight;
    const {chunkSize} = this;
    this.chunkSliceSize = chunkSize * chunkSize;
    this.cells = {}; // contains the chunks which are each a uint8 flat array

    this.scaleFactor = 5;


    this.cellIdToMesh = {};

    this.renderRequested = false;



    const flatGen = (i,j,k) => {
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

    this.chunkManager = new ChunkManager({
            chunkDistance:1,
            blockSize:1,
            mesher: new GreedyMesher(),
            chunkSize:32,
            //this will come from cache - from server-  when its ready 
            generateVoxelChunk: (low, high, pos) => {
                const id = [pos.x,pos.y,pos.z].join('|')
                return VoxelUtils.generateChunkInfoFromFunction(low, high, flatGen)
            },
            container: new THREE.Group(),
            textureManager: new VoxelTextureManager({aoEnabled:false}),
        }/*,app*/);

      //app.comps.push(app.chunkManager.textureManager)



      const tilesPath = './assets/textures/Tiles/'
      
      let texturesDataArray = tileImages.map(t => {return {id: t.id, src: tilesPath.concat(t.imgurl) } } )
        
      //this comes from TileTypes.json 
      this.chunkManager.textureManager.loadTextures(texturesDataArray).then(()=>{
          this.chunkManager.rebuildAllMeshes()
          this.chunkManager.requestMissingChunks(new THREE.Vector3(0,0,0))
          //app.dialog.setSelectedToDefault()
      })

      //attach the mesh to the scene
      this.worldPivot.add( this.chunkManager.container )


  }
  getWorldPivot(){
    return this.worldPivot
  }
  computeVoxelOffset(x, y, z) {
    const {chunkSize, chunkSliceSize} = this;
    const voxelX = THREE.MathUtils.euclideanModulo(x, chunkSize) | 0;
    const voxelY = THREE.MathUtils.euclideanModulo(y, chunkSize) | 0;
    const voxelZ = THREE.MathUtils.euclideanModulo(z, chunkSize) | 0;
    return voxelY * chunkSliceSize +
           voxelZ * chunkSize +
           voxelX;
  }
  computeCellId(x, y, z) {
    const {chunkSize} = this;
    const cellX = Math.floor(x / chunkSize);
    const cellY = Math.floor(y / chunkSize);
    const cellZ = Math.floor(z / chunkSize);
    return `${cellX},${cellY},${cellZ}`;
  }
  addCellForVoxel(x, y, z) {
    const cellId = this.computeCellId(x, y, z);
    let cell = this.cells[cellId];
    if (!cell) {
      const {chunkSize} = this;
      cell = new Uint8Array(chunkSize * chunkSize * chunkSize);
      this.cells[cellId] = cell;
    }
    return cell;
  }
  getCellFromChunkCoordinates(cellX, cellY, cellZ) {
    let id =  `${cellX},${cellY},${cellZ}`;
    return this.cells[id];
  }
  getCellForVoxel(x, y, z) {
    return this.cells[this.computeCellId(x, y, z)];
  }
  setVoxel(x, y, z, v, addCell = true) {
    let cell = this.getCellForVoxel(x, y, z);
    if (!cell) {
      if (!addCell) {
        return;
      }
      cell = this.addCellForVoxel(x, y, z);
    }
    const voxelOffset = this.computeVoxelOffset(x, y, z);
    cell[voxelOffset] = v;
  }
  getVoxel(x, y, z) {
    const cell = this.getCellForVoxel(x, y, z);
    if (!cell) {
      return 0;
    }
    const voxelOffset = this.computeVoxelOffset(x, y, z);
    return cell[voxelOffset];
  }



  //This is a decent algo but it is not greedy
  generateGeometryDataForCell(cellX, cellY, cellZ) {
    const {chunkSize, tileSize, tileTextureWidth, tileTextureHeight} = this;
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    const startX = cellX * chunkSize;
    const startY = cellY * chunkSize;
    const startZ = cellZ * chunkSize;

    for (let y = 0; y < chunkSize; ++y) {
      const voxelY = startY + y;
      for (let z = 0; z < chunkSize; ++z) {
        const voxelZ = startZ + z;
        for (let x = 0; x < chunkSize; ++x) {
          const voxelX = startX + x;
          const voxel = this.getVoxel(voxelX, voxelY, voxelZ);
          if (voxel) {
            // voxel 0 is sky (empty) so for UVs we start at 0


            // There is a voxel here but do we need faces for it?
            //Iterate over each face
            for (const {dir, corners, uvRow} of VoxelWorld.faces) {
              const neighbor = this.getVoxel(
                  voxelX + dir[0],
                  voxelY + dir[1],
                  voxelZ + dir[2]);
              if (!neighbor) {

                var uvVoxel =  this.getVoxelFaceTextureIndexNumber(voxel, uvRow)  //voxel - 1;
                console.log('meep uvVoxel', uvVoxel, voxel, uvRow)


                let uv_x = Math.floor(uvVoxel % 9);
                let ux_y = Math.floor(uvVoxel / 9);

                // this voxel has no neighbor in this direction so we need a face.
                const ndx = positions.length / 3;
                for (const {pos, uv} of corners) {

                  positions.push(pos[0] + x, pos[1] + y, pos[2] + z);
                  normals.push(...dir);
                  uvs.push(
                        (uv_x +   uv[0]) * tileSize / tileTextureWidth,
                       1 - (ux_y + 1 -   uv[1]) * tileSize / tileTextureHeight);

                }
                indices.push(
                  ndx, ndx + 1, ndx + 2,
                  ndx + 2, ndx + 1, ndx + 3,
                );
              }
            }
          }
        }
      }
    }

    return {
      positions,
      normals,
      uvs,
      indices,
    };
  }


  /*
  Pass in coordinates for the Chunk
  (a cell is the datastorage uint array for a chunk)
  */
  generateGreedyGeometryDataForCell(cellX, cellY, cellZ) {


    //const geometry =  new THREE.BufferGeometry();



    var geometry	= new THREE.Geometry();



    const {chunkSize, tileSize, tileTextureWidth, tileTextureHeight} = this;
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    const startX = cellX * chunkSize;
    const startY = cellY * chunkSize;
    const startZ = cellZ * chunkSize;

    const faceMerged = []


    let flatVoxelArray = this.getCellFromChunkCoordinates(cellX, cellY, cellZ);

    let greedyQuads = GreedyMesh( flatVoxelArray,  [chunkSize,chunkSize,chunkSize] )

    console.log('greedy quads', greedyQuads)

    /*
    geometry.vertices.push(
      new THREE.Vector3(-1, -1,  1),  // 0
      new THREE.Vector3( 1, -1,  1),  // 1
      new THREE.Vector3(-1,  1,  1),  // 2
      new THREE.Vector3( 1,  1,  1),  // 3
      new THREE.Vector3(-1, -1, -1),  // 4
      new THREE.Vector3( 1, -1, -1),  // 5
      new THREE.Vector3(-1,  1, -1),  // 6
      new THREE.Vector3( 1,  1, -1),  // 7
    );

    geometry.faces.push(
      // front
      new THREE.Face3(0, 3, 2),
      new THREE.Face3(0, 1, 3),
      // right
      new THREE.Face3(1, 7, 3),
      new THREE.Face3(1, 5, 7),
      // back
      new THREE.Face3(5, 6, 7),
      new THREE.Face3(5, 4, 6),
      // left
      new THREE.Face3(4, 2, 6),
      new THREE.Face3(4, 0, 2),
      // top
      new THREE.Face3(2, 7, 6),
      new THREE.Face3(2, 3, 7),
      // bottom
      new THREE.Face3(4, 1, 0),
      new THREE.Face3(4, 5, 1),
    );
*/


    for(let vertex of greedyQuads.vertices){

       geometry.vertices.push( new THREE.Vector3(...vertex)  )


    }

    for(let face of greedyQuads.faces){

      let tileTypeId = face[4]

      // face[0..3] are the vertices

        let faceA = new THREE.Face3(face[0],face[1] ,face[3])
        faceA.vertexColors[0] = new THREE.Color( 0xff00ff );
        geometry.faces.push( faceA )

        let faceB = new THREE.Face3(face[1],face[2],face[3])
        faceB.vertexColors[0] = new THREE.Color( 0x0000ff );
        geometry.faces.push( faceB )   //2 tris


        let direction = 0; //1 for bottom ,  2 for top

        var uvVoxel =  this.getVoxelFaceTextureIndexNumber(tileTypeId, direction)

        let uv_x = Math.floor(uvVoxel % 9);
        let uv_y = Math.floor(uvVoxel / 9);

        let cellsAcross = 9
        let cellsDeep = 10

        let coord_x0 = uv_x / cellsAcross
        let coord_y0 = uv_y / cellsDeep
        let coord_x1 = (uv_x+1) / cellsAcross
        let coord_y1 = (uv_y+1) / cellsDeep

        let xm = (coord_x0 + coord_x1) / 2;
        let ym = (coord_y0 + coord_y1) / 2;

        /*const u0 = uv_x / cellsAcross;
        const v0 = ux_y / cellsDeep;
        const u1 = (uv_x + 1) / cellsAcross;
        const v1 = (ux_y + 1) / cellsDeep;
        const um = (u0 + u1) / 2;
        const vm = (v0 + v1) / 2;
            geometry.faceVertexUvs[0].push(
          [ new THREE.Vector2(u0, v0), new THREE.Vector2(xm, ym), new THREE.Vector2(u1, v0) ],
          [ new THREE.Vector2(u1, v0), new THREE.Vector2(xm, ym), new THREE.Vector2(u1, v1) ]
        )*/

        geometry.faceVertexUvs[0].push(
          [ new THREE.Vector2(coord_x0, coord_y0),  new THREE.Vector2(coord_x1, coord_y0), new THREE.Vector2(xm, ym) ],
          [ new THREE.Vector2(coord_x1, coord_y0),  new THREE.Vector2(coord_x1, coord_y1) , new THREE.Vector2(xm, ym)]
        )

    }




    geometry.computeFaceNormals();


    /*
    for (const {dir, corners, uvRow} of VoxelWorld.faces) {


      for (let y = 0; y < chunkSize; ++y) {
        const voxelY = startY + y;
        for (let z = 0; z < chunkSize; ++z) {
          const voxelZ = startZ + z;
          for (let x = 0; x < chunkSize; ++x) {
            const voxelX = startX + x;
            const voxel = this.getVoxel(voxelX, voxelY, voxelZ);
            if (voxel) {
            // voxel 0 is sky (empty) so for UVs we start at 0


            // There is a voxel here but do we need faces for it?
            //Iterate over each face

              const neighbor = this.getVoxel(
                  voxelX + dir[0],
                  voxelY + dir[1],
                  voxelZ + dir[2]);
              if (!neighbor) {

                var uvVoxel =  this.getVoxelFaceTextureIndexNumber(voxel, uvRow)  //voxel - 1;
                console.log('meep uvVoxel', uvVoxel, voxel, uvRow)


                let uv_x = Math.floor(uvVoxel % 9);
                let ux_y = Math.floor(uvVoxel / 9);

                // this voxel has no neighbor in this direction so we need a face.
                const ndx = positions.length / 3;
                for (const {pos, uv} of corners) {

                  positions.push(pos[0] + x, pos[1] + y, pos[2] + z);
                  normals.push(...dir);
                  uvs.push(
                        (uv_x +   uv[0]) * tileSize / tileTextureWidth,
                       1 - (ux_y + 1 -   uv[1]) * tileSize / tileTextureHeight);

                }
                indices.push(
                  ndx, ndx + 1, ndx + 2,
                  ndx + 2, ndx + 1, ndx + 3,
                );
              }
            }
          }
        }
      }
    }

    return {
      positions,
      normals,
      uvs,
      indices,
    };*/


/*
    const positionNumComponents = 3;
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), positionNumComponents));
    const normalNumComponents = 3;
    geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), normalNumComponents));
    const uvNumComponents = 2;
    geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), uvNumComponents));
    geometry.setIndex(indices);
    //geometry.computeBoundingSphere();
*/

    return geometry;


  }


  getVoxelFaceTextureIndexNumber(voxel, uvRow){

    let tileType = tileTypes[voxel]

    if(!tileType){tileType = tileTypes[1]}


    console.log('parse', parseInt(uvRow))

    switch(parseInt(uvRow)){
      case 0: return tileType.side;
      case 1: return tileType.bottom;
      case 2: return tileType.top;
    }
    return tileType.side

  }

    // from
    // http://www.cse.chalmers.se/edu/year/2010/course/TDA361/grid.pdf
    intersectRay(start, end) {
    let dx = end.x - start.x;
    let dy = end.y - start.y;
    let dz = end.z - start.z;
    const lenSq = dx * dx + dy * dy + dz * dz;
    const len = Math.sqrt(lenSq);

    dx /= len;
    dy /= len;
    dz /= len;

    let t = 0.0;
    let ix = Math.floor(start.x);
    let iy = Math.floor(start.y);
    let iz = Math.floor(start.z);

    const stepX = (dx > 0) ? 1 : -1;
    const stepY = (dy > 0) ? 1 : -1;
    const stepZ = (dz > 0) ? 1 : -1;

    const txDelta = Math.abs(1 / dx);
    const tyDelta = Math.abs(1 / dy);
    const tzDelta = Math.abs(1 / dz);

    const xDist = (stepX > 0) ? (ix + 1 - start.x) : (start.x - ix);
    const yDist = (stepY > 0) ? (iy + 1 - start.y) : (start.y - iy);
    const zDist = (stepZ > 0) ? (iz + 1 - start.z) : (start.z - iz);

    // location of nearest voxel boundary, in units of t
    let txMax = (txDelta < Infinity) ? txDelta * xDist : Infinity;
    let tyMax = (tyDelta < Infinity) ? tyDelta * yDist : Infinity;
    let tzMax = (tzDelta < Infinity) ? tzDelta * zDist : Infinity;

    let steppedIndex = -1;

    // main loop along raycast vector
    while (t <= len) {
      const voxel = this.getVoxel(ix, iy, iz);
      if (voxel) {
        return {
          position: [
            start.x + t * dx,
            start.y + t * dy,
            start.z + t * dz,
          ],
          normal: [
            steppedIndex === 0 ? -stepX : 0,
            steppedIndex === 1 ? -stepY : 0,
            steppedIndex === 2 ? -stepZ : 0,
          ],
          voxel,
        };
      }

      // advance t to next nearest voxel boundary
      if (txMax < tyMax) {
        if (txMax < tzMax) {
          ix += stepX;
          t = txMax;
          txMax += txDelta;
          steppedIndex = 0;
        } else {
          iz += stepZ;
          t = tzMax;
          tzMax += tzDelta;
          steppedIndex = 2;
        }
      } else {
        if (tyMax < tzMax) {
          iy += stepY;
          t = tyMax;
          tyMax += tyDelta;
          steppedIndex = 1;
        } else {
          iz += stepZ;
          t = tzMax;
          tzMax += tzDelta;
          steppedIndex = 2;
        }
      }
    }
    return null;
  }



  buildWorld(worldGenerator){
    let worldseed = 0

     worldGenerator.generateChunk( worldseed, 0,0, this.chunkSize, this.setVoxel.bind(this) );



        //needed, but i dont understand
     this.updateVoxelGeometry(1,1,1);
  }






    //the mesh for a chunk
  getUpdatedCellMesh(x, y, z) {
    const cellX = Math.floor(x / this.chunkSize);
    const cellY = Math.floor(y / this.chunkSize);
    const cellZ = Math.floor(z / this.chunkSize);
    const cellId = this.computeCellId(x, y, z);
    let mesh = this.cellIdToMesh[cellId];

    let geometry = this.generateGreedyGeometryDataForCell(cellX, cellY, cellZ);

    let artpacks = {}


    var textureEngine = VoxelTextureShader({
      // a copy of your voxel.js game
      //game: game,

      // path to your textures
      texturePath: '../assets/textures/tiles/'
    });

    textureEngine.load('grass', function(textures) {
      // textures = [grass, grass, grass, grass, grass, grass]
      console.log('tex engine loaded', textures )
    });

     // textureEngine.paint(voxelMesh)



    //this.material
    let customMat =   new THREE.MeshBasicMaterial({
      color: 0xffffff,
      shading: THREE.FlatShading,
      vertexColors: THREE.VertexColors
  });


    if (!mesh) {
      mesh = new THREE.Mesh(geometry, textureEngine.material);
      mesh.name = cellId;
      this.cellIdToMesh[cellId] = mesh;

      mesh.position.set(cellX * this.chunkSize * this.scaleFactor, cellY * this.chunkSize* this.scaleFactor, cellZ * this.chunkSize * this.scaleFactor);

      mesh.scale.set(this.scaleFactor,this.scaleFactor,this.scaleFactor)
    }

    console.log('textureEngine paint')
    textureEngine.paint(mesh)

    return mesh
  }

  /*
  What does this do ?
  */
  updateVoxelGeometry(x, y, z) {
    const updatedCellIds = {};
    for (const offset of neighborOffsets) {
      const ox = x + offset[0];
      const oy = y + offset[1];
      const oz = z + offset[2];
      const cellId = this.computeCellId(ox, oy, oz);
      if (!updatedCellIds[cellId]) {
        updatedCellIds[cellId] = true;
        let newMesh = this.getUpdatedCellMesh(ox, oy, oz);
        console.log('updateVoxelGeometry  ', newMesh )
        this.worldPivot.add(newMesh);
      }
    }
  }


 // updateVoxelGeometry(1, 1, 1);  // 0,0,0 will generate

 /* resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  render() {
    this.renderRequested = undefined;

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    controls.update();
    renderer.render(scene, camera);
  }
  //render();

  requestRenderIfNotRequested() {
    if (!this.renderRequested) {
      this.renderRequested = true;
      requestAnimationFrame(render);
    }
  }*/





  //let currentVoxel = 0;
  //let currentId;

 // document.querySelectorAll('#ui .tiles input[type=radio][name=voxel]').forEach((elem) => {
  //  elem.addEventListener('click', allowUncheck);
 // });

   allowUncheck() {
    if (this.id === currentId) {
      this.checked = false;
      currentId = undefined;
      currentVoxel = 0;
    } else {
      currentId = this.id;
      currentVoxel = parseInt(this.value);
    }
  }

   getCanvasRelativePosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * canvas.width  / rect.width,
      y: (event.clientY - rect.top ) * canvas.height / rect.height,
    };
  }

   placeVoxel(event) {
    const pos = getCanvasRelativePosition(event);
    const x = (pos.x / canvas.width ) *  2 - 1;
    const y = (pos.y / canvas.height) * -2 + 1;  // note we flip Y

    const start = new THREE.Vector3();
    const end = new THREE.Vector3();
    start.setFromMatrixPosition(camera.matrixWorld);
    end.set(x, y, 1).unproject(camera);

    const intersection = world.intersectRay(start, end);
    if (intersection) {
      const voxelId = event.shiftKey ? 0 : currentVoxel;
      // the intersection point is on the face. That means
      // the math imprecision could put us on either side of the face.
      // so go half a normal into the voxel if removing (currentVoxel = 0)
      // our out of the voxel if adding (currentVoxel  > 0)
      const pos = intersection.position.map((v, ndx) => {
        return v + intersection.normal[ndx] * (voxelId > 0 ? 0.5 : -0.5);
      });
      this.setVoxel(...pos, voxelId);
      this.updateVoxelGeometry(...pos);
      this.requestRenderIfNotRequested();
    }
  }





}
const faces = [
  { // left
    uvRow: 0,
    dir: [ -1,  0,  0, ],
    corners: [
      { pos: [ 0, 1, 0 ], uv: [ 0, 1 ], },
      { pos: [ 0, 0, 0 ], uv: [ 0, 0 ], },
      { pos: [ 0, 1, 1 ], uv: [ 1, 1 ], },
      { pos: [ 0, 0, 1 ], uv: [ 1, 0 ], },
    ],
  },
  { // right
    uvRow: 0,
    dir: [  1,  0,  0, ],
    corners: [
      { pos: [ 1, 1, 1 ], uv: [ 0, 1 ], },
      { pos: [ 1, 0, 1 ], uv: [ 0, 0 ], },
      { pos: [ 1, 1, 0 ], uv: [ 1, 1 ], },
      { pos: [ 1, 0, 0 ], uv: [ 1, 0 ], },
    ],
  },
  { // bottom
    uvRow: 1,
    dir: [  0, -1,  0, ],
    corners: [
      { pos: [ 1, 0, 1 ], uv: [ 1, 0 ], },
      { pos: [ 0, 0, 1 ], uv: [ 0, 0 ], },
      { pos: [ 1, 0, 0 ], uv: [ 1, 1 ], },
      { pos: [ 0, 0, 0 ], uv: [ 0, 1 ], },
    ],
  },
  { // top
    uvRow: 2,
    dir: [  0,  1,  0, ],
    corners: [
      { pos: [ 0, 1, 1 ], uv: [ 1, 1 ], },
      { pos: [ 1, 1, 1 ], uv: [ 0, 1 ], },
      { pos: [ 0, 1, 0 ], uv: [ 1, 0 ], },
      { pos: [ 1, 1, 0 ], uv: [ 0, 0 ], },
    ],
  },
  { // back
    uvRow: 0,
    dir: [  0,  0, -1, ],
    corners: [
      { pos: [ 1, 0, 0 ], uv: [ 0, 0 ], },
      { pos: [ 0, 0, 0 ], uv: [ 1, 0 ], },
      { pos: [ 1, 1, 0 ], uv: [ 0, 1 ], },
      { pos: [ 0, 1, 0 ], uv: [ 1, 1 ], },
    ],
  },
  { // front
    uvRow: 0,
    dir: [  0,  0,  1, ],
    corners: [
      { pos: [ 0, 0, 1 ], uv: [ 0, 0 ], },
      { pos: [ 1, 0, 1 ], uv: [ 1, 0 ], },
      { pos: [ 0, 1, 1 ], uv: [ 0, 1 ], },
      { pos: [ 1, 1, 1 ], uv: [ 1, 1 ], },
    ],
  },
];
