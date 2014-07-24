/*
 *
 * This program is licensed under the MIT License.
 * Copyright 2014, aike (@aike1000)
 *
 */

var PaView = function(arg) {
	///////// degree to radian utility function
	var d2r = function(d) { return d * Math.PI / 180; };

	///////// Option Setting
	this.id = arg.id;											// id of parent element *required*
	// note: movie file must be located at same origin
	this.file = arg.file;										// movie filename *required*
	this.srcwidth = arg.srcwidth;								// movie width *required*
	this.srcheight = arg.srcheight;								// movie height *required*

	this.width = (arg.width == undefined) ? 500 : arg.width;				// view width  (500)
	this.height = (arg.height == undefined) ? 300 : arg.height;				// view height (300)
	this.zoom = (arg.zoom == undefined) ? 70 : arg.zoom;					// 20 .. 130 (70)
	this.firstview = (arg.firstview == undefined) ? 0 : d2r(-arg.firstview);// 0 .. 360 (0)
	this.degree = (arg.degree == undefined) ? [0, 0, 0]						// [0,0,0] .. [360,360,360] ([0,0,0])
					: [d2r(arg.degree[0]), d2r(arg.degree[1]), d2r(arg.degree[2])];
	this.rendererType = (arg.rendererType == undefined) ? 0 : arg.rendererType;	// 0,1,2 (0)

	///////// camera direction
	this.pan = this.firstview;
	this.tilt = 0;
	this.cameraDir = new THREE.Vector3(Math.sin(this.pan), Math.sin(this.tilt), Math.cos(this.pan));
	this.oldPosition = {x:null, y:null};
	this.mousedown = false;

	///////// call main process
	this.show();
}

///////// drag callback
PaView.prototype.rotateCamera = function(x, y) {
	if (!this.mousedown)
		return;

	var pos = {x:x, y:y};
	if (this.oldPosition.x === null) {
		this.oldPosition = pos;
		return;
	}

	this.pan -= (this.oldPosition.x - pos.x) * 0.005;
	this.tilt -= (this.oldPosition.y - pos.y) * 0.004;
	var limit = Math.PI / 2 - 0.1;
	if (this.tilt > limit) this.tilt = limit;
	if (this.tilt < -limit) this.tilt = -limit;

	this.cameraDir.x = Math.sin(this.pan) * Math.cos(this.tilt);
	this.cameraDir.z = Math.cos(this.pan) * Math.cos(this.tilt);
	this.cameraDir.y = Math.sin(this.tilt);

	this.camera.lookAt(this.cameraDir);
	this.oldPosition = pos;
}

///////// wheel callback
PaView.prototype.zoomCamera = function(val) {
	this.zoom += val * 0.1;
	if (this.zoom < 20) this.zoom = 20;
	if (this.zoom > 130) this.zoom = 130;
	this.camera.fov = this.zoom;
	this.camera.updateProjectionMatrix();
}


///////// main process
PaView.prototype.show = function() {
	var self = this;
	this.element = document.getElementById(this.id);

	///////// RENDERER
	var renderer;
	if (this.rendererType == 0)
		renderer = new THREE.WebGLRenderer({ antialias:true });
	else if (this.rendererType == 1)
		renderer = new THREE.CanvasRenderer({ antialias:true });
	else
		renderer = new THREE.CSS3DRenderer({ antialias:true });
	renderer.setSize(this.width, this.height);
	renderer.setClearColor(0x000000, 1);
	this.element.appendChild(renderer.domElement);	// append to <DIV>

	///////// callback setting
	document.onmouseup = function() { self.mousedown = false; };
	this.element.onmousedown = function(e) { 
		self.mousedown = true;
		self.oldPosition = {x:e.pageX, y:e.pageY};
	};
	this.element.onmousemove = function(e) { self.rotateCamera(e.pageX, e.pageY); };
	this.element.onmousewheel = function(e) { self.zoomCamera(e.deltaY); };

	///////// SCENE
	var scene = new THREE.Scene();

	///////// CAMERA
	this.camera = new THREE.PerspectiveCamera(this.zoom, this.width / this.height);
	this.camera.position = new THREE.Vector3(0, 0, 0);
	this.camera.lookAt(this.cameraDir);
	scene.add(this.camera);

	///////// LIGHT
	var light = new THREE.AmbientLight(0xffffff);
	scene.add(light);

	///////// SPHERE
	var geometry = new THREE.SphereGeometry(100, 32, 16);

	///////// VIDEO
	var video = document.createElement('video');
	video.src = this.file;
	video.loop = true;
	video.load();
	video.play();

	var videoCanvas = document.createElement('canvas');
	videoCanvas.width = this.srcwidth;
	videoCanvas.height = this.srcheight;

	var videoContext = videoCanvas.getContext('2d');
	videoContext.fillStyle = '#000000';
	videoContext.fillRect(0, 0, videoCanvas.width, videoCanvas.height);

	///////// TEXTURE
	var texture = new THREE.Texture(videoCanvas);
	texture.flipY = false;

	///////// MATERIAL
	var material = new THREE.MeshBasicMaterial({
		map: texture,
		overdraw: true,
		side:THREE.DoubleSide});

	///////// MESH
	var mesh = new THREE.Mesh(geometry, material);
	if (this.rendererType == 0)
		mesh.rotation.x = Math.PI;
	mesh.rotation.x += this.degree[0];
	mesh.rotation.y += this.degree[1];
	mesh.rotation.z += this.degree[2];
	scene.add(mesh);

	///////// Draw Loop
	function render() {
		requestAnimationFrame(render);
		if (video.readyState === video.HAVE_ENOUGH_DATA) {
			videoContext.drawImage(video, 0, 0);
				if (texture) {
					texture.needsUpdate = true;
				}
			}

		renderer.render(scene, self.camera);
	};
	render();
}
