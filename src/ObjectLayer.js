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

  ObjectLayer.prototype.destroy = function() {
    var key, obj;

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

    for ( key in this.children ) {
      obj = this.children[key];
      if ( obj.destroy ) obj.destroy();
    }

    this.removeAllChildren();
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
      this.initObject(object, objectData);
    }
  }

  ObjectLayer.prototype.initObject = function(object, objectData) {
    

      try {
        object.isVisible && this.addChild(object);
      } catch ( e ) {
        //.. couldn't add to stage
      }

      try {
        if ( object.bxd ) {
          var body = this.map.b2dWorld.CreateBody(object.bxd.bodyDef);
          body.CreateFixture(object.bxd.fixDef);
          if ( object.bxd.sensorsDef ) {
            object.bxd.sensorsDef.bottom && body.CreateFixture(object.bxd.sensorsDef.bottom).SetUserData({object:object, sensorPosition: 'bottom'});
            object.bxd.sensorsDef.top && body.CreateFixture(object.bxd.sensorsDef.top).SetUserData({object:object, sensorPosition: 'top'});
            object.bxd.sensorsDef.right && body.CreateFixture(object.bxd.sensorsDef.right).SetUserData({object:object, sensorPosition: 'right'});
            object.bxd.sensorsDef.left && body.CreateFixture(object.bxd.sensorsDef.left).SetUserData({object:object, sensorPosition: 'left'});

            object.bxd.sensorsDef.tr && body.CreateFixture(object.bxd.sensorsDef.tr).SetUserData({object:object, sensorPosition: 'tr'});
            object.bxd.sensorsDef.br && body.CreateFixture(object.bxd.sensorsDef.br).SetUserData({object:object, sensorPosition: 'br'});
            object.bxd.sensorsDef.bl && body.CreateFixture(object.bxd.sensorsDef.bl).SetUserData({object:object, sensorPosition: 'bl'});
            object.bxd.sensorsDef.tl && body.CreateFixture(object.bxd.sensorsDef.tl).SetUserData({object:object, sensorPosition: 'tl'});
          }
          body.SetPositionAndAngle(new Box2D.Common.Math.b2Vec2(object.x/boxledjs.Const.scale,object.y/boxledjs.Const.scale), object.rotation*Math.PI/180);
          object.bxd.sensorsDef = undefined;
          object.bxd.body = body;
          body.SetUserData(object);

          if ( object.onBodyCreated ) {
            object.onBodyCreated(body);
          }
        }
      } catch( e ) {
        //.. couldn't add to b2d world
      }

      object.layer = this;

      if ( objectData && objectData.name && objectData.name != '' ) {
        this.objects[objectData.name] = object;
        this.map.objects[objectData.name] = object;
      }

      if ( objectData && objectData.group && objectData.group != '' ) {
        this.map.objectGroups[objectData.group] = this.map.objectGroups[objectData.group] || [];
        this.map.objectGroups[objectData.group].push(object);
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

      objectParams = (typeof properties.parameter == 'string' ) ? JSON.parse(properties.parameter) : properties.parameter;
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