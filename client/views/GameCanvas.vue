<template>
  <div class="relative">
    <div v-if="!connected" class="p-12 text-centered"> Connecting to server... </div>

        <div  id="gamecanvas"  >


        </div>

 

          
          <RightClickMenu
          ref="rclickmenu"
          v-bind:commandCallback="handleClientCommand"
          />

          <ItemActionMenu
          ref="itemactionmenu"
          v-bind:localActionCallback="handleLocalActionCommand"
          v-bind:dataRequestCallback="handleClientDataRequest"
          />

           
  </div>
</template>


<script>
import * as THREE from 'three'

import VoxelWorld from '../js/VoxelWorld'
import VoxelWorldGenerator from '../js/VoxelWorldGenerator'
//const VoxelWorld = require('../js/VoxelWorld')

 import * as MW from '../js/meshwalk';
 MW.install( THREE );


 //import * as dat from 'dat.gui';
 //const gui = new dat.GUI();


const clock = new THREE.Clock();

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

require('../js/OrbitControls')
import Stats from 'stats.js'

const delay = require('delay')

import SkyBox from '../js/SkyBox'
import EntityManager from '../js/EntityManager'
import WorldHelper from '../../shared/lib/WorldHelper'
import EthereumHelper from '../../shared/lib/EthereumHelper'
import Player from '../js/Player'
import ModelLoader from '../js/ModelLoader'
import AudioSystem from '../js/AudioSystem'
import ClientConnection from '../js/ClientConnection'

import StationPanel from './station/StationPanel'
import OverviewPanel from './OverviewPanel'
import RightClickMenu from './RightClickMenu'
import ItemActionMenu from './ItemActionMenu'
import ShipHud from './ShipHud'

import UnitHelper from '../../shared/lib/UnitHelper'

var clientConnection = new ClientConnection()
var entityManager;
var audioSystem;
var player;

var mouse = new THREE.Vector2();
var raycaster = new THREE.Raycaster();

var loader;

 var camera_pivot = new THREE.Object3D()


