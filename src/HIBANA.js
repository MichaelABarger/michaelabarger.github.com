/*
HIBANA.js (https://github.com/MichaelABarger/HIBANA.js/src/HIBANA.js)
part of the HIBANA.js open-source project
@author Michael A Barger

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

	age: function () { this.Emitters.all( "age" ); },
	
	Emitters: { 
		ref: [],

		all: function ( method_name, arg ) {
			var result = [];
			if ( arg === undefined ) {
				for ( i in this.ref )
					result.push( this.ref[i][method_name]() );
			} else {
				for ( i in this.ref )
					result.push( this.ref[i][method_name]( arg ) );
			}
			return result;
		},
		
		add: function ( object, parameters ) {
			var new_emitter = new HIBANA.Emitter( object, parameters );
			this.ref.push( new_emitter );
			return new_emitter;
		},
		
		setDefaultParameters: function ( parameters ) {
			for ( p in parameters )
				HIBANA.Emitter.prototype[p] = parameters[p];
		},
	},
		
		
	Universal:	{
		force: new THREE.Vector3( 0.0, -0.05, 0.0 ),
		
		is_active: false,
		
		set: function( force ) { this.force = force; return this; },

		get: function() { return this.force; },
	
		add: function( force ) { this.force.addSelf( force ); return this; },

		remove: function( force ) { this.force.subSelf( force ); return this; },
		
		activate: function() { this.is_active = true; },
		
		deactivate: function() { this.is_active = false; },
		
		toggle: function() { this.is_active = !this.is_active; }
	},
	
	// JavaScript Clone code found on Keith Devens' blog, as written by him in collaboration with his readers
	__clone: function ( obj ) {
		if ( obj == null || typeof(obj) != 'object' )	
			return obj;
		var temp = {};
		for ( var key in obj )
			temp[key] = HIBANA.__clone( obj[key] );
		return temp;
	}
};
