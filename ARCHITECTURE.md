## Crypto Pompeii 
 
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