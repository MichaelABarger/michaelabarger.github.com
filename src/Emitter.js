/*
Emitter.js (https://github.com/MichaelABarger/HIBANA.js/src/Emitter.js)
part of the HIBANA.js open-source project
@author Michael A Barger

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

HIBANA.Emitter = function ( object, parameters ) {

	for ( p in HIBANA.Emitter.prototype )
		this[p] = HIBANA.__clone(HIBANA.Emitter.prototype[p]);

	for ( p in parameters )
		this[p] = HIBANA.__clone(parameters[p]);

	this.active_particles = [];

	this.next_particle = 0;
	

	this.__makeMaterial = function () {
		this.material = new THREE.ParticleBasicMaterial( { 	size: this.particle_size,
															color: 0xFFFFFF,
															map: this.texture,
															blending: THREE.AdditiveBlending,
															vertexColors: true,
															transparent: true,
															overdraw: true,
															depthWrite: false } );
	};
	


	this.starting_position = THREE.GeometryUtils.randomPointsInGeometry( object.geometry, this.particle_count );
	
	this.texture = this.texture || this.__makeDefaultTexture();
	
	this.geometry = new THREE.Geometry();
	this.geometry.colors = [];
	for ( var i = 0; i < this.particle_count; i++ ) {
		this.geometry.vertices.push( new THREE.Vector3().copy( this.hidden_point ) );
		this.geometry.colors.push( this.particle_color.clone() );
	}
	this.geometry.dynamic = true;
	

	// generate the starting velocities	
	this.generateStartingVelocities = function () {
		this.starting_velocity = [];
		if ( this.angle == 0.0 ) {
			var linear = new THREE.Vector3( 0, this.force, 0 );
			for ( i = 0; i < this.particle_count; i++ )
				this.starting_velocity.push( linear.clone() );
		} else {
			for ( i = 0; i < this.particle_count; i++ ) {
				var zenith = Math.random() * this.angle * 2 - this.angle;
				var azimuth = Math.random() * Math.PI * 2;
				this.starting_velocity.push( new THREE.Vector3( this.force * Math.sin(zenith) * Math.sin(azimuth),
																this.force * Math.cos(zenith),
																this.force * Math.sin(zenith) * Math.cos(azimuth) ) );
			}
		}
	};
	this.generateStartingVelocities();

	this.__makeMaterial();
	
	this.system = new THREE.ParticleSystem( this.geometry, this.material );
	this.system.position = object.position;
	this.system.sortParticles = true;
	object.parent.add( this.system );
	
	
	this.clear = function() {
		for ( p in this.active_particles ) {
			this.active_particles[p].vertex.copy( this.hidden_point );
			this.active_particles[p].color.copy( this.particle_color );
		}
		this.active_particles = [];
	};

	this.age = function () {

		if ( this.paused ) return this;

		// generate new particles	
		var r = 100 * Math.random();
		for ( var i = 0; i < Math.floor( r / (101.0 - this.rate)); i++ ) {
			if ( this.active_particles.length > this.geometry.vertices.length )
				break;

			var new_particle = {};
			
			new_particle.vertex = this.geometry.vertices[ this.next_particle ];
			new_particle.color = this.geometry.colors[ this.next_particle ];
			new_particle.vertex.copy( this.starting_position[ this.next_particle ] );
			new_particle.age = 0;
			new_particle.life_expectancy = this.particle_life_min + Math.random() * this.particle_life_range;
			new_particle.velocity = this.starting_velocity[ this.next_particle ].clone();
			
			this.active_particles.push( new_particle );
			
			if ( ++this.next_particle >= this.geometry.vertices.length )
				this.next_particle = 0;
		}
	
	
		// age active particles
		for ( p in this.active_particles ) {
			var particle = this.active_particles[p];
			if ( ++particle.age > particle.life_expectancy ) {
				particle.vertex.copy( this.hidden_point );
				particle.color.copy( this.particle_color );
				this.active_particles.splice( p, 1 );
			} else {
				if ( this.jitter && !particle.velocity.isZero() ) {
					var random_offset = Math.random() * this.jitter * 2 - this.jitter;
					var perpendicular_U = particle.velocity.clone().crossSelf( this.__UNIT ).normalize().multiplyScalar( random_offset );
					if ( perpendicular_U.isZero() )
						perpendicular_U = particle.velocity.clone().crossSelf( this.__UNIT.negate() ).normalize().multiplyScalar( random_offset );
					var perpendicular_V = perpendicular_U.clone().crossSelf( particle.velocity ).normalize().multiplyScalar( random_offset );
					particle.velocity.addSelf( perpendicular_U );
					particle.velocity.addSelf( perpendicular_V );
				}

				particle.vertex.addSelf( particle.velocity );
				if ( HIBANA.Universal.is_active )
					particle.velocity.addSelf( HIBANA.Universal.force );
			}
		}
		
		this.geometry.verticesNeedUpdate = true;
		this.geometry.colorsNeedUpdate = false;
		return this;
	};
	
	this.pause = function () { this.paused = true; return this; };
	this.play = function () { this.paused = false; return this; };
	this.togglePause = function() { this.paused = !this.paused; return this; };
	
	this.setParticleColor = function ( particle_color ) {
		this.particle_color = particle_color;
		this.__makeMaterial();
		this.system.material = this.material;
		return this;
	};
	this.getParticleColor = function () { return this.particle_color; };
	
	this.setRate = function ( rate ) { this.rate = rate; return this; };
	this.getRate = function () { return this.rate; };
	
	this.setParticleLifetimeMin = function ( min ) { this.particle_life_min = min; return this; };
	this.getParticleLifetimeMin = function () { return this.particle_life_min };
	
	this.setParticleLifetimeRange = function ( range ) { this.particle_life_range = range; return this; };
	this.getParticleLifetimeRange = function () { return this.particle_life_range; };
	
	this.setAngle = function ( angle ) { 
		this.angle = angle;
		this.generateStartingVelocities();
		return this; 
	};
	this.getAngle = function () { return this.angle; };
	
	this.setForce = function ( force ) { 
		this.force = force;
		this.generateStartingVelocities();
		return this;
	};
	this.getForce = function () { return this.force; };
	
	this.setJitter = function ( jitter ) { this.jitter = jitter; return this; };
	this.getJitter = function () { return this.jitter; };
	
	this.setHiddenPoint = function ( hidden_point ) { this.hidden_point = hidden_point; return this; };
	this.getHiddenPoint = function () { return hidden_point; };
	
	this.setParticleSize = function ( particle_size ) {
		this.particle_size = particle_size;
		this.__makeMaterial();
		this.system.material = this.material;
		return this;
	};
	this.getParticleSize = function () { return particle_size; };
	
	this.setTexture = function ( texture ) {
		this.texture = texture;
		this.__makeMaterial();
		this.system.material = this.material;
		return this;
	};
	this.getTexture = function () { return this.texture; };
	
	
	return this;
};


HIBANA.Emitter.prototype = {

	constructor: 		HIBANA.Emitter,

	paused:			true,
	
	particle_count:		2000,
	
	rate:			75,
	
	particle_life_min:	10,
	
	particle_life_range:	25,
	
	angle:			0.0,
	
	force:			1.0,
	
	jitter:			0.0,
	
	hidden_point:		new THREE.Vector3( -1000, -1000, -1000 ),
	
	paused:			true,
	
	particle_size:		2.0,
	
	particle_color:		new THREE.Color( 0xFFFFFF ),

	__UNIT: new THREE.Vector3( 1, 1, 1 ).normalize(),

	__makeDefaultTexture: function () {
		var canvas = document.createElement( 'canvas' );
		canvas.width = 100;
		canvas.height = 100;

		var context = canvas.getContext( '2d' );
		var gradient = context.createRadialGradient( canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2 );
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
	}
};
