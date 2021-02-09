 import * as THREE from 'three'

export default class SkyBox {


  getMesh()
  {
    const skyboxGeo = new THREE.BoxGeometry(8000, 8000, 8000);


    let skyboxImage = "bluenebula2";
    const materialArray = this.createMaterialArray(skyboxImage);

    const skybox = new THREE.Mesh(skyboxGeo, materialArray);

    return skybox
  }



  createPathStrings(filename) {
    const basePath = "../assets/skybox/";
    const baseFilename = basePath + filename;
    const fileType = ".png";
    const sides = ["ft", "bk", "up", "dn", "rt", "lf"];
    const pathStings = sides.map(side => {
      return baseFilename + "_" + side + fileType;
    });
    return pathStings;
  }


  createMaterialArray(filename) {
    const skyboxImagepaths = this.createPathStrings(filename);
    console.log('meep',skyboxImagepaths)
    const materialArray = skyboxImagepaths.map(image => {
      let texture = new THREE.TextureLoader().load(image);
      return new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide }); // <---
    });
    return materialArray;
  }

}
