import * as THREE from 'three'

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

var modelcache = {}
var loader

var modelsmap = require('../../shared/worlddata/modelsmap.json')
const preloadedAssets = ['warpgateA','stationC']


export default class ModelLoader   {


 constructor()
 {
   loader = new GLTFLoader();

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

  console.log(filepath)
   return new Promise ((resolve, reject) => {

     loader.load(filepath, function ( gltf ) {
       modelcache[cacheid]= gltf.scene
       resolve( gltf.scene )
     }.bind(this), undefined, function ( error ) {
       console.error( error );
       reject(error)
     } );


   })

 }


 lookupAssetName( name)
 {
   console.log('map', modelsmap, name)
     return modelsmap[name].modelpath.toString()


 }


 async preloadAssets()
 {
   for(var i in preloadedAssets)
   {
     await this.loadModel( preloadedAssets[i] )
   }


 }

}
