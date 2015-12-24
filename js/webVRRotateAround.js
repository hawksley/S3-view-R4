"use strict";

var materialBase, globalUserPosn, globalUserOrientation, renderer, scene, camera, controls, effect, arraySize, hyperCubeArray, projector;

function init() {
  // Setup three.js WebGL renderer
  renderer = new THREE.WebGLRenderer( { antialias: true } );

  // Append the canvas element created by the renderer to document body element.
  document.body.appendChild( renderer.domElement );
  renderer.setClearColor( 0x000000, 1 );

  //Create a three.js scene
  scene = new THREE.Scene();

  //Create a three.js camera
  camera = new THREE.PerspectiveCamera( 110, window.innerWidth / window.innerHeight, 0.001, 10000 );
  camera.position.z = 2;
  scene.add(camera);

  //Apply VR headset positional data to camera.
  controls = new THREE.VRControls( camera );

  //Apply VR stereo rendering to renderer
  effect = new THREE.VREffect( renderer );
  effect.setSize( window.innerWidth, window.innerHeight );

  effect.render(scene, camera);

  // initialize object to perform world/screen calculations
	projector = new THREE.Projector();

  globalUserPosn = new THREE.Vector4( 0, 0, 0, 20 );
  globalUserOrientation = new THREE.Matrix4();

  // material for the cells is a shader
  materialBase = new THREE.ShaderMaterial({
    // these are the parameters for the shader
    uniforms: {
      time: { // global time
        type: "f",
        value: 0.0
      },
      quatPerCell: {  // quaternion that moves cells into 4-space, set once per cell
        type: "v4",
        value: new THREE.Vector4( 0, 0, 0, 0 )
      },
      mousePos: {
        type: "v2",
        value: new THREE.Vector2(0,0)
      },
      travelDir: {
        type: "v4",
        value: new THREE.Vector4( 0, 0, 0, 0 )
      },
      colourDir: {
        type: "v4",
        value: new THREE.Vector4( 0, 0, 0, 0 )
      },
      HopfColorMatrix: {
        type: "m4",
        value: new THREE.Matrix4().set( 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 )
      },
      moveQuat: {
        type: "v4",
        value: new THREE.Vector4( 0, 0, 0, 1 )
      },
      rotMatrix: {
        type: "m3",
        value: new THREE.Matrix3().set( 0, 0, 0, 0, 0, 0, 0, 0, 0 )
      },
      modelScale: {  //currently unused
        type: "f",
        value: 2.0
      },
      objectScale: {
        type: "f",
        value: 5.0
      },
      objectPosn: {
        type: "v4",
        value: new THREE.Vector4( 0, 0, 0, 0 )
      },
      userPosn: {
        type: "v4",
        value: new THREE.Vector4( 0, 0, 0, 0 )
      },
      userOrientation: {
        type: "m4",
        value: new THREE.Matrix4()
      }
    },
    vertexShader: document.getElementById('vertexShader').textContent,
    fragmentShader: document.getElementById('fragmentShader').textContent
  });
  materialBase.side = THREE.DoubleSide;
  // materialBase.vertexColors = THREE.VertexColors;

  loadStuff();
}


