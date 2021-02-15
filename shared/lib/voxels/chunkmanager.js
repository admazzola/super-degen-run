import {Vector3,} from "three"
import GreedyMesher from "./greedymesher.js"
import {VoxelMesh} from "./voxelmesh.js"

var hash = require('object-hash');


class Chunk {
    constructor(data, pos, chunkBits) {
        //this.data = data //wasteful of memory 
        this.dims = data.dims
        this.voxels = data.voxels
        this.vmesh = null
        this.surfaceMesh = null
        this.realPosition = pos
        this.chunkPosition = [pos.x, pos.y, pos.z]
        this.id = this.chunkPosition.join('|')
        this.chunkBits = chunkBits

        this.deltaCounter = 0 
        this.deltas = [] 
    }

  

    voxelIndexFromCoordinates(x, y, z) {
        const bits = this.chunkBits
        const mask = (1 << bits) - 1
        return (x & mask) + ((y & mask) << bits) + ((z & mask) << bits * 2)
    }

    voxelAtCoordinates(pt) {
        const vidx = this.voxelIndexFromCoordinates(pt.x, pt.y, pt.z)
        return this.voxels[vidx]
    }
    setVoxelAtCoordinates(pt, val) {
        const vidx = this.voxelIndexFromCoordinates(pt.x, pt.y, pt.z)
        const v = this.voxels[vidx]
        this.voxels[vidx] = val
        return v
    }

    dispose() {
        if (this.vmesh) {
            delete this.vmesh.data
            delete this.vmesh.geometry
            delete this.vmesh.meshed
            delete this.vmesh.surfaceMesh
        }
    }
}

const SCALE = new Vector3(0.2,0.2,0.2) //change me later 

//const WORLDBOUNDS  = [4096, 512 ,4096]
 
const WORLDBOUNDS  = [512, 512 ,512]


export default class ChunkManager {
    constructor(opts) {
        this.listeners = {}
        this.container = opts.container
        this.distance = opts.chunkDistance || 2
        this.chunkSize = opts.chunkSize || 32
        this.blockSize = opts.blockSize || 1
        this.generateVoxelChunk = opts.generateVoxelChunk
        this.chunks = {}
        this.mesher = opts.mesher || new GreedyMesher()
        this.textureManager = opts.textureManager

        this.chunkBounds = WORLDBOUNDS.map(b => Math.floor(b/this.blockSize))

        if (this.chunkSize & this.chunkSize - 1 !== 0)
            throw new Error('chunkSize must be a power of 2')
        if (!this.textureManager)
            throw new Error("missing texture manager")

        //TODO: count the number of bits wide the chunksize is. seems like we could just use Math.log()
        //ex: if chunksize is 16 the bits is 4
        //I think bits is just used for efficient multiplication and division.
        //2^chunkbits = chunksize 
        let bits = 0
        for (let size = this.chunkSize; size > 0; size >>= 1) bits++;
        this.chunkBits = bits - 1;

        //this.CHUNK_CACHE = {}
    }

    static getChunkId( chunkCoords ){
        return [chunkCoords.x,chunkCoords.y,chunkCoords.z].join('|')
    }

    findChunkById( id ){
        return this.chunks[id]
    }

      //for easily comparing for changes between server and client .. to know if we desync
      static getChunkHash(chunk){
        return  hash( chunk.voxels ) 
      }

    static getBitsFromChunkSize(chunkSize){
        return Math.log(chunkSize*2)/Math.log(2)
    }

    static getChunkSizeFromBits(bits){
        return Math.pow(2,bits-1)
    }

    getChunksArray(chunkIndices){
        let result =  {} 

        for (let pos of chunkIndices){

             const id = [pos[0],pos[1],pos[2]].join('|')

            let chunk = this.chunks[id]
 
            result[id] = chunk
        }

        return result 
    }

