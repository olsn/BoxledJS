boxledjs = boxledjs || {};
(function (scope) {
  /**
   * The TileLayer parses all tilelayers as exported by Tiled to JSON.
   * 
   * @class TileLayer
   * @constructor
   * @param {Object} data The tilelayer-data as exported to JSON by Tiled.
   * @param {Map} map The map this ObjectLayer is created for.
   */
  function TileLayer(data,map) {
    this.initialize(data,map);
  }
  TileLayer.prototype = new createjs.Container();
  
  TileLayer.prototype.Container_init = TileLayer.prototype.initialize;
  
  TileLayer.prototype.initialize = function (data,map) { 
    this.Container_init();

    this.data = data;
    this.properties = data.properties;
    this.map = map;

    this.reset();
  }

  TileLayer.prototype.reset = function () {
    this.x = this.data.x;
    this.y = this.data.y;
    this.visible = this.data.visible;
    this.alpha = this.data.opacity != undefined ? parseFloat(this.data.opacity) : 1;
    this.numTilesX = this.data.width;
    this.numTilesY = this.data.height;
    this.isCollisionLayer = this.properties && this.properties.collisionLayer && this.properties.collisionLayer != 'false';
    if ( this.isCollisionLayer ) {
      this.colTilesToCheck = [];
      this.colTileGroups = [];
    }

    this.pathfinding = {};

    this.drawTiles();

    this.data.properties.cached !== 'false' && this.cache(0, 0, this.map.data.tilewidth*this.numTilesX, this.map.data.tileheight*this.numTilesY);

    if ( this.isCollisionLayer ) {
      
      // only calculate the b2dCollision Shapes if a world exists
      if ( this.map.b2dWorld ) {
        this.calculateCollisionShapes();
      }
    }
  }

  /**
   * Draws the actual tiles to the container
   * and creates a Graph-Map for pathfinding.
   *
   * @method drawTiles
   * @protected
   */
  TileLayer.prototype.drawTiles = function() {
    var tiledata = this.data.data,
        x,y,tile_array_pos,tileid,frame,bm,properties,open,
        graphGrid = [], graphRow,objectData;

    this.tileObjects = [];
    for ( x = 0; x < this.numTilesY; x++ ) {
      graphRow = [];
      for ( y = 0; y < this.numTilesX; y++ ) {
        tile_array_pos = y * this.numTilesX + x;
        tileid = tiledata[tile_array_pos];
        properties = this.map.getTileProperties(tileid);
        if ( tileid != 0 ) {
          if ( properties.type && properties.type != '' ) {
            objectData = {};
            objectData.properties = properties;
            objectData.x = x;
            objectData.y = y;
            bm = boxledjs.ObjectLayer.makeObjectFromData(objectData);
          } else {
            frame = this.map.getTileById(tileid);
            bm = new createjs.Bitmap(frame.image);
            bm.sourceRect = frame.rect;
          }
          bm.x = x * this.map.data.tilewidth;
          bm.y = y * this.map.data.tileheight;
          this.addChild(bm);

          this.tileObjects[tile_array_pos] = bm;
        }
        
        if ( this.isCollisionLayer ) {
          this.colTilesToCheck[tile_array_pos] = tileid;
          open = !Box2DUtils.isTileCollideable(properties, tileid);
        } else {
          open = !properties || properties.passable != 'false';
        }
        graphRow.push(open? GraphNodeType.OPEN : GraphNodeType.WALL);
      }
      graphGrid.push(graphRow);
    }

    this.pathfinding.graph = new Graph(graphGrid);
  }

  /**
   * Calculates the collision shapes, if the layer was marked as a collisionLayer in Tiled.
   * 
   * @method calculateCollisionShapes
   * @protected
   */
  TileLayer.prototype.calculateCollisionShapes = function() {
    var tile_array_pos,tileid,x,y,c,l,tw = this.map.data.tilewidth,th = this.map.data.tileheight;

    for ( y = 0; y < this.numTilesY; y++ ) {
      for ( x = 0; x < this.numTilesX; x++ ) {
        tile_array_pos = y * this.numTilesX + x;
        tileid = this.colTilesToCheck[tile_array_pos];
        if ( tileid != undefined && tileid != 0 ) {
          this.colTileGroups.push({tiles:[]});
          this.findNextCollisionShapeTile(x,y);
        }
      }
    }

    for ( c = 0, l = this.colTileGroups.length; c < l; c++ ) {
      var group = this.colTileGroups[c],
          tiles = group.tiles;
      var x = tiles[0].x, y = tiles[0].y, width = tiles[tiles.length-1].x-x+1, height = 1,
          properties = this.map.getTileProperties(group.tileid) || {};
      var objectData = {
        x:x * tw,
        y:y * th,
        width:width * tw,
        height:height * th,
        properties:properties
      }

      var body = boxledjs.Box2DUtils.makeB2DBodyFromData(objectData, this.map.b2dWorld);
      body.SetUserData(this.tileObjects[y * this.numTilesX + x]);
    }
  }

  /**
   * Finds a set of shapes in a row (only horizontal currently)
   * 
   * @method findNextCollisionShapeTile
   * @protected
   */
  TileLayer.prototype.findNextCollisionShapeTile = function(x,y) {
    x = x || 0;
    y = y || 0;
    var tile_array_pos,tileid,currentShape;
    tile_array_pos = y * this.numTilesX + x;
    tileid = this.colTilesToCheck[tile_array_pos];

    if ( tileid != undefined && tileid != 0 ) {
      currentShape = this.colTileGroups[this.colTileGroups.length-1];
      currentShape.tileid = currentShape.tileid || tileid;
      if ( !Object.equals(
        this.map.getTileProperties(tileid),
        this.map.getTileProperties(currentShape.tileid)
      ) ) return;
      
      currentShape.tiles.push({x:x,y:y,tileid:tileid});
      this.colTilesToCheck[tile_array_pos] = undefined

      this.findNextCollisionShapeTile(x+1,y);
    }
  }
  
  scope.TileLayer = TileLayer; 
} (boxledjs));