/*
The MIT License

Copyright (c) 2012 Hibana.js authors.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

// global constants
var WIDTH, HEIGHT, VIEW_ANGLE = 65, ASPECT, NEAR = 5, FAR = 100;
var ROOM_DIM = 50, OBJECT_SIZE = 2.5, OBJECT_DETAIL = 30;
var MAX_CAMERA_ANGLE = Math.PI / 5;
var CAMERA_RADIUS = ROOM_DIM / 2 - OBJECT_SIZE;
var CAMERA_HOME = new THREE.Vector3( 0, 0, ROOM_DIM / 2 - OBJECT_SIZE );
var CAMERA_TARGET = new THREE.Vector3( 0, 0, 0 );
var AZIMUTH_RANGE = OBJECT_SIZE; 
var MOUSE_SPEED = 0.0001

// global variables
var azimuth = 0, zenith = 0, mouse_x = 0, mouse_y = 0, mouse_decay = true, mouse_is_down = false;
var renderer, composer, camera, scene;
var mouse_decay;
var objects, areOrbiting;
var hibana;


// ****** Executes as soon as the window has loaded
$(window).load( function() {

	init3D();
	
	$("#main3d").mousedown( function() {
		mouse_decay = false;
		mouse_is_down = true;
		mouse_x = mouse_y = 0;
		$("#main3d").bind( "mousemove", function( event ) {
			mouse_is_down = true;
			mouse_x = event.pageX - $("#main3d").position().left - $("#main3d").width() / 2;
			mouse_y = event.pageY - $("#main3d").position().top - $("#main3d").height() / 2;
		});
	});
	
	$("body").mouseup( function() {
		mouse_decay = true;
		mouse_is_down = false;
		$("#main3d").unbind( "mousemove" );
	});
	
	$("#main3d").mouseleave( function() {
		mouse_decay = true;
		mouse_is_down = false;
		$("#main3d").unbind( "mousemove" );
	});
	
	$("#play-pause").click( function() {
		hibana.togglePause();
	});
	
	$("#show-hide").click( function() {
		for ( o in objects )
			objects[o].visible = !objects[o].visible;
	});
	
	$("#orbit").click( function() {
		areOrbiting = !areOrbiting;
	});
	
	$("#gravity").click( function() {
		hibana.toggleGlobalForce();
	});
	
	$("#size-slider").change( function() {
		hibana.setParticleSize( parseFloat( $(this).val() ) );
	});
	
	$("#rate-slider").change( function() {
		hibana.setRate( parseInt( $(this).val() ) );
	});
	
	$("#jitter-slider").change( function() {
		hibana.setJitterFactor( parseFloat( $(this).val() ) );
	});
	
	$("#angle-slider").change( function() {
		hibana.setEmissionAngle( parseFloat( $(this).val() ) );
	});
	
	$("#life-min-slider").change( function() {
		hibana.setLifetimeMinimum( parseInt( $(this).val() ) );
	});
	
	$("#life-range-slider").change( function() {
		hibana.setLifetimeRange( parseFloat( $(this).val() ) );
	});
	
	$("#force-slider").change( function() {
		hibana.setEmissionForce( parseFloat( $(this).val() ) );
	});
});

$(window).resize( function() {

	WIDTH = $("#main3d").width(); HEIGHT = $("#main3d").height();
	camera.aspect = WIDTH / HEIGHT;
	camera.updateProjectionMatrix();
	renderer.setSize( WIDTH, HEIGHT );
	
});




function init3D() {

	// initialize 3d globals
	WIDTH = $("#main3d").width(); HEIGHT = $("#main3d").height(); ASPECT = WIDTH / HEIGHT;
	
	// initialize renderer
	renderer = new THREE.WebGLRenderer( { antialias : true, shadowMapEnabled : true, shadowMapSoft : true, gammaInput : true, gammaOutput : true } );
    renderer.setSize( WIDTH, HEIGHT );
    $("#main3d").append( renderer.domElement );

    scene = new THREE.Scene();

	createRoom();
	createCamera();	
	
	hibana = new HIBANA( scene );
	
	createObjects( 10 );
	createEmitters();
	createLights();
	
	animate();
	
}

function createRoom() {
	var geo = new THREE.CubeGeometry( ROOM_DIM,  ROOM_DIM,  ROOM_DIM, 10, 10, 10 );
	var materials = [	new THREE.MeshLambertMaterial( { color : 0xBBBBFF, shading : THREE.FlatShading } ),
				new THREE.MeshBasicMaterial( { color : 0x444444, shading : THREE.FlatShading, wireframe : true, wireframeLinewidth : 4, opacity : 0.3, transparent : true } ) ];
			
	var room_mesh = THREE.SceneUtils.createMultiMaterialObject( geo, materials );
	room_mesh.position.set( 0, 0, 0 );
	room_mesh.children[0].doubleSided = true;
	room_mesh.children[1].doubleSided = true;
	scene.add( room_mesh );
}

function createCamera() {
    camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR );
	camera.position = new THREE.Vector3().copy( CAMERA_HOME );
	camera.lookAt( CAMERA_TARGET );
    scene.add( camera );
}

function createObjects( objectCount ) {
	objects = [];
	areOrbiting = false;
	for ( var i = 0; i < objectCount; i++ ) {
		var geo = (Math.round( Math.random() * 2.0) > 1)
			? new THREE.SphereGeometry( OBJECT_SIZE, OBJECT_DETAIL, OBJECT_DETAIL )
			: new THREE.CubeGeometry( OBJECT_SIZE, OBJECT_SIZE, OBJECT_SIZE );
		var object = new THREE.Mesh( geo, new THREE.MeshPhongMaterial( { color: 0xFF0000, metal: true } ) );
		object.position = createRandomPositionWithinRoom();
		scene.add( object );
		objects.push( object );
	}
}

function createEmitters() {
	var colors = [ 	new THREE.Color( 0xff9100 ),
					new THREE.Color( 0xff0088 ),
					new THREE.Color( 0x00ff08 ),
					new THREE.Color( 0xf6ff00 ),
					new THREE.Color( 0x00fffb ) ]
	for ( o in objects ) {
		var c = Math.round( Math.random() * 5 );
		hibana.addEmitter( objects[o], { particle_color: colors[c], jitter_factor: 0.1 } )
	}
}

function createRandomPositionWithinRoom() {
	var x = createRandomCoordinateWithinRoom();
	var y = createRandomCoordinateWithinRoom();
	var z = createRandomCoordinateWithinRoom();
	
	return new THREE.Vector3( x, y, z );
}

function createRandomCoordinateWithinRoom() {
	var maxDistanceFromCenter = ROOM_DIM / 2 - OBJECT_SIZE * 2;
	return Math.random() * 2 * maxDistanceFromCenter - maxDistanceFromCenter;
}

function createLights() {
	var point_light = new THREE.PointLight( 0xFFFFFF, 0.6);
	point_light.position.set( 0, 0, 0 );
	scene.add( point_light );
	var camera_light = new THREE.PointLight( 0xFFFFFF, 0.3);
	camera_light.position = camera.position;
	scene.add( camera_light );
}




function animate() {
	
	requestAnimationFrame( animate );
	render();
	
}

function render() {
	azimuth = calculateCameraAngleFromMouse( azimuth, mouse_x );
	zenith = calculateCameraAngleFromMouse( zenith, mouse_y );
	decayCameraRotationalVelocity();
	camera.position.x = CAMERA_RADIUS * Math.sin( azimuth );
	camera.position.y = CAMERA_RADIUS * -Math.sin( zenith );
	camera.lookAt( CAMERA_TARGET );
	
	orbitObjects();
	hibana.age();
	
	renderer.render( scene, camera );
	
}

function calculateCameraAngleFromMouse( angle, mouse ) {
	if ( mouse != 0 && angle != 0 )
		return angle + mouse * MOUSE_SPEED *  ( 1 - ((mouse * angle) / Math.abs(mouse * angle))  * (Math.abs(angle)/ MAX_CAMERA_ANGLE) );
	else
		return angle + mouse * MOUSE_SPEED * ( 1 - (Math.abs(angle) / MAX_CAMERA_ANGLE) );
}

function decayCameraRotationalVelocity() {
	if ( mouse_decay ) {
		if ( Math.abs( mouse_x ) > 0.1 && Math.abs( mouse_y ) > 0.1 ) {
			mouse_x /= 1.1;
			mouse_y /= 1.1;
		} else {
			mouse_decay = false;
			mouse_x = mouse_y = 0;
		}
	} else if ( !mouse_is_down ) {
		var difference_x = CAMERA_HOME.x - camera.position.x;
		var difference_y = CAMERA_HOME.y - camera.position.y;
		mouse_x = Math.abs(difference_x) > 0.1 ? (difference_x / 10.0) * 6.0 : 0;
		mouse_y = Math.abs(difference_y) > 0.1 ? -(difference_y / 10.0) * 6.0 : 0;
	}
}

function orbitObjects() {
	var THETA = Math.PI / 200.0;
	if ( !areOrbiting )
		return;
	for ( o in objects ) {
		objects[o].position.x = objects[o].position.x * Math.cos( THETA ) - objects[o].position.z * Math.sin( THETA );
		objects[o].position.z = objects[o].position.z * Math.cos( THETA ) + objects[o].position.x * Math.sin( THETA );
	}	
}