    on(type, cb) {
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].push(cb)
    }
    emit(type,evt) {
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].forEach(cb => cb(evt))
    }

    clear() {
        Object.keys(this.chunks).forEach(key => {
            const chunk = this.chunks[key]
            this.container.remove(chunk.surfaceMesh)
            chunk.surfaceMesh.geometry.dispose()
     //       this.CHUNK_CACHE[chunk.id] = chunk.data
            chunk.dispose()
        })
        this.chunks = {}
    }

    chunkCoordsWithinWorldBounds(chunkCoords){
        return chunkCoords[0] >= (-1*this.chunkBounds[0] ) && 
                chunkCoords[0] <= (1*this.chunkBounds[0] ) && 
                chunkCoords[1] >= (-1*this.chunkBounds[1] ) && 
                chunkCoords[1] <= (1*this.chunkBounds[1] ) && 
                chunkCoords[2] >= (-1*this.chunkBounds[2] ) && 
                chunkCoords[2] <= (1*this.chunkBounds[2] )    

    }


    // position is world coords, distance is number of chunks 
    nearbyChunks(position, distance) {
        const current = this.chunkAtPosition(position)
        const x = current[0]
        const y = current[1]
        const z = current[2]
        const dist = distance || this.distance
        const nearby = []
        for (let cx = (x - dist); cx !== (x + dist); ++cx) {
            for (let cy = (y - dist); cy !== (y + dist); ++cy) {
                for (let cz = (z - dist); cz !== (z + dist); ++cz) {
                    nearby.push([cx, cy, cz])
                }
            }
        }
        return nearby
    }

    chunksWithinBounds( ) {
        const result = []
        for (let cx = (-1 * WORLDBOUNDS[0]/this.chunkSize); cx < (1 * WORLDBOUNDS[0]/this.chunkSize); ++cx) {
            for (let cy = (-1 * WORLDBOUNDS[1]/this.chunkSize); cy < (1 * WORLDBOUNDS[1]/this.chunkSize); ++cy) {
                for (let cz = (-1 * WORLDBOUNDS[2]/this.chunkSize); cz < (1 * WORLDBOUNDS[2]/this.chunkSize); ++cz) {
                    result.push([cx, cy, cz])
                }
            }
        }
        return result
    }

    
    //only for testing 
   /* buildChunkMeshesNearPosition(pos,distance) {
        this.nearbyChunks(pos,distance).map((chunkIndex) => {
            if (!this.chunks[chunkIndex.join('|')]) {
                this.rebuildMesh(this.generateChunk(
                    new Vector3(chunkIndex[0],chunkIndex[1],chunkIndex[2])))
            }
        })
    }*/

    //  position is in world coords, distance is in number of chunks 
    //used by the server 
    generateChunksNearPosition(pos,distance) {  
        this.generateChunks( this.nearbyChunks(pos,distance) )
    }

    generateChunksWithinBounds() {  
        this.generateChunks( this.chunksWithinBounds() )
    }

    generateChunks(chunkIndexArray) {
        chunkIndexArray.map((chunkIndex) => {
            if (!this.chunks[chunkIndex.join('|')]) {
                this.generateChunk(
                    new Vector3(chunkIndex[0],chunkIndex[1],chunkIndex[2]))
            }
        })
    }

    /*
    Input is chunk coords, output is voxel coords 
    */
    getBounds(x, y, z) {
        const bits = this.chunkBits
        const low = [x << bits, y << bits, z << bits]
        const high = [(x + 1) << bits, (y + 1) << bits, (z + 1) << bits]
        return [low, high]
    }

    //make a chunk at the position in chunk coords
    generateChunk(pos) {
        const bounds = this.getBounds(pos.x, pos.y, pos.z)
        const id = [pos.x,pos.y,pos.z].join('|')
        let chunkData
        //if(this.CHUNK_CACHE[id]) {
       //     chunkData = this.CHUNK_CACHE[id]
        //} else {
            chunkData = this.generateVoxelChunk(bounds[0], bounds[1], pos, this.chunkSize)
        //}
        const chunkObj = new Chunk(chunkData, pos, this.chunkBits)
        this.chunks[chunkObj.id] = chunkObj
        return chunkObj
    }

    makeChunkFromData(info ) {
        console.log('make chunk from data', Object.keys(info))

        const pos = new Vector3(info.chunkPosition[0],info.chunkPosition[1],info.chunkPosition[2])
        const chunkData = {
            low:info.low,
            high:info.high,
            voxels:info.voxels,
            dims:info.dims,
        }
        const chunk = new Chunk(chunkData, pos, this.chunkBits)
        chunk.deltaCounter = info.deltaCounter

        this.chunks[chunk.id] = chunk
        return chunk
    }

    static getWorldBounds(){
        return WORLDBOUNDS
    }

    chunkIndexAtCoordinates(x, y, z) {
        const bits = this.chunkBits
        const cx = x >> bits
        const cy = y >> bits
        const cz = z >> bits
        return [cx, cy, cz];
    }

    //position in world coords
    chunkAtPosition(position) {
        const pt = position.divideScalar(this.blockSize).floor()
        return this.chunkIndexAtCoordinates(pt.x, pt.y, pt.z)
    }

    voxelIndexFromCoordinates(x, y, z) {
        const bits = this.chunkBits
        const mask = (1 << bits) - 1
        return (x & mask) + ((y & mask) << bits) + ((z & mask) << bits * 2)
    }

    //get voxel at point in world space
    voxelAtCoordinates(pt) {
        const ckey = this.chunkIndexAtCoordinates(pt.x, pt.y, pt.z).join('|')
        const chunk = this.chunks[ckey]
        if (!chunk) return false
        return chunk.voxelAtCoordinates(pt)
    }

    setVoxelAtCoordinates(pt, val) {
        const ckey = this.chunkIndexAtCoordinates(pt.x, pt.y, pt.z).join('|')
        const chunk = this.chunks[ckey]
        if (!chunk) return false
        const ret = chunk.setVoxelAtCoordinates(pt,val)
        this.rebuildMesh(chunk)
        return ret
    }

    setBlockRange(pos, dim, data) {
        pos.floor()
        const ckey = this.chunkIndexAtCoordinates(pos.x, pos.y, pos.z).join('|')
        const chunk = this.chunks[ckey]
        const pt = pos.clone()
        if(chunk) {
            for(let y=0; y<dim.y; y++) {
                for(let z=0; z<dim.z; z++) {
                    for(let x=0; x<dim.x; x++) {
                        const n = x + z*dim.x + y*dim.x*dim.z
                        const val = data[n]
                        pt.x = pos.x + x
                        pt.y = pos.y + y
                        pt.z = pos.z + z
                        if(val !== -1) this.setVoxelAtCoordinates(pt, val)
                    }
                }
            }
            this.rebuildMesh(chunk)
        }
    }

    //get voxel at position in world coordinates
    voxelAtPosition(pos, val) {
        return this.voxelAtCoordinates(pos.divideScalar(this.blockSize).floor(),val)
    }

    //report the number of chunks currently loaded into memory
    debug_getChunksLoadedCount() {
        return Object.keys(this.chunks).length
    }

    /**
     * remove chunks that are too far away
     * _pos_ is the center of the chunks to look at
     * _group_ is the ThreeJS group that the chunks are stored in
     */
    removeFarChunks(pos) {
        const nearbyChunks = this.nearbyChunks(pos,this.distance+1).map(chunkPos => chunkPos.join('|'))
        Object.keys(this.chunks).map((chunkIndex) => {
            //skip the nearby chunks
            if (nearbyChunks.indexOf(chunkIndex) > -1) return

            const chunk = this.chunks[chunkIndex]
            if (!chunk) return
            this.container.remove(chunk.surfaceMesh)
            chunk.surfaceMesh.geometry.dispose()
          //  this.CHUNK_CACHE[chunk.id] = chunk.data
            chunk.dispose()
            delete this.chunks[chunkIndex]
        })
    }

    getBlock(x,y,z) {
        return this.voxelAtPosition(new Vector3(x,y,z))
    }

    rebuildMesh(chunk) {

        if(!this.chunkCoordsWithinWorldBounds(chunk.chunkPosition)){
            console.error('Warn: Tried to build out-of-bounds chunk')
            return
        }

        if(chunk.surfaceMesh) this.container.remove(chunk.surfaceMesh)
        chunk.surfaceMesh = new VoxelMesh(chunk, this.mesher, SCALE, this)
            .createSurfaceMesh(this.textureManager.material)
        this.container.add(chunk.surfaceMesh)
        const pos = chunk.realPosition.clone().multiplyScalar(this.chunkSize)
        chunk.surfaceMesh.position.copy(pos)
    }
    rebuildAllMeshes() {
        Object.keys(this.chunks).forEach(key => this.rebuildMesh(this.chunks[key]))
    }

    //this frees up memory 
    updateCenterPosition(pos) {
        this.requestMissingChunks(pos)
        // and remove the chunks that might be out of range now
        this.removeFarChunks(pos, this.container)
    }
}