export default {
  name: 'GameCanvas',
  data() {
    return {
      assetsLoaded: false,
      renderer: null,
      scene: null,
      camera: null,
      controls: null,
      rect: null,
      connected: false,
      rightClickTargetData: {}
    }
  },
  components: {
      RightClickMenu,  ItemActionMenu
  },

  methods: {
    startGameClient: async function() {

      while(!this.assetsLoaded && typeof entityManager == 'undefined')
      {
        await delay(1000);
        console.log('assets loading...')
      }

      const RENDER_DISTANCE = 20000;

      const chunkSize = 32;

      this.scene = new THREE.Scene()
      this.scene.background = new THREE.Color('lightblue');
     
        const fov = 75;
        const aspect = 2;  // the canvas default
        const near = 0.1;
        const far = 1000;
       this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

       
      this.renderer = new THREE.WebGLRenderer({ antialias: false })
      this.renderer.setSize(window.innerWidth, window.innerHeight)
      document.getElementById('gamecanvas').appendChild(this.renderer.domElement)




        this.scene.add(camera_pivot);
        camera_pivot.add( audioSystem.getListener()  )
 

      this.controls = new MW.TPSCameraControls(
      	this.camera, // three.js camera
      	camera_pivot, // tracking object
      	this.renderer.domElement
      );
 

      const tileSize = 128;
      const tileTextureWidth = 1152;
      const tileTextureHeight = 1280;

      const texLoader = new THREE.TextureLoader();
      const texture = texLoader.load('../assets/textures/spritesheet_tiles.png', function(){
        'loaded tex'
      });
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;




      const material = new THREE.MeshLambertMaterial({
        map: texture,
        side: THREE.DoubleSide,
        alphaTest: 0.1,
        transparent: true,
      });



      this.voxelWorld = new VoxelWorld({
        material,
        chunkSize,
        tileSize,
        tileTextureWidth,
        tileTextureHeight,
      });


      
      let voxelWorldGenerator = new VoxelWorldGenerator()

      this.voxelWorld.buildWorld(  voxelWorldGenerator )

       this.scene.add(this.voxelWorld.getWorldPivot())

      this.controls.minDistance = 20
      this.controls.maxDistance = 220
      this.controls.dollyTo(130)

      this.controls.rotateTo(1.0, 1.0, false)

      // the 'updated' event is fired by `tpsCameraControls.update()`
      this.controls.addEventListener( 'update', () => {

      //	const cameraFrontAngle    = this.controls.frontAngle;
      //	const characterFrontAngle = keyInputControl.frontAngle;
      //	playerController.direction = cameraFrontAngle + characterFrontAngle;

      } );


    //  this.controls.update();

      //for zoom
    //  this.controls.minDistance = 9
      //this.controls.maxDistance = 90



      const color = 0xFFFFFF;
      const intensity = 0.8;
      const ambientlight = new THREE.AmbientLight(color, intensity);
      this.scene.add(ambientlight);


      const directionallight = new THREE.DirectionalLight(color, intensity);
      directionallight.position.set(0, 10, 0);
      directionallight.target.position.set(-5, 0, 0);
      this.scene.add(directionallight);
      this.scene.add(directionallight.target);

      /*
      var stats = new Stats();
      stats.setMode(0);
      stats.domElement.style.position = 'absolute';
      stats.domElement.style.left = '0';
      stats.domElement.style.top = '0';
      gamecanvas.appendChild( stats.domElement );*/

      var skybox = new SkyBox().getMesh()
      skybox.name="skybox"
      camera_pivot.add(skybox);


      //this is for the rightClickMenu
      this.rect = this.renderer.domElement.getBoundingClientRect();



       gamecanvas.addEventListener('mousemove', this.onDocumentMouseMove, false);
       gamecanvas.addEventListener('mousedown', this.onMouseDown, false);
      gamecanvas.addEventListener('dblclick', this.onDoubleClick, false);
      window.addEventListener('resize', this.onWindowResize, false);
      window.addEventListener('contextmenu', this.onContextMenu, false);





      //const clientConnection = new ClientConnection()
      //clientConnection.init()



      //load player data from server

      //load entity data from server  ..await.. feed it to the entity manager


      // galaxyManager = new GalaxyManager()

      //load player and galaxy data from the server



        entityManager = new EntityManager(player,this.scene,loader )

      clientConnection.setEntityManager( entityManager )

      clientConnection.requestSpawn()

      //setInterval( function(){  clientConnection.requestGridState() }.bind(this)  , 500)


            this.$nextTick(()=>{
              //refs are available next tick !

              //    entityManager.setOverview( this.$refs.overview )
                //  entityManager.setShipHud( this.$refs.shiphud )

                  //right click menu commands
                /*  this.$refs.commandWarp.addEventListener("click", function(){
                    //intersect.material.color.setHex(Math.random() * 0x777777 + 0x777777);
                    rclickmenu.style.display = "none";
                    console.log('command warp')
                  }, false);*/


                  entityManager.getEntitiesEventEmitter().on('playersChanged', function entityListener(myPlayer, playersOnGrid) {
                    try{
                      this.$refs.itemactionmenu.playersChanged( myPlayer, playersOnGrid  )
                     }catch(e){}
                   }.bind(this));


                  entityManager.getEntitiesEventEmitter().on('entitiesChanged', function entityListener(myPossessedUnit, gridEntities) {
                    try{
                     this.$refs.rclickmenu.entitiesChanged( myPossessedUnit, gridEntities )
                    }catch(e){}
                   }.bind(this));

                   if(audioSystem)
                   {

                     entityManager.getEntitiesEventEmitter().on('entitySoundEvent', function entityListener(soundEventData) {


                      audioSystem.playSoundFromEvent(soundEventData)


                      }.bind(this));
                   }




           });




      const animate = function() {}

      this.animate()
    },

    initialize: async function( )
    {

       this.preloadAssets()
       await this.connectToServer( )



    },

    preloadAssets: async function()
    {
        loader = new ModelLoader()
        await loader.preloadAssets();

        audioSystem = new AudioSystem()
        await audioSystem.preloadAssets();

        this.assetsLoaded = true;
    },

    connectToServer: async function( ) {


      var accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

        player = new Player( accounts[0] )

        await new Promise ((resolve, reject) => {
            clientConnection.init(player, function(){
                resolve()
          })
        })

        this.connected=true
        this.startGameClient()  //start this game canvas up!


    },
    animate: function() {
      const delta = clock.getDelta();
      requestAnimationFrame(this.animate)



    //  this.TPSworld.step( Math.min( delta, 0.02 ) );

      var hasControlsUpdated = this.controls.update( delta );


      //this.controls.update();

       entityManager.update(this.scene,delta*1000);

       this.updateCameraPosition()



      this.renderer.render(this.scene, this.camera)
    },
    updateCameraPosition()
    {

      this.controls.minDistance = 20


      let playerData = entityManager.getMyPlayerData()
      let focusUnit = entityManager.getMyPossessedUnit()
      if(focusUnit)
      {

        let sceneObj =  entityManager.getSceneObjectForEntity(focusUnit._id)

        /*if(GalaxyHelper.playerIsDocked(playerData))
        {
            var dockingUnit = entityManager.getDataForEntityById(  playerData.dockedInStation  )
            sceneObj =  entityManager.getSceneObjectForEntity( playerData.dockedInStation )

            if(UnitHelper.getBaseTypeData(dockingUnit).collisionRadius > 20)
            {
              this.controls.minDistance = UnitHelper.getBaseTypeData(dockingUnit).collisionRadius

            }

        }*/


        if(sceneObj)
        {

           camera_pivot.position = sceneObj.position


        
        }else{
          console.log('WARN - no scene object for my focus unit' )
        }
      }


    },


    onDocumentMouseMove: function(event) {
      event.preventDefault();

    //  mouse.x = ((event.clientX - this.rect.left) / this.rect.width) * 2 - 1;
      //mouse.y = -((event.clientY - this.rect.top) / this.rect.height) * 2 + 1;

    	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;


    },
    onContextMenu: function(event) {
      	event.preventDefault(); // no right click menu
    },
    onMouseDown: function(event) {
      event.preventDefault();


      this.hideAllRightClickMenus()
    //  this.controls.handleMouseDown(event)

      var rightclick;

        if (!event) var event = window.event;
        if (event.which) rightclick = (event.which == 3);
        else if (event.button) rightclick = (event.button == 2);
      if (!rightclick) {
      //  setInterval( function() {rclickmenu.style.display = "none"} , 50)  ;
          return;
      }

      //this is offset by the scroll... not right

      mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
      mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;


      raycaster.setFromCamera( mouse, this.camera);



      var clickables = entityManager.getClickableEntities()
      console.log('clickables ',clickables)
      //this.scene.children

      var intersect;
    var intersects = raycaster.intersectObjects( clickables, true );
      if(typeof intersects == 'undefined' || !intersects.length)
      {
        intersect = undefined;

      }else{
        intersect = intersects[0].object;
      }

      this.openRightClickMenuForSceneObject(intersect)

    },

    openRightClickMenuForSceneObject( obj )
    {
      this.hideAllRightClickMenus()
      this.$refs.rclickmenu.buildTargettingData(  obj )

      var top_offset = -40
      this.$refs.rclickmenu.setOffsets( {left: (event.clientX) +'px'  , top: (event.clientY + top_offset ) +'px'   }  )
      this.$refs.rclickmenu.setHidden(false)

    },

    openItemActionMenuForItem( item )
    {
      this.hideAllRightClickMenus()

      this.$refs.itemactionmenu.buildTargettingData(item)

      var top_offset = -40
      this.$refs.itemactionmenu.setOffsets( {left: (event.clientX) +'px'  , top: (event.clientY + top_offset ) +'px'   }  )
      this.$refs.itemactionmenu.setHidden(false)

    },

    hideAllRightClickMenus()
    {
      this.$refs.itemactionmenu.setHidden(true)
      this.$refs.rclickmenu.setHidden(true)
    },


    onDoubleClick: function(event) {
      event.preventDefault();


      var rightclick;

        if (!event) var event = window.event;
        if (event.which) rightclick = (event.which == 3);
        else if (event.button) rightclick = (event.button == 2);
      if (rightclick) return;

        raycaster.setFromCamera(mouse, this.camera);

      //  var facing = raycaster.ray.direction
        var facing = this.camera.getWorldDirection();
        var facingVec = new THREE.Vector3(facing.x  ,facing.y  ,facing.z   ).normalize()

        console.log('set new facing vector', facingVec)

        this.handleClientCommand('setShipDirectionVector', {vector: facingVec } )


    },


    async handleItemActionMenuCallback(item)
    {

      this.openItemActionMenuForItem(item)
    },

    async handleDevToolsRequest(dataRequest)
    {
      var results = await clientConnection.requestAPIData( dataRequest )

      console.log('got response from dev tool request', results)
    },


    /*
    For complex data commands that are  going to a server, requesting data
    */
    async handleClientDataRequest( dataRequest  )
    {

      if(dataRequest.requestType=='walletDetails')
      {
        //just get this data from web3

        let results = await EthereumHelper.getWalletDetails( clientConnection.getPublicAddress() )

      //  this.$refs.stationpanel.walletDetailsChanged( results.data )

        return results;
      }


      var results = await clientConnection.requestAPIData( dataRequest )

      return results


      //handle more request  types
    /*  if(results.requestType == 'inventory')
      {
        this.$refs.stationpanel.inventoryDataChanged( results.data )
      }

      if(results.requestType == 'orders')
      {
        this.$refs.stationpanel.ordersChanged( results.data )
      }*/

      //pop up some success window w the results for 'make market order'


    },

    /*
    For local commands that are not going to a server
    */
    async handleLocalActionCommand(cmdName, cmdParams)
    {
      if(cmdName == 'closeRightClickMenus'){
        this.hideAllRightClickMenus()
      }

      //local commands are intercepted
      if(cmdName == 'startsell')
      {
        this.$refs.stationpanel.startSellingItem( cmdParams.item )

      }

      if(cmdName == 'cancelOrder')
      {

          let playerData = entityManager.getMyPlayerData()


      }

      if(cmdName == 'buyoutOrder')
      {

        let publicAddress = clientConnection.getPublicAddress()

        let orderData = cmdParams


        let requestData = {
          requestType: 'buyoutOrderTx',

          orderData: orderData
        }


        var result = null
        try{
            result = await  EthereumHelper.startBuyoutOrderWeb3( {item: orderData, publicAddress: publicAddress })

        }catch(error)
        {
          console.log('buyout order error', error )
        }



          console.log('meep start buyout2 ', result)

            if(result && result.ethTx && result.ethTx.transactionHash)
            {


              requestData.txSuccess = true
              requestData.txHash = result.ethTx.transactionHash
              this.handleClientDataRequest( requestData )

            }else{

              requestData.txSuccess = false
              this.handleClientDataRequest( requestData )

            }


          /*
            let requestData = {
              requestType: 'buyoutOrderTx',
              txHash: result.txHash,
              error: result.error,
              orderData: orderData
            }*/











      }

      if(cmdName == 'approve')
      {
        let result = await EthereumHelper.approveTokensToPayspec( clientConnection.getPublicAddress() )

      }


    },

    /*
    For simple directive commands that are  going to a server
    */
    handleClientCommand(cmdName, cmdParams  )
    {

      this.playLocalSoundForLocalCommand(cmdName )



      //networked commands go to server
      clientConnection.sendClientCommand(cmdName, cmdParams)

    },

    handleOverviewRowClicked(entityRow)
    {
      var sceneObject = entityManager.getSceneObjectForEntity(entityRow._id)

      this.openRightClickMenuForSceneObject(sceneObject)
    },

    onWindowResize: function(event) {


      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);


    },


    playLocalSoundForLocalCommand : function( cmdName )
    {

      var soundEventData = null


      if(cmdName == 'initiateWarp')
      {
        soundEventData =  {
          playerUnit: null,
          actionUnit: null,
          soundName: 'warpdriveactive'
        }
      }

      if(cmdName == 'dock')
      {
        soundEventData =  {
          playerUnit: null,
          actionUnit: null,
          soundName: 'transmitdockingrequest'
        }
      }

      if(soundEventData)
      {
        audioSystem.playSoundFromEvent(soundEventData)
      }


    }

  },
  mounted() {
    //this.init()
    //this.animate()


  }
}
</script>
