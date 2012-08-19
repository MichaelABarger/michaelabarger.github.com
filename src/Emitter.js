/*
Emitter.js (https://github.com/MichaelABarger/HIBANA.js/src/Emitter.js)
Part of the HIBANA.js open-source project, a WebGL particle engine for Three.js

@author Michael A Barger (mikebarger@gmail.com)

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

	for ( p in HIBANA.Emitters._defaultParameters )
		this[p] = HIBANA.Emitters._defaultParameters[p];		
	for ( p in parameters )
		this[p] = HIBANA._clone(parameters[p]);


	this.active_particles = [];
	this.next_particle = 0;

	this.starting_position = THREE.GeometryUtils.randomPointsInGeometry( object.geometry, this.particle_count );
	
	this.geometry = new THREE.Geometry()
	this.geometry.colors = [];
	for ( var i = 0; i < this.particle_count; i++ ) {
		this.geometry.vertices.push( new THREE.Vector3().copy( this.hidden_point ) );
		this.geometry.colors.push( this.particle_color.clone() );
	}
	this.geometry.dynamic = true;
	

	this._generateStartingVelocities();

	this._makeMaterial();
	
	this.system = new THREE.ParticleSystem( this.geometry, this.material );
	this.system.position = object.position;
	this.system.sortParticles = true;
	object.parent.add( this.system );

	return this;
};


HIBANA.Emitter.prototype = {

	constructor: HIBANA.Emitter,

	clear: function() {
		for ( p in this.active_particles ) {
			this.active_particles[p].vertex.copy( this.hidden_point );
			this.active_particles[p].color.copy( this.particle_color );
		}
		this.active_particles = [];
	},

	age: function () {

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
			new_particle.velocity = new_particle.starting_velocity = this.starting_velocity[ this.next_particle ].clone();
			
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
				if ( this.jitter > 0.0 || this.random > 0.0 ) {
					var velocity = particle.velocity;
					var U = new THREE.Vector3().cross( velocity, velocity.clone().addSelf( this._UNIT ) );
					var V = new THREE.Vector3().cross( U, velocity );
					if ( this.jitter > 0.0 ) {
						var offset = Math.random() * this.jitter - this.jitter / 2.0;
						var dP = new THREE.Vector3().add( U, V ).normalize().multiplyScalar( offset );
						particle.vertex.addSelf( dP );
					}
					if ( this.random > 0.0 ) {
						var offset = Math.random() * this.random - this.random / 2.0;
						var dV = new THREE.Vector3().add( U, V ).normalize().multiplyScalar( offset );
						particle.velocity.addSelf( dV );
					}
				}
				if ( this.waviness > 0.0 ) {
					var starting_velocity = particle.starting_velocity;
					var Q = new THREE.Vector3().cross( starting_velocity, starting_velocity.clone().addSelf( this._UNIT ) );
					var R = new THREE.Vector3().cross( Q, starting_velocity );
					var offset = Math.random() * this.waviness - this.waviness / 2.0;
					var dV = new THREE.Vector3().add( Q, R ).normalize().multiplyScalar( offset );
					particle.velocity.addSelf( dV );
				}
				if ( HIBANA.Universal.is_active )
					particle.velocity.addSelf( HIBANA.Universal.force );
				particle.vertex.addSelf( particle.velocity );
			}
		}
		
		this.geometry.verticesNeedUpdate = true;
		this.geometry.colorsNeedUpdate = false;
		return this;
	},


	
	pause: function () { this.paused = true; return this; },
	play: function () { this.paused = false; return this; },
	togglePause: function() { this.paused = !this.paused; return this; },

	setParticleColor: function ( particle_color ) {
		this.particle_color = particle_color;
		this._makeMaterial();
		this.system.material = this.material;
		return this;
	},
	setParticleTexture: function ( texture ) {
		this.texture = texture;
		this._makeMaterial();
		this.system.material = this.material;
		return this;
	},
	setParticleSize: function ( particle_size ) {
		this.particle_size = particle_size;
		this._makeMaterial();
		this.system.material = this.material;
		return this;
	},
	setParticleLifetimeMin: function ( min ) { this.particle_life_min = min; return this; },
	setParticleLifetimeRange: function ( range ) { this.particle_life_range = range; return this; },

	setRate: function ( rate ) { this.rate = rate; return this; },
	setAngle: function ( angle ) { 
		this.angle = angle;
		this._generateStartingVelocities();
		return this; 
	},
	setForceMin: function ( force_min ) { 
		this.force_min = force_min;
		this._generateStartingVelocities();
		return this;
	},
	setForceRange: function ( force_range ) {
		this.force_range = force_range;
		this._generateStartingVelocities();
		return this;
	},
	setJitter: function ( jitter ) { this.jitter = jitter; return this; },
	setRandom: function ( random ) { this.random = random; return this; },
	setWaviness: function ( waviness ) { this.waviness = waviness; return this; },

	_generateStartingVelocities: function () {
		this.starting_velocity = [];
		if ( this.angle == 0.0 ) {
			var linear = new THREE.Vector3( 0, 1, 0 );
			for ( i = 0; i < this.particle_count; i++ ) {
				var force = this.force_min + this.force_range * Math.random(); 
				this.starting_velocity.push( linear.clone().multiplyScalar( force ) );
			}
		} else {
			for ( i = 0; i < this.particle_count; i++ ) {
				var force = this.force_min + this.force_range * Math.random();
				var zenith = Math.random() * this.angle * 2 - this.angle;
				var azimuth = Math.random() * Math.PI * 2;
				this.starting_velocity.push( new THREE.Vector3( force * Math.sin(zenith) * Math.sin(azimuth),
							force * Math.cos(zenith),
							force * Math.sin(zenith) * Math.cos(azimuth) ) );
			}
		}
	},

	_makeMaterial: function () {
		this.material = new THREE.ParticleBasicMaterial( { size: this.particle_size,
								   color: 0xFFFFFF,
								   map: this.texture,
								   blending: THREE.AdditiveBlending,
								   vertexColors: true,
								   transparent: true,
								   overdraw: true,
								   depthWrite: false } );
	},

	_UNIT: new THREE.Vector3( 1, 1, 1 ).normalize()
};
