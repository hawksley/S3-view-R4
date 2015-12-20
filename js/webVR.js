"use strict";

var materialBase, globalUserPosn, renderer, scene, camera, controls, effect, projector;

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

  globalUserPosn = new THREE.Vector4( 0, 0, 0, 0 );

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
        value: 10.0
      },
      objectPosn: {
        type: "v4",
        value: new THREE.Vector4( 0, 0, 0, 0 )
      },
      userPosn: {
        type: "v4",
        value: globalUserPosn
      }
    },
    vertexShader: document.getElementById('vertexShader').textContent,
    fragmentShader: document.getElementById('fragmentShader').textContent
  });
  materialBase.side = THREE.DoubleSide;
  // materialBase.vertexColors = THREE.VertexColors;

  loadStuff();
}

// var modelFileName = "media/hypercube_2-skeleton_1.obj";
var modelFileName = "media/hypercube_2-skeleton_10.obj";
var resultingObj;
function loadStuff() {
  var manager = new THREE.LoadingManager();
  var loader = new THREE.OBJLoader(manager);
  loader.load(modelFileName, function (object) {
    resultingObj = object.clone();

    resultingObj.traverse(function (child) {
      if (child instanceof THREE.Mesh) {
        child.material = materialBase.clone();
        child.material.uniforms.objectPosn.value.y = 20;
        child.material.uniforms.objectPosn.value.x = 5.5;
        child.material.uniforms.userPosn.value = globalUserPosn;
        child.frustumCulled = false;
      }
    });

    scene.add(resultingObj);
  });

  loader.load("media/hypercube_2-skeleton_10.obj", function (object) { // just an example of how you could make multiple
    var resultingObj2 = object.clone(); // if you actually wanted all the same, use an array and looping, and don't load a second time
    resultingObj2.traverse(function (child) {
      if (child instanceof THREE.Mesh) {
        child.material = materialBase.clone();
        child.material.uniforms.objectPosn.value.y = 20;
        child.material.uniforms.objectPosn.value.x = -5.5;
        child.material.uniforms.userPosn.value = globalUserPosn;
        child.frustumCulled = false;
      }
    });
    scene.add(resultingObj2);
  });
}

init();

/*
Request animation frame loop function
*/
function animate() {
  //Update VR headset position and apply to camera.
  controls.update();

  // Render the scene through the VREffect.
  effect.render( scene, camera );
  requestAnimationFrame( animate );
}

animate();	// Kick off animation loop

/*
Listen for click event to enter full-screen mode.
We listen for single click because that works best for mobile for now
*/
document.body.addEventListener( 'click', function(){
  effect.setFullScreen( true );
})

/*
Listen for keyboard events
*/
function onkey(event) {
  event.preventDefault();

  if (event.keyCode == 90) { // z
    controls.resetSensor(); //zero rotation
  } else if (event.keyCode == 70 || event.keyCode == 13) { //f or enter
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
