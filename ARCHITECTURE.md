## Crypto Pompeii 
 
TODO

-chunks are not being produced in the Z direction?  They are being produced but not attached or rendered.. 


- server needs to do worldgen
- Client loads in and realizes it doesnt have data for nearby chunks - it will ask the server for them [array of chunk Ids]
- THe server will respond to the request for those chunks' data and will send it to the client 

  
- add physics (gridupdater) and walking around [ray tracing]

  
- in the game, changes to chunk tiles are broadcasted as deltas.  They use GameTicks (turn based architecture).   If a players version of a chunk drops out of sync (use fingerprints, blockchain, like GVM... more than 10 ticks) then the client asks the server for the updated data for that chunk 

Chunks have checkpoints + deltas. Similar to GVM . 

Server will store chunkdata in mongo, will keep a local copy for physics  [keeps copies in memory for physics - copies also have GameTick numbers and hashe on them to check for desyncs with the MongoDB which is the master ]


## CHUNKS
Chunktiles are a uint8 array of 64x64x64 
Compress into a buffer to send over the wire https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array 

Compression: https://www.npmjs.com/package/voxel-crunch , https://github.com/maxogden/voxel-server/blob/master/index.js

Storage on disc:   Mongo table 'chunks': { chunkId: '', voxelArray: [] , voxelArrayHash: '' }   



* when a player tries to set a block, that is relayed to everyone 
* hash of a chunk per ServerTick is checked every so often to see if client/server are out of sync 


* Players only load chunks that are nearby 
* Players can remove/add blocks for chunks 



* If you have a special access token, you can log into the server as a player and see other players (max of 256) 

* If you do not, you can view the state of the world but cannot see other players 






1. Server need to generate the tiledata for all chunks (on demand), store it in mongo   (Base terrain will be totally deterministic!! Server just tells client of chunk data if it has been modified from default.  )
2. Server will give blocks tiledata 



** THe world willl be split up into many different zones.  Each zone is like a grid and it will have 64x64 chunks.  You cannot see other players who are not in your chunk, and you cannot see cube changes that they make.   

** zones can be very large if I desire 

* do not store player psn in mongo !! that will be in memory 


#### Servers 
- There will be 1 auth server that gives people tokens, stores them in redis
- There will be ZoneServers which 

Each zoneserver will have a max player cap and a queue (like squad/wow) 

Gridupdater server will run the mob AI+physics (dont worry about that rn) 

* add a WoW targetting system as opposed to the minecraft system (later -- for dungeons ) 


* every tick, server broadcasts array of entities in the phase


* OPTION: Group players together into phases  (players in a pocket far away are put into a different phase !)
