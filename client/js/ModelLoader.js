 
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

   var assetData = this.lookupAssetByName( name)

   var modelfilepath = '../assets/'+assetData.model.toString()
   var texturefilepath = '../assets/'+assetData.texture.toString()


   const texture = new THREE.TextureLoader().load( texturefilepath );


  console.log('loading', modelfilepath)
   return new Promise ((resolve, reject) => {

     /*loader.load(filepath, function ( gltf ) {
       modelcache[cacheid]= gltf.scene
       resolve( gltf.scene )
     }.bind(this), undefined, function ( error ) {
       console.error( error );
       reject(error)
     } );*/


     loader.load( modelfilepath , function ( object ) {

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


 lookupAssetByName( name)
 {
 
     return modelsmap[name] 


 }


 async preloadAssets()
 {
   for(var i in preloadedAssets)
   {
     await this.loadModel( preloadedAssets[i] )
   }


 }

}
