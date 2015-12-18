"use strict";

var materialBase, renderer, scene, camera, controls, effect, projector;

function init() {
  // Setup three.js WebGL renderer
  renderer = new THREE.WebGLRenderer( { antialias: true } );

  // Append the canvas element created by the renderer to document body element.
  document.body.appendChild( renderer.domElement );
  renderer.setClearColor( 0x000000, 1 );

  //Create a three.js scene
  scene = new THREE.Scene();

  //Create a three.js camera
  camera = new THREE.PerspectiveCamera( 110, window.innerWidth / window.innerHeight, 2, 10000 );
  scene.add(camera);

  //Apply VR headset positional data to camera.
  controls = new THREE.VRControls( camera );

  //Apply VR stereo rendering to renderer
  effect = new THREE.VREffect( renderer );
  effect.setSize( window.innerWidth, window.innerHeight );

  effect.render(scene, camera);

  // initialize object to perform world/screen calculations
	projector = new THREE.Projector();

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
      modelScale: {
        type: "f",
        value: 1.0
      },
      objectScale: {
        type: "f",
        value: 1.0
      },
      objectPosn: {
        type: "v4",
        value: new THREE.Vector4( 0, 0, -2, 0 )
      },
      userPosn: {
        type: "v4",
        value: new THREE.Vector4( 0, 0, 0, 0 )
      }
    },
    vertexShader: document.getElementById('vertexShader').textContent,
    fragmentShader: document.getElementById('fragmentShader').textContent
  });
  materialBase.side = THREE.FrontSide;

  loadStuff();
}

var modelFileName = "media/hypercube_2_skeleton.obj";
var resultingObj;
function loadStuff() {
  var manager = new THREE.LoadingManager();
  var loader = new THREE.OBJLoader(manager);
  loader.load(modelFileName, function (object) {
    resultingObj = object.clone();

    resultingObj.traverse(function (child) {
      if (child instanceof THREE.Mesh) {
        var material = new THREE.MeshNormalMaterial();
        material.side = THREE.DoubleSide;

        child.material = materialBase.clone();

        // child.material = material;
        // child.position.z = -2;

        child.frustumCulled = false;
      }
    });

    scene.add(resultingObj);
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