var boxledjs = boxledjs || {};

boxledjs.Const = {};
boxledjs.Const.scale = 32;

(function (scope) {
  /**
   * The Map represents a Tiled Map, it is created by passing the JSON data exported from Tiled in the constructor.
   * 
   * @class Map
   * @constructor
   * @param {Object} data The complete map-data as exported to JSON by Tiled.
   * @param {b2World} [b2dWorld] The Box2D b2World. Will be created automatically if not supplied.
   */
  function Map(data,b2dWorld) {
    this.initialize(data,b2dWorld);
  }
  var p = Map.prototype = new createjs.Container();

  Map.prototype.Container_init = Map.prototype.initialize;
  Map.prototype.initialize = function (data,b2dWorld) { 
    this.Container_init();

    this.b2dWorld = b2dWorld;
    this.data = data;

    this.reset();
  }

  Map.prototype.reset = function () {
    this.viewPort = {};
    this.layers = {};
    this.objects = {};
    this.objectGroups = {};
    this.pathfinding = {};

    if ( this.b2dWorld !== false && this.b2dWorld === undefined ) {
      boxledjs.Const.scale = parseFloat(this.data.properties.box2dScale)||boxledjs.Const.scale;
      this.b2dWorld = new Box2D.Dynamics.b2World(new Box2D.Common.Math.b2Vec2(parseFloat(this.data.properties.forceX)||0, parseFloat(this.data.properties.forceY)||20), true);
      var ctL = new boxledjs.PlatformerContactListener();
      this.b2dWorld.SetContactListener(ctL);
    }
    this.firstTick = false;

    this.generateTileSets();
  }

  Map.prototype.destroy = function() {
    var key, obj, layer;

    if ( this.b2dWorld ) {
      var node = this.b2dWorld.GetBodyList();
      while ( node ) {
        var b2Body = node;
        node = node.GetNext();
        this.b2dWorld.DestroyBody(b2Body);
        b2Body = null;
      }

      delete this.b2dWorld;
    }

    if ( this.parent ) this.parent.removeChild(this);

    for ( key in this.objects ) {
      obj = this.objects[key];
      if ( obj.destroy ) obj.destroy();
      if ( obj.parent ) {
        obj.parent.removeChild(obj);
        delete this.objects[key];
      }
    }

    delete this.objects;

    for ( key in this.layers ) {
      layer = this.layers[key];
      layer.destroy();
    }

    delete this.layers;

    this.removeAllChildren();

    return true;
  }

  Map.prototype.onTick = function(e) {
    !this._firstTick && this._onFirstTick();

    this.centerObject && this.centerTo(this.centerObject);
  }


  Map.prototype._onFirstTick = function() {
    var canvas = boxledjs.Utils.getStage(this).canvas;
    if ( this.viewPort.width == undefined ) this.viewPort.width = canvas.width; 
    if ( this.viewPort.height == undefined ) this.viewPort.height = canvas.height; 

    !this.b2dDebugDraw && this.setupDebugDraw(canvas);

    this._firstTick = true;
  }

  /**
   * Updates the world simulation, forces and force-fields are applied,
   * this should be called on every tick before the stage updates.
   *
   * @method update
   * @param  {Number} e Milliseconds since the last update (will default to 30).
   * 
   */
  Map.prototype.update = function(e) {
    if ( !this.initialized ) return;

    // the b2dWorld update
    if ( this.b2dWorld !== false && this.b2dWorld !== undefined ) {
      var body = this.b2dWorld.GetBodyList(),
          velIter = Box2D.Dynamics.b2World.s_timestep2.velocityIterations;
      while ( body ) {
        var userData = body.GetUserData(), properties = userData?userData.properties:{};
        if ( userData && userData.eventsToDispatch ) {
          while ( userData.eventsToDispatch.length ) {
            var eventData = userData.eventsToDispatch.pop();

            this.dispatchEvent(eventData);
          }
        }

        if ( !properties || properties.ignoreForces != true ) {
          if ( body.o_fieldForceX || body.o_fieldForceY ) {
            body.ApplyForce(new Box2D.Common.Math.b2Vec2((body.o_fieldForceX||0)*body.GetMass(),(body.o_fieldForceY||0)*body.GetMass()),body.GetWorldCenter());
          }

          if ( body.o_dynamicForceFields && body.o_dynamicForceFields.length ) {
            var gFactors = [], gFactor;
            for ( var c = 0, l = body.o_dynamicForceFields.length; c < l; c++ ) {
              var ffBody = body.o_dynamicForceFields[c];
              var f = parseFloat(ffBody.GetUserData().properties.force) || 0;
              var dirForce = new Box2D.Common.Math.b2Vec2(body.GetWorldCenter().x,body.GetWorldCenter().y);
              dirForce.Subtract(ffBody.GetWorldCenter())
              dirForce.Normalize();
              dirForce.Multiply(f);
              dirForce.Multiply(body.GetMass());
              
              if ( !isNaN(dirForce.x) && !isNaN(dirForce.y) ) {
                body.ApplyForce(dirForce, body.GetWorldCenter());
              }

              if ( ffBody.GetUserData().properties.gravityFactor != undefined ) {
                gFactors.push(parseFloat(ffBody.GetUserData().properties.gravityFactor));
              }
            }

            for ( c = 0, l = gFactors.length; c < l; c++ ) {
              gFactor = gFactor + gFactors[c] || gFactors[c];
            }

            if ( !isNaN(gFactor) ) {
              var negGrav = this.b2dWorld.GetGravity().GetNegative();
                  negGrav.Multiply(1 - (gFactor/gFactors.length));
                  negGrav.Multiply(body.GetMass());
                  body.ApplyForce(negGrav, body.GetWorldCenter());
                }
          }
        }
        
        body = body.GetNext();
      }
      this.b2dWorld && this.b2dWorld.Step((e||30)/1000, 10, 10);
      this.b2dWorld && this.b2dWorld.ClearForces();
    }
  }

  /**
   * Sets up the Box2D DebugDraw, this is usually done automatically by the map,
   * but can be called from the outside to setup the DebugDraw with a different canvas.
   * 
   * @method setupDebugDraw
   * @param  {HTMLCanvasElement} canvas
   * @return {b2DebugDraw}
   */
  Map.prototype.setupDebugDraw = function(canvas) {
    if ( !this.b2dWorld ) return null;

    this.b2dDebugDraw = new Box2D.Dynamics.b2DebugDraw();
    this.b2dDebugDraw.SetSprite(canvas.getContext("2d"));
    this.b2dDebugDraw.SetDrawScale(boxledjs.Const.scale);
    this.b2dDebugDraw.SetFillAlpha(0.35);
    this.b2dDebugDraw.SetFlags(Box2D.Dynamics.b2DebugDraw.e_shapeBit | Box2D.Dynamics.b2DebugDraw.e_jointBit);
    this.b2dWorld.SetDebugDraw(this.b2dDebugDraw);

    return this.b2dDebugDraw;
  }

  /**
   * Draws the Box2D DebugData to the previously setup canvas.
   * The target canvas is the same as the createjs.Stage if not
   * defined otherwise.
   *
   * @method drawDebugData
   * @param  {Number} alpha
   * 
   */
  Map.prototype.drawDebugData = function(alpha) {
    if ( !this.b2dWorld ) return;

    alpha = alpha || 1;
    this.b2dDebugDraw.SetFillAlpha(0.35 * alpha);
    this.b2dDebugDraw.SetAlpha(1 * alpha);
    this.b2dDebugDraw.GetSprite().save();
    this.b2dDebugDraw.GetSprite().scale(this.scaleX,this.scaleY);
    this.b2dDebugDraw.GetSprite().translate((-this.regX+this.x/this.scaleX),(-this.regY+this.y/this.scaleY));
    this.b2dWorld.DrawDebugData();
    this.b2dDebugDraw.GetSprite().restore();
  }

  /**
   * Sets up the layers from the Tiled map
   *
   * @method setupLayers
   * @protected
   * 
   */
  Map.prototype.setupLayers = function() {
    var c,l,layerData,layer,grid = [];
    for ( c = 0, l = this.data.layers.length; c < l; c++ ) {
      layerData = this.data.layers[c];
      if ( layerData.type == 'tilelayer' ) {
        layer = new boxledjs.TileLayer(layerData,this);
        this.addChild(layer);

        // create the combined graph for pathfinding
        var layerGrid = layer.pathfinding.graph.input;
        for ( var y = 0, ly = layerGrid.length; y < ly; y++ ) {
          var layerRow = layerGrid[y];
          var row = grid[y] || []; grid[y] = row;
          for ( var x = 0, lx = layerRow.length; x < lx; x++ ) {
            row[x] = (row[x]||1) & layerRow[x];
          }
        }

        if ( layerData.name && layerData.name != '' ) {
          this.layers[layerData.name] = layer;
        }
      }
    }

    for ( c = 0, l = this.data.layers.length; c < l; c++ ) {
      layerData = this.data.layers[c];
      if ( layerData.type == 'objectgroup' ) {
        layer = new boxledjs.ObjectLayer(layerData,this);
        this.addChild(layer);

        if ( layerData.name && layerData.name != '' ) {
          this.layers[layerData.name] = layer;
        }
      }
    }

    this.pathfinding.graph = new Graph(grid);
    //console.log(this.pathfinding.graph.toString());
  }

  /**
   * Centers the 'camera' to the given object, this can be either
   * a Box2D Body or an createjs.DisplayObject
   *
   * @method centerTo
   * @param  {createjs.DisplayObject | Box2D.Dynamics.b2Body} object The object to center the 'camera' on.
   * 
   */
  Map.prototype.centerTo = function(object) {
    if ( typeof(object) == 'string' ) {
      object = this.objects[object];
    }

    if ( !object || object == undefined )
      return;

    var x,y;
    if ( object.GetPosition ) {
      var pt = object.GetPosition();
      x = pt.x * boxledjs.Const.scale;
      y = pt.y * boxledjs.Const.scale;
    } else if ( object.x != undefined && object.y != undefined ) {
      x = object.x;
      y = object.y;
    }

    if ( x == undefined || y == undefined )
      return;
    
    var pw = this.viewPort.width || 0,
        ph = this.viewPort.height || 0;

    this.regX = x;
    this.regY = y;

    this.x = pw / 2;
    this.y = ph / 2;
  }

  Map.prototype.calculatePath = function(start, end, diagonal, onlyJumpPoints) {
    var nodes = this.pathfinding.graph.nodes;
    start = nodes[start.x][start.y];
    end = nodes[end.x][end.y];
    var path = astar.search(nodes, start, end, diagonal);
    if ( path && path.length && onlyJumpPoints === true ) {
      var quit = false,cx,cy,ccx,ccy;

      for ( var c = 0; c < path.length-2; c++ ) {
        
        quit = false;
        while ( !quit && path[c+2] ) {
          cx = path[c].x - path[c+1].x;
          cy = path[c].y - path[c+1].y;
          ccx = path[c].x - path[c+2].x;
          ccy = path[c].y - path[c+2].y;
          if ( (ccx == 0 && cx == 0) || (ccy == 0 && cy == 0) ) {
            path.splice(c+1,1);
          } else {
            quit = true;
          }
        } 
      }
    }

    return path;
  }

  /**
   * Generates the SpriteSheets from the Tiled tilesets
   *
   * @method generateTileSets
   * @protected
   * 
   */
  Map.prototype.generateTileSets = function() {
    this.tilesets = [];
    this.tileproperties = {};
    this.loadedSets = 0;
    for ( var c = 0, l = this.data.tilesets.length; c < l; c++ ) {
      var ss = Map.convertTileSetToSpriteSheet(this.data.tilesets[c]);
      this.tilesets.push(ss);
      for ( var key in ss.tileproperties ) {
        var tileProp = ss.tileproperties[key];
        for ( var tkey in tileProp ) {
          var prop = tileProp[tkey];
          if ( prop.indexOf('[') == 0 ) {
            tileProp[tkey] = JSON.parse(prop);
          }
        }
        this.tileproperties[key] = tileProp;
      }
      if (!ss.complete) {
        var self = this;
        ss.addEventListener("complete", function() { self.setsLoaded(); });
      } else {
        this.loadedSets++;
      }
    }

    if ( this.loadedSets == l ) {
      this.setsLoaded();
    }
  }

  Map.prototype.setsLoaded = function() {
    this.setsLoaded++;

    if ( this.loadedSets == this.data.tilesets.length ) {
      this.setupLayers();
      this.initialized = true;
    }
  }

  /**
   * Return the tileset-frame based on a given Tiled tileid.
   * Note: Tiled tileids are 1-based, createjs.SpriteSheet-frames are 0-based.
   * This methods requires 1-based tileids.
   *
   * @method getTileById
   * @param  {int} tileid
   * @return {Object} a generic object with image and rect properties. Returns null if the frame does not exist, or the image is not fully loaded.
   */
  Map.prototype.getTileById = function(tileid) {
    tileid -= 1;
    return this.getSpriteSheetByTileId(tileid).getFrame(tileid);
  }

  /**
   * Returns the SpriteSheet for a given Tiled tileid.
   * Note: Tiled tileids are 1-based, createjs.SpriteSheet-frames are 0-based.
   * This methods requires 1-based tileids.
   *
   * @method getSpriteSheetByTileId
   * @param  {int} tileid
   * @return {createjs.SpriteSheet}
   */
  Map.prototype.getSpriteSheetByTileId = function(tileid) {
    tileid = tileid || 1;

    var sheets = this.tilesets,c,l,sheet,
        currentGid = 0, returnSheet;
    for ( c = 0, l=sheets.length; c < l; c++ ) {
      sheet = sheets[c];
      if ( sheet.firstgid <= tileid && sheet.firstgid > currentGid ) {
        returnSheet = sheet;
      }
    }

    return returnSheet;
  }

  /**
   * Returns the tile-properties for a given Tiled tileid.
   * Note: Tiled tileids are 1-based, createjs.SpriteSheet-frames are 0-based.
   * This methods requires 1-based tileids.
   *
   * @method getTileProperties
   * @param  {int} tileid
   * @return {Object} a generic object containing the tile properties.
   */
  Map.prototype.getTileProperties = function(tileid) {
    tileid -= 1;
    return this.tileproperties[tileid];
  }
  
//=========================
// STATIC METHODS
//=========================
  Map.convertTileSetToSpriteSheet = function(tileset) {
    var data = {};
    data.images = [tileset.image];
    data.frames = {width:tileset.tilewidth,height:tileset.tileheight};
    var ss = new createjs.SpriteSheet(data);
    ss.firstgid = tileset.firstgid;
    ss.tileproperties = tileset.tileproperties;

    return ss;
  }

  scope.Map = Map; 
} (boxledjs));