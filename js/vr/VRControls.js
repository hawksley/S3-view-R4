/**
/**
 * @author dmarcos / https://github.com/dmarcos
 * @author hawksley / https://github.com/hawksley (added support for many more forms of control)
 */

THREE.VRControls = function ( camera, speed, done ) {
	this.phoneVR = new PhoneVR();

	this.speed = speed || 3; // 3 is just a good default speed multiplier

	//---game controller stuff---
	this.haveEvents = 'ongamepadconnected' in window;
	this.controllers = {};

	this._camera = camera;

	this._init = function () {
		var self = this;

		//hold down keys to do rotations and stuff
		function key(event, sign) {
			var control = self.manualControls[event.keyCode];

			if (typeof control === 'undefined' || sign === 1 && control.active || sign === -1 && !control.active) {
				return;
			}

			control.active = (sign === 1);
			if (self.isWASD && control.index <= 2){
				self.manualRotateRate[control.index] += sign * control.sign;
			} else if (self.isArrows && control.index <= 5) {
				self.manualMoveRate[control.index - 3] += sign * control.sign;
			} else if (control.index <= 9) {
				self.manualR4MoveRate[control.index - 6] += sign * control.sign;
			}

			// } else if (control.index == 6) {
			// 	globalUserPosn.x += 0.5*control.sign;
			// } else if (control.index == 7) {
			// 	globalUserPosn.y += 0.5*control.sign;
			// } else if (control.index == 8) {
			// 	globalUserPosn.z += 0.5*control.sign;
			// } else if (control.index == 9) {
			// 	globalUserPosn.w += 0.5*control.sign;
			// }
		}

		document.addEventListener('keydown', function(event) { key(event, 1); }, false);
		document.addEventListener('keyup', function(event) { key(event, -1); }, false);


		function connecthandler(e) {
			addgamepad(e.gamepad);
		}

		function addgamepad(gamepad) {
			self.controllers[gamepad.index] = gamepad;
		}

		function disconnecthandler(e) {
			removegamepad(e.gamepad);
		}

		function removegamepad(gamepad) {
			delete self.controllers[gamepad.index];
		}

		function scangamepads() {
			var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
			for (var i = 0; i < gamepads.length; i++) {
				if (gamepads[i]) {
					if (gamepads[i].index in self.controllers) {
						self.controllers[gamepads[i].index] = gamepads[i];
					} else {
						addgamepad(gamepads[i]);
					}
				}
			}
		}

		window.addEventListener("gamepadconnected", connecthandler);
		window.addEventListener("gamepaddisconnected", disconnecthandler);
		if (!self.haveEvents) {
			setInterval(scangamepads, 500);
		}

		if ( !navigator.mozGetVRDevices && !navigator.getVRDevices ) {
			if ( done ) {
				done("Your browser is not VR Ready");
			}
			return;
		}

		if ( navigator.getVRDevices ) {
			navigator.getVRDevices().then( gotVRDevices );
		} else {
			navigator.mozGetVRDevices( gotVRDevices );
		}

		function gotVRDevices( devices ) {
			var vrInput;
			var error;
			for ( var i = 0; i < devices.length; ++i ) {
				if ( devices[i] instanceof PositionSensorVRDevice ) {
					vrInput = devices[i]
					self._vrInput = vrInput;
					break; // We keep the first we encounter
				}
			}
			if ( done ) {
				if ( !vrInput ) {
				 error = 'HMD not available';
				}
				done( error );
			}
		}
	};

	this._init();

	this.manualRotation = new THREE.Quaternion();

	this.manualControls = {
		65 : {index: 1, sign: 1, active: 0},  // a
		68 : {index: 1, sign: -1, active: 0}, // d
		87 : {index: 0, sign: 1, active: 0},  // w
		83 : {index: 0, sign: -1, active: 0}, // s
		81 : {index: 2, sign: -1, active: 0}, // q
		69 : {index: 2, sign: 1, active: 0},  // e

		38 : {index: 3, sign: -1, active: 0},  // up
		40 : {index: 3, sign: 1, active: 0}, // down
		37 : {index: 4, sign: 1, active: 0}, // left
		39 : {index: 4, sign: -1, active: 0},   // right
		191 : {index: 5, sign: 1, active: 0}, // fwd slash
		222 : {index: 5, sign: -1, active: 0},   // single quote

		73 : {index: 7, sign: -1, active: 0}, // i
		75 : {index: 7, sign: 1, active: 0}, // k
		85 : {index: 8, sign: -1, active: 0}, // u
		74 : {index: 8, sign: 1, active: 0}, // j
		79 : {index: 9, sign: -1, active: 0},  // o
		76 : {index: 9, sign: 1, active: 0}, // l
		89 : {index: 6, sign: -1, active: 0},  // y
		72 : {index: 6, sign: 1, active: 0}  // h
  };

	this.manualRotateRate = new Float32Array([0, 0, 0]);
	this.manualMoveRate = new Float32Array([0, 0, 0]);
	this.manualR4MoveRate = new Float32Array([0, 0, 0, 0]);

	this.updateTime = 0;

	this.isGamepad = true;
	this.isArrows = true;
	this.isWASD = true;

	// the Rift SDK returns the position in meters
	// this scale factor allows the user to define how meters
	// are converted to scene units.
	this.scale = 1;

	this.enableGamepad = function(isGamepad) {
		this.isGamepad = isGamepad;
	}

	this.enableArrows = function(isArrows) {
		this.isArrows = isArrows;
	}

	this.enableWASD = function(isWASD) {
		this.isWASD = isWASD;
	}

	this.update = function() {
		var camera = this._camera;
		var vrState = this.getVRState();
		var vrInput = this._vrInput;
		var manualRotation = this.manualRotation;
		var oldTime = this.updateTime;
		var newTime = Date.now();
		this.updateTime = newTime;

		/*
		Get controller button info
		*/
		// if (this.isGamepad) {
			var j;

			for (j in this.controllers) {
				var controller = this.controllers[j];

				this.manualMoveRate[1] = -1 * Math.round(controller.axes[0]);
				this.manualMoveRate[0] = Math.round(controller.axes[1]);
				this.manualRotateRate[1] = -1 * Math.round(controller.axes[3]);
				this.manualRotateRate[0] = -1 * Math.round(controller.axes[4]);
			}
		// }

		// if (this.isGamepad || this.isWASD) {
		  var interval = (newTime - oldTime) * 0.001;
		  var update = new THREE.Quaternion(this.manualRotateRate[0] * interval,
		                               this.manualRotateRate[1] * interval,
		                               this.manualRotateRate[2] * interval, 1.0);
		  update.normalize();
			manualRotation.multiplyQuaternions(manualRotation, update);
		// }

		// if (this.isGamepad || this.isArrows) {
			var offset = new THREE.Vector3();
			if (this.manualMoveRate[0] != 0 || this.manualMoveRate[1] != 0 || this.manualMoveRate[2] != 0){
					offset = getFwdVector().multiplyScalar( interval * this.speed * this.manualMoveRate[0])
							.add(getRightVector().multiplyScalar( interval * this.speed * this.manualMoveRate[1]))
							.add(getUpVector().multiplyScalar( interval * this.speed * this.manualMoveRate[2]));
			}

			// why not use the same speed parameter for R4 as for R3, what could possibly go wrong?
			globalUserPosn.x += interval * this.speed * this.manualR4MoveRate[0];
			globalUserPosn.y += interval * this.speed * this.manualR4MoveRate[1];
			globalUserPosn.z += interval * this.speed * this.manualR4MoveRate[2];
			globalUserPosn.w += interval * this.speed * this.manualR4MoveRate[3];


		// }

		if ( camera ) {
			if ( !vrState ) {
				camera.quaternion.copy(manualRotation);
				camera.position = camera.position.add(offset);
				return;
			}

			// Applies head rotation from sensors data.
			var totalRotation = new THREE.Quaternion();
			var state = vrInput.getState();
      if (state.orientation !== null) {
					var vrStateRotation = new THREE.Quaternion(state.orientation.x, state.orientation.y, state.orientation.z, state.orientation.w);
	        totalRotation.multiplyQuaternions(manualRotation, vrStateRotation);
      } else {
        	totalRotation = manualRotation;
      }

			camera.quaternion.copy(totalRotation);

			if (state.position !== null) {
				camera.position.copy( state.position ).multiplyScalar( this.scale );
			} else {
				camera.position = camera.position.add(offset);
			}
		}
	};

	this.resetSensor = function() {
		var vrInput = this._vrInput;
		if (!vrInput) {
			return null;
		}
		vrInput.resetSensor();
	};

	this.getRotation = function() {
		if ( typeof vrState == "undefined" || !vrState ) {
			return this.manualRotation;
		}

		var totalRotation = new THREE.Quaternion();
		var state = vrState.hmd.rotation;
		if (vrState.hmd.rotation[0] !== 0 ||
				vrState.hmd.rotation[1] !== 0 ||
				vrState.hmd.rotation[2] !== 0 ||
				vrState.hmd.rotation[3] !== 0) {
				var vrStateRotation = new THREE.Quaternion(state[0], state[1], state[2], state[3]);
				totalRotation.multiplyQuaternions(manualRotation, vrStateRotation);
		} else {
				totalRotation = manualRotation;
		}

		return totalRotation;
	};

	this.getVRState = function() {
		var vrInput = this._vrInput;
		var orientation;
		var vrState;

		if ( vrInput ) {
			orientation	= vrInput.getState().orientation;
		} else if (this.phoneVR.rotationQuat()) {
			orientation = this.phoneVR.rotationQuat();
		} else {
			return null;
		}

		if (orientation == null) {
			return null;
		}
		vrState = {
			hmd : {
				rotation : [
					orientation.x,
					orientation.y,
					orientation.z,
					orientation.w
				]
			}
		};
		return vrState;
	};

	function getFwdVector() {
		return new THREE.Vector3(0,0,1).applyQuaternion(camera.quaternion);
	}

	function getRightVector() {
		return new THREE.Vector3(-1,0,0).applyQuaternion(camera.quaternion);
	}

	function getUpVector() {
		return new THREE.Vector3(0,-1,0).applyQuaternion(camera.quaternion);
	}
};
