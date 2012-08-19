/*
HIBANA.js (https://github.com/MichaelABarger/HIBANA.js/src/HIBANA.js)
Part of the HIBANA.js open-source project, a WebGL particle engine for Three.js

@author Michael A Barger (mikebarger@gmail.com)

The MIT License

Copyright (c) 2012 HIBANA.js authors.

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

var HIBANA = {

	age: function () { HIBANA.Emitters.all( "age" ); },
	
	Emitters: { 

		ref: [],

		all: function ( method_name, arg ) {
			for ( e in HIBANA.Emitters.ref )
				HIBANA.Emitters.ref[e][method_name]( arg );
		},
		
		add: function ( object, parameters ) {
			var new_emitter = new HIBANA.Emitter( object, parameters );
			HIBANA.Emitters.ref.push( new_emitter );
			return new_emitter;
		},
		
		setDefaultParameters: function ( parameters ) {
			for ( p in parameters )
				HIBANA.Emitters._default_parameters[p] = HIBANA._clone( parameters[p] );
		},

		_defaultParameters: {

			paused:			true,
			particle_count:		2000,
			rate:			75,
			particle_life_min:	10,
			particle_life_range:	25,
			angle:			0.0,
			force_min:		0.03,
			force_range:		0.03,
			jitter:			0.0,
			random:			0.0,
			waviness:		0.0,
			hidden_point:		new THREE.Vector3( -1000, -1000, -1000 ),
			paused:			true,
			particle_size:		2.0,
			particle_color:		new THREE.Color( 0xFFFFFF ),
			texture: 		(function () {
				var canvas = document.createElement( 'canvas' );
				canvas.width = 50;
				canvas.height = 50;

				var context = canvas.getContext( '2d' );
				var gradient = context.createRadialGradient( canvas.width / 2, 
						canvas.height / 2, 0, canvas.width / 2,
						canvas.height / 2, canvas.width / 2 );
				gradient.addColorStop( 0, 'rgba(255,255,255,1.0)' );
				gradient.addColorStop( 0.15, 'rgba(255,255,255,.9)' );
				gradient.addColorStop( 0.3, 'rgba(255,255,255,.6)' );
				gradient.addColorStop( 0.5, 'rgba(255,255,255,.3)' );
				gradient.addColorStop( 0.7, 'rgba(255,255,255,.1)' );
				gradient.addColorStop( 1, 'rgba(0,0,0,0)' );

				context.fillStyle = gradient;
				context.fillRect( 0, 0, canvas.width, canvas.height );
				
				var texture = new THREE.Texture( canvas );
				texture.needsUpdate = true;
				
				return texture;
			}())
		}
	},
		
		
	Universal:	{

		force: new THREE.Vector3( 0.0, -0.05, 0.0 ),
		
		is_active: false,
		
		set: function( force ) { HIBANA.Universal.force = force; },

		add: function( force ) { HIBANA.Universal.force.addSelf( force ); },

		remove: function( force ) { HIBANA.Universal.force.subSelf( force ); },
		
		activate: function() { HIBANA.Universal.is_active = true; },
		
		deactivate: function() { HIBANA.Universal.is_active = false; },
		
		toggle: function() { HIBANA.Universal.is_active = !HIBANA.Universal.is_active; }
	},
	

	// JavaScript Clone code found on Keith Devens' blog, as written by him in collaboration with his readers
	_clone: function ( obj ) {
		if ( obj == null || typeof(obj) != 'object' )	
			return obj;
		var temp = {};
		for ( var key in obj )
			temp[key] = HIBANA._clone( obj[key] );
		return temp;
	}
};
