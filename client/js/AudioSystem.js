import * as THREE from 'three'

var audioLoader
 var listener
 //var soundplayer

 var audiocache = {}



var audiomap = require('../../shared/worlddata/audiomap.json')

export default class AudioSystem   {


 constructor(sceneO)
 {
     listener = new THREE.AudioListener();

     audioLoader = new THREE.AudioLoader();


    // soundplayer = new THREE.Audio( listener );
 }

 getListener()
 {
   return listener;
 }

  async playSound( name )
  {
    var sound = await this.loadSound(name)


     sound.setVolume( 1.0 );
     sound.play()
  }

 async loadSound( name) {

   var cacheid =  (name)

   if(audiocache[cacheid]){
     console.log('loaded audio from cache ',cacheid)
     return audiocache[cacheid]  //need a new id
   }

   var assetpath = this.lookupAssetName( name)

   var filepath = '../assets/sfx/'+assetpath


   return  new Promise ((resolve, reject) => {

     audioLoader.load( filepath, function( buffer ) {

    //   var sound = new THREE.PositionalAudio( listener );

       var sound  = new THREE.Audio( listener );
       sound.setBuffer(buffer)

    //   sound.setRefDistance( 20 );
       //sound.play();

       audiocache[cacheid] = sound;
       resolve(buffer)
     });



   })

 }






 lookupAssetName( name)
 {

     return audiomap[name].path.toString()


 }

/*
 var soundEventData = {
   actionUnit: item,
   soundName: 'warpout'
 }*/

 async playSoundFromEvent(soundEventData)
 {
   var playerUnit = soundEventData.playerUnit;
   var actionUnit = soundEventData.actionUnit;

   var dist = 0

   if( playerUnit && actionUnit   )
   {
     var playerUnitVector = new THREE.Vector3( playerUnit.locationVector.x, playerUnit.locationVector.y, playerUnit.locationVector.z )
     var dist = playerUnitVector.distanceTo(actionUnit)

   }

   var vol = (1.0 - ( dist / 1000 ));

   if (vol < 0){ vol = 0 }

   var soundName = soundEventData.soundName;

   var sound = await this.loadSound(soundName)

   console.log('play sound ', soundEventData)


   if(actionUnit)
   {
     sound.setVolume( 1.0 );
     sound.play()
   }else{
     sound.setVolume( 1.0 );
     sound.play()

   }


 }


 async preloadAssets()
 {

   var sounds = Object.keys(audiomap)

   for(var i in sounds)
   {
     console.log('loading ', sounds[i])
     await this.loadSound( sounds[i] )
   }
    //var name =  ('warpin');


 }

}
