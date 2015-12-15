'use strict';

var currentScreenOrientation = window.orientation || 0; // active default
var called = {};

function resizeContainer() {
  if (!window.container) {
    window.container = document.getElementById('container');
  }

  window.container.style.width = window.innerWidth + 'px';
  window.container.style.height = window.innerHeight + 'px';
}

window.addEventListener('resize', resizeContainer);

function setupControls() {
  if (called.setupControls) {
    return;
  }

  window.canvas = document.getElementById('glcanvas');

  resizeContainer();

  called.setupControls = true;
}

function runS3viewR4() {
  if (called.runS3viewR4) {
    return;
  }

  setupControls();

  webVR.initWebVR();

  webGL.initWebGL();

  if (webGL.gl) {
    webGL.gl.clearColor(0.0, 0.0, 0.0, 0.0);
    webGL.gl.clearDepth(1.0);
    webGL.gl.disable(webGL.gl.DEPTH_TEST);

    util.setCanvasSize();

    // Keyboard Controls
    controls.enableKeyControls();

    window.shader = new webGL.Shader({
      fragmentShaderName: 'shader-fs',
      vertexShaderName: 'shader-vs',
      attributes: ['aVertexPosition'],
      uniforms: ['time', 'quatPerCell', 'mousePos', 'travelDir', 'colourDir', 'HopfColorMatrix', 'moveQuat', 'rotMatrix', 'modelScale'],
    });

    webGL.initBuffers();
    webGL.initTextures();
  }

  called.runS3viewR4 = true;
}
