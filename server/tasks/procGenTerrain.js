
const mongoInterface = require('../src/lib/mongo-interface')
 

async function task()
{
    console.log('start task - proc gen terrain')

    let serverMode = 'production'

    mongoInterface.init( 'polyvoxels_'.concat(serverMode) )

    //Do not overwrite chunks that already exist 

    let dims = {x:64, y:64, z:64}

    for(let x= -dims.x; x <= dims.x; x++){
        for(let y= -dims.y; x <= dims.y; y++){
            for(let z= -dims.z; z <= dims.z; z++){

                let chunkId = ''
                
                let voxelArray = this.genChunkVoxels( )

                let existingChunkData = await this.mongoInterface.findOne('chunks',{'chunkId':chunkId})

            }
        }
    }


}

task()
