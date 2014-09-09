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

	///////// etc
	this.seekwait = 0;

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

///////// control functions
PaView.prototype.pause = function() {
	if (this.playing) {
		this.video.pause();
		this.btn.style.display = 'block';
		this.ctrl.style.display = 'block';
		if (this.info)
			this.info.style.display = 'block';
	} else {
		this.video.play();
		this.btn.style.display = 'none';
		if (this.info)
			this.info.style.display = 'none';
	}
	this.playing = !this.playing;
}

PaView.prototype.fadeoutCtrlBar = function() {
	this.ctrl.style.opacity -= 0.1;
	if (this.ctrl.style.opacity < 0) {
		this.ctrl.style.display = 'none';
		this.ctrl.style.opacity = 1.0;
	} else {
		var self = this;
		setTimeout(function() { self.fadeoutCtrlBar(); }, 20);
	}
}

PaView.prototype.drawCtrlBar = function(ratio) {
	var bar1;
	if (ratio !== undefined) {
		bar1 = this.barlen * ratio;
	} else {
		bar1 = this.barlen * this.video.currentTime / this.video.duration;
	}
	var bar2 = this.barlen - bar1;
	this.ctrlctx.clearRect(10, 3, this.barlen, 14);
	this.ctrlctx.fillStyle = 'rgba(200,200,200,0.5)';
	this.ctrlctx.fillRect(10, 3, bar1, 14);
	this.ctrlctx.fillStyle = 'rgba(100,100,100,0.5)';
	this.ctrlctx.fillRect(10 + bar1, 3, bar2, 14);

	this.drawVolume(this.ctrlctx, this.barlen + 20, 3, this.vollen , 14, this.video.volume);
}

PaView.prototype.roundRect = function(ctx, x, y, w, h, r) {
	ctx.beginPath();
	ctx.moveTo(x, y+r);
	ctx.arc(x+r,   y+w-r, r, Math.PI, Math.PI/2, 1);
	ctx.arc(x+h-r, y+w-r, r, Math.PI/2, 0, 1);
	ctx.arc(x+h-r, y+r,   r, 0, Math.PI*3/2, 1);
	ctx.arc(x+r,   y+r,   r, Math.PI*3/2, Math.PI, 1);
	ctx.closePath();
	ctx.fill();
}

PaView.prototype.triangle = function(ctx, x, y, w, h) {
	ctx.beginPath();
	ctx.moveTo(x, y);
	ctx.lineTo(x + w, y + h / 2);
	ctx.lineTo(x, y + h);
	ctx.closePath();
	ctx.fill();
}

PaView.prototype.drawVolume = function(ctx, x, y, w, h, val) {
	this.ctrlctx.clearRect(x, y, w, h);
	this.ctrlctx.fillStyle = 'rgba(0,0,0,0.7)';
	ctx.beginPath();
	ctx.moveTo(x, y);
	ctx.lineTo(x, y + h);
	ctx.lineTo(x + w, y);
	ctx.closePath();
	ctx.fill();
	this.ctrlctx.fillStyle = 'rgba(200,200,200,0.5)';
	ctx.beginPath();
	ctx.moveTo(x, y + h);
	ctx.lineTo(x + w * val, y + h);
	ctx.lineTo(x + w * val, y + h * (1 - val));
	ctx.closePath();
	ctx.fill();
	this.ctrlctx.fillStyle = 'rgba(100,100,100,0.5)';
	ctx.beginPath();
	ctx.moveTo(x + w * val, y + h);
	ctx.lineTo(x + w * val, y + h * (1 - val));
	ctx.lineTo(x + w, y);
	ctx.lineTo(x + w, y + h);
	ctx.closePath();
	ctx.fill();

}


