 
import * as THREE from 'three'


//import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

var modelcache = {}
var loader

var modelsmap = require('../../shared/worlddata/modelsmap.json')
const preloadedAssets = [ "humanA" ]


export default class ModelLoader   {


 constructor()
 {
   loader = new FBXLoader();

 }


 async loadModel( name) {

   var cacheid =  (name)

   if(modelcache[cacheid]){

     var existing =  modelcache[cacheid].clone() //need a new id
        console.log('loaded model from cache ',cacheid, existing)

     return existing
   }

   var assetpath = this.lookupAssetName( name)

   var filepath = '../assets/'+assetpath


  const texture = new THREE.TextureLoader().load( '../assets/'+'/character/Skins/survivorMaleB.png' );


  console.log('loading', filepath)
   return new Promise ((resolve, reject) => {

     /*loader.load(filepath, function ( gltf ) {
       modelcache[cacheid]= gltf.scene
       resolve( gltf.scene )
     }.bind(this), undefined, function ( error ) {
       console.error( error );
       reject(error)
     } );*/


     loader.load( filepath , function ( object ) {

     //let mixer = new THREE.AnimationMixer( object );

     // const action = mixer.clipAction( object.animations[ 0 ] );
     // action.play();

      object.traverse( function ( child ) {

        if ( child.isMesh ) {

          child.castShadow = false;
          child.receiveShadow = false;
          child.material.map = texture 
         
          

        }

      } );

      resolve( object ) 

    } );


   })

 }


 lookupAssetName( name)
 {
   console.log('map', modelsmap, name)
     return modelsmap[name].model.toString()


 }


 async preloadAssets()
 {
   for(var i in preloadedAssets)
   {
     await this.loadModel( preloadedAssets[i] )
   }


 }

}
