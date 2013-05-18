// requires node-minify: npm install -g node-minify
var compressor = require('node-minify');

// docs require yuidoc: npm install -g yuidocjs
// var Y = require('yuidocjs');

new compressor.minify({
    type: 'gcc',
    fileIn: [
      '../src/astar/astar.js',
      '../src/astar/graph.js',
      '../src/Utils.js',
      '../src/Box2DUtils.js',
      '../src/b2d/b2Separator.js',
      '../src/contact/BoxledJSContactListener.js',
      '../src/contact/PlatformerContactListener.js',
      '../src/ObjectLayer.js',
      '../src/TileLayer.js',
      '../src/Map.js'
    ],
    fileOut: '../lib/boxledjs-0.1.1.min.js',
    callback: function(err){
        console.log(err);
    }
});