// var resultingObj;
function loadStuff() {

  arraySize = 2;

  hyperCubeArray = new Array(arraySize*arraySize*arraySize*arraySize);
  // hyperCubeArray = new Array(16);

  for (var i = 0; i < hyperCubeArray.length; i++) {
    hyperCubeArray[i] = materialBase.clone();
  }

  // var modelFileName = "media/hypercube_2-skeleton_1.obj";
  // var modelFileName = "media/hypercube_2-skeleton_10.obj";
  var modelFileName = "media/hypercube_test_v2.obj";
  var manager = new THREE.LoadingManager();
  var loader = new THREE.OBJLoader(manager);
  loader.load(modelFileName, function (object) {
    for (var i = 0; i < hyperCubeArray.length; i++) {
      hyperCubeArray[i] = object.clone();

      hyperCubeArray[i].traverse(function (child) { // i%3= 0 1 2 0 1 2..., floor(i/3)%3=
        if (child instanceof THREE.Mesh) {
          child.material = materialBase.clone();
          child.material.uniforms.objectPosn.value = new THREE.Vector4(
            (i%arraySize - 0.5*(arraySize-1)) * 40,
            (Math.floor(i/arraySize)%arraySize - 0.5*(arraySize-1)) * 40,
            (Math.floor(i/Math.pow(arraySize, 2))%arraySize - 0.5*(arraySize-1)) * 40,
            (Math.floor(i/Math.pow(arraySize, 3))%arraySize - 0.5*(arraySize-1)) * 40);
          child.material.uniforms.objectScale.value = 5.0;
          child.material.uniforms.userPosn.value = globalUserPosn;
          child.material.uniforms.userOrientation.value = globalUserOrientation;
          child.frustumCulled = false;
        }
      });

      scene.add(hyperCubeArray[i]);
    }
  });

  // loader.load("media/hypercube_2_skeleton.obj", function (object) { // just an example of how you could make multiple
  //   var resultingObj2 = object.clone(); // if you actually wanted all the same, use an array and looping, and don't load a second time
  //   resultingObj2.traverse(function (child) {
  //     if (child instanceof THREE.Mesh) {
  //       child.material = materialBase.clone();
  //       child.material.uniforms.objectPosn.value.y = -10;
  //       child.material.uniforms.userPosn.value = globalUserPosn;
  //       child.frustumCulled = false;
  //     }
  //   });
  //   scene.add(resultingObj2);
  // });
}

// // var modelFileName = "media/hypercube_2-skeleton_1.obj";
// var modelFileName = "media/hypercube_2-skeleton_10.obj";
// var resultingObj;
// function loadStuff() {
//   var manager = new THREE.LoadingManager();
//   var loader = new THREE.OBJLoader(manager);
//   loader.load(modelFileName, function (object) {
//     resultingObj = object.clone();

//     resultingObj.traverse(function (child) {
//       if (child instanceof THREE.Mesh) {
//         child.material = materialBase.clone();
//         child.material.uniforms.objectPosn.value.y = -20;
//         child.material.uniforms.objectPosn.value.x = 0;
//         child.material.uniforms.userPosn.value = globalUserPosn;
//         child.material.uniforms.userOrientation.value = globalUserOrientation;
//         child.frustumCulled = false;
//       }
//     });

//     scene.add(resultingObj);
//   });

//   loader.load("media/hypercube_2-skeleton_10.obj", function (object) { // just an example of how you could make multiple
//     var resultingObj2 = object.clone(); // if you actually wanted all the same, use an array and looping, and don't load a second time
//     resultingObj2.traverse(function (child) {
//       if (child instanceof THREE.Mesh) {
//         child.material = materialBase.clone();
//         child.material.uniforms.objectPosn.value.y = 20;
//         child.material.uniforms.objectPosn.value.x = 0;
//         child.material.uniforms.userPosn.value = globalUserPosn;
//         child.material.uniforms.userOrientation.value = globalUserOrientation;
//         child.frustumCulled = false;
//       }
//     });
//     scene.add(resultingObj2);
//   });
// }

init();

// setTimeout(function(){debugger;}, 3000);

/*
Request animation frame loop function
*/
function animate() {
  //Update VR headset position and apply to camera.
  controls.update();

  // Render the scene through the VREffect.
  effect.render( scene, camera );
  requestAnimationFrame( animate );
  // console.log(globalUserPosn);
  // console.log(globalUserOrientation);
}

animate();	// Kick off animation loop

/*
Listen for click event to enter full-screen mode.
We listen for single click because that works best for mobile for now
*/
document.body.addEventListener( 'click', function(){
  // effect.setFullScreen( true );
})

/*
Listen for keyboard events
*/
function onkey(event) {
  event.preventDefault();

  if (event.keyCode == 90) { // z
    controls.resetSensor(); //zero rotation
  // } else if (event.keyCode == 70 || event.keyCode == 13) { //f or enter
    } else if (event.keyCode == 13) { //enter (we need f for other things!)
    effect.setFullScreen(true) //fullscreen
  }
};
window.addEventListener("keydown", onkey, true);

/*
Handle window resizes
*/
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  effect.setSize( window.innerWidth, window.innerHeight );
}
window.addEventListener('resize', onWindowResize, false);