///////// main process
PaView.prototype.show = function() {
	var self = this;

	// div
	this.element = document.getElementById(this.id);
	this.element.style.width = this.width + 'px';
	this.element.style.height = this.height + 'px';
	this.element.style.cursor = 'default';
	if ((this.element.style.position !== 'absolute')
	&&  (this.element.style.position !== 'fixed')) {
		this.element.style.position = 'relative';
	}

	this.element.onmouseover = function() {
		self.ctrl.style.display = 'block';
	};
	this.element.onmouseleave = function() {
		self.fadeoutCtrlBar();
	};

	this.info = document.getElementById('paviewinfo');

	// start button
	this.btn = document.createElement('canvas');
	this.btn.id = 'paview_btn';
	this.btn.style.position = 'absolute';
	this.btn.style.left = ((this.width - 60) / 2).toFixed() + 'px'; 
	this.btn.style.top = ((this.height - 40) / 2).toFixed() + 'px';
	this.btn.style.display = 'block';
	this.btn.width = 60;
	this.btn.height = 40;
	this.btnctx = this.btn.getContext('2d');
	this.btnctx.fillStyle = 'rgba(180,180,180,0.6)';
	this.roundRect(this.btnctx, 0, 0, 40, 60, 5);
	this.btnctx.fillStyle = 'rgba(255,255,255,0.7)';
	this.triangle(this.btnctx, 16, 10, 30, 20);
	this.element.appendChild(this.btn);

	// bottom bar
	this.ctrl = document.createElement('canvas');
	this.ctrl.id = 'paviewctrl';
	this.ctrl.style.position = 'absolute';
	this.ctrl.style.left = '0px'; 
	this.ctrl.style.top = (this.height - 20) + 'px';
	this.ctrl.style.display = 'none';
	this.ctrl.width = this.width;
	this.ctrl.height = 20;
	this.ctrlctx = this.ctrl.getContext('2d');
	this.ctrlctx.fillStyle = 'rgba(0,0,0,0.7)';
	this.ctrlctx.fillRect(0,0,this.width,20);
	this.vollen = 60;
	this.barlen = this.width - this.vollen - 20 - 10;

	this.ignoreEvent = false;
	this.ctrl.onmousedown = function(e) {
		self.ignoreEvent = true;
		var videopos = (e.layerX - 10) / self.barlen;
		if ((videopos >= 0.0) && (videopos <= 1.0)) {
			self.seekwait = 20;
			self.drawCtrlBar(videopos);
		}
		var volumepos = (e.layerX - self.barlen - 20);
		var volume = -1;
		if ((volumepos >= -10) && (volumepos <= 0)) {
			volume = 0;
		} else if ((volumepos > 0) && (volumepos < self.vollen)) {
			volume = volumepos / self.vollen;
		} else if ((volumepos >= self.vollen) && (volumepos <= self.vollen + 10)) {
			volume = 1;
		}
		if (volume >= 0) {
			self.video.volume = volume;
		}
		e.preventDefault();
	};
	this.ctrl.onmouseup = function(e) {
		// video seek
		var videopos = (e.layerX - 10) / self.barlen;
		if ((videopos >= 0.0) && (videopos <= 1.0)) {
			self.video.currentTime = self.video.duration * videopos;
		}

		e.preventDefault();
	};

	this.element.appendChild(this.ctrl);

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
	document.onmouseup = function(e) {
		self.element.style.cursor = 'default';
		if ((self.mousedown) && (e.pageX === self.mouseDownPos.x) && (e.pageY === self.mouseDownPos.y)) {
			self.pause();
		}
		self.mousedown = false;
	};
	this.element.onmousedown = function(e) {
		if (self.ignoreEvent) {
			self.ignoreEvent = false;
			return;
		}
		self.mousedown = true;
		self.mouseDownPos = {x:e.pageX, y:e.pageY};
		self.oldPosition = {x:e.pageX, y:e.pageY};
		self.element.style.cursor = 'move';
	};
	this.element.onmousemove = function(e) { self.rotateCamera(e.pageX, e.pageY); };

	// chrome / safari / IE
	this.element.onmousewheel = function(e) {
		var delta = e.deltaY ? e.deltaY : e.wheelDelta ? -e.wheelDelta : -e.wheelDeltaY * 0.2;
		self.zoomCamera(delta);
		e.preventDefault();
	};
	// firefox
	this.element.addEventListener("DOMMouseScroll", function(e) {
		self.zoomCamera(e.detail * 5);
		e.preventDefault();
	});


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
	this.video = document.createElement('video');
	var src = this.file;
	var ua = window.navigator.userAgent.toLowerCase();
	if ((ua.indexOf('firefox') != -1) && (ua.indexOf('mac os') != -1)) {
		src = src.replace(/\.mp4/, '.webm');
	}
	this.video.src = src;
	this.video.loop = false;
	this.video.load();
	this.video.volume = 0.7;

	// pause/restart
	this.playing = false;
	document.onkeydown = function (e) {
		if (e.keyCode === 0x20) {	// space key
			self.pause();
			e.preventDefault();
		}
	};

	// video end event
	this.video.addEventListener("ended", function(){
		setTimeout(function() {
			self.pause();
			self.video.currentTime = 0;
		}, 1000);
	}, false);

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
		if (self.video.readyState === self.video.HAVE_ENOUGH_DATA) {
			videoContext.drawImage(self.video, 0, 0);
			if (texture) {
				texture.needsUpdate = true;
			}
			if (self.seekwait > 0) {
				self.seekwait--;
			} else {
				self.drawCtrlBar();
			}
		}
		renderer.render(scene, self.camera);
	};
	render();
}
