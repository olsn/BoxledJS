boxledjs = boxledjs || {};
(function (scope) {
  /**
   * An ObjectLayer holds objects such as Box2D bodies or custom classes
   * 
   * @class ObjectLayer
   * @constructor
   * @param {Object} data The complete map-data as exported to JSON by Tiled.
   * @param {Map} map The map this ObjectLayer is created for.
   */
  function ObjectLayer(data,map) {
    this.initialize(data,map);
  }
  ObjectLayer.prototype = new createjs.Container();
  
  ObjectLayer.prototype.Container_init = ObjectLayer.prototype.initialize;
  
  ObjectLayer.prototype.initialize = function (data,map) { 
    this.Container_init();

    this.data = data;
    this.properties = data.properties;
    this.objects = {};
    this.map = map;

    this.reset();
  }

  ObjectLayer.prototype.reset = function () {
    this.initObjects();
  }

  ObjectLayer.prototype.onTick = function() {
    if ( this.zSorting !== false ) {
      this.sortChildren(this.compareChildY);
    }
  }
  ObjectLayer.prototype.compareChildY = function(a,b) {
    if (a.y < b.y)
       return -1;
    if (a.y > b.y)
      return 1;
    return 0;
  }

  /**
   * Initializes all objects from the Tiled-map, by "objects" all non-tile-elements are meant. (e.g. custom Collision-shapes)
   * This is usually called on instatiation of the Layer and doesn't need to be executed from the outside.
   * 
   * @method initObjects
   * @protected
   */
  ObjectLayer.prototype.initObjects = function() {
    var c,l,objectData,object;

    for ( c = 0, l = this.data.objects.length; c < l; c++ ) {
      objectData = this.data.objects[c];
      //if it has a type, use the type to create a custom object
      if (objectData.type && objectData.type != '') {
        object = ObjectLayer.makeObjectFromData(objectData);
      } else if ( this.map.b2dWorld ) { //else create a Box2D object from it
        object = boxledjs.Box2DUtils.makeB2DBodyFromData(objectData,this.map.b2dWorld);
      } else {
        var msg = 'Couldn\'t create b2Body from objectData, because map.b2dWorld is ' +  this.map.b2dWorld;
        console.warn && console.warn(msg, objectData);
        continue;
      }

      try {
        object.isVisible && this.addChild(object);
      } catch ( e ) {
        //.. couldn't add to stage
      }

      try {
        if ( object.bxd ) {
          var body = this.map.b2dWorld.CreateBody(object.bxd.bodyDef);
          body.CreateFixture(object.bxd.fixDef);
          body.CreateFixture(object.bxd.sensorsDef.bottom).SetUserData({sensorPosition: 'bottom'});
          body.CreateFixture(object.bxd.sensorsDef.top).SetUserData({sensorPosition: 'top'});
          body.CreateFixture(object.bxd.sensorsDef.right).SetUserData({sensorPosition: 'right'});
          body.CreateFixture(object.bxd.sensorsDef.left).SetUserData({sensorPosition: 'left'});
          body.SetPositionAndAngle(new Box2D.Common.Math.b2Vec2(object.x/boxledjs.Const.scale,object.y/boxledjs.Const.scale), object.rotation*Math.PI/180);
          object.bxd.sensorsDef = undefined;
          object.bxd.body = body;
          body.SetUserData(object);

          if ( object.bxd.onBodyCreated ) {
            object.bxd.onBodyCreated(body);
          }
        }
      } catch( e ) {
        //.. couldn't add to b2d world
      }

      if ( objectData.name && objectData.name != '' ) {
        this.objects[objectData.name] = object;
        this.map.objects[objectData.name] = object;
      }
    }
  }

  /**
   * Creates a useable object from an object defined in Tiled. (e.g. an instance of the defined class)
   * @param  {Object} objectData The data exported by Tiled.
   */
  ObjectLayer.makeObjectFromData = function(objectData) {
    var className,objectClass,objectParams,object,properties = objectData.properties;

    className = objectData.type || properties.type || properties.classDefinition;
    objectClass = (boxledjs.Utils.getDefinitionByName(className));

    if ( properties.parameter && properties.parameter != '' ) {

      objectParams = JSON.parse(properties.parameter);
      if ( typeof(objectParams) == 'object' ) {
        object = boxledjs.Utils.applyConstruct(objectClass,objectParams);
      }
    }
    object = object || new objectClass(); //in case no parameters were given

    for ( var key in properties ) {
      if ( key != 'classDefinition' && key != 'parameter' ) {
        object[key] = properties[key];
      }
    }

    object.x = objectData.x;
    object.y = objectData.y;
    if ( objectData.scaleX != undefined || properties.scaleX != undefined )
      object.scaleX = objectData.scaleX || properties.scaleX;
    if ( objectData.scaleY != undefined || properties.scaleY != undefined )
      object.scaleY = objectData.scaleY || properties.scaleY;
    object.rotation = objectData.rotation;

    return object;
  }
  
  scope.ObjectLayer = ObjectLayer; 
} (boxledjs));