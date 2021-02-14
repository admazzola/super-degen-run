
 import * as THREE from 'three'

 import VoxelHelper from '../../shared/lib/voxels/VoxelHelper'

export default class VoxelReader {

 

    constructor(voxelWorld, entityManager, clientConnection){
      this.entityManager = entityManager
      this.clientConnection = clientConnection  
      this.voxelWorld = voxelWorld

      let updater = setInterval(this.update.bind(this),1000)
    }

    /*

    */
    update(){
        //get my possessed unit position from entityManager 

        let myPossessedUnit = this.entityManager.getMyPossessedUnit()
        
        if(!myPossessedUnit) return 

       
         let locationVector = new THREE.Vector3( myPossessedUnit.locationVector ) 


        //make sure I know about the chunks that are near me 
        let nearbyChunkIndices = this.voxelWorld.chunkManager.nearbyChunks( locationVector , 2  ) 
        console.log('nearbyChunkIndices', nearbyChunkIndices)

        let nearbyLocalChunks = this.voxelWorld.chunkManager.getChunksArray(nearbyChunkIndices)
        //figure out if we know about these chunks (and have non-stale versions) 

        //if they are stale, request them from the server (or request the deltas we are missing.. each delta adds a 'deltaCounter' to a chunk ) 
        let nearbyLocalChunksFingerprints = VoxelHelper.chunkArrayToFingerprints(this.voxelWorld.chunkManager.getChunksArray )

        console.log('nearbyLocalChunksFingerprints',nearbyLocalChunksFingerprints)

        this.clientConnection.requestNearbyChunkState(locationVector,  nearbyLocalChunksFingerprints)


    } 

}   