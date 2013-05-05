boxledjs = boxledjs || {};
(function (scope) {
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
    this.isCollisionLayer = this.properties && this.properties.collisionLayer && this.properties.collisionLayer != 'false';
    if ( this.isCollisionLayer ) {
      this.initObjectsAsB2dBodies();
    } else {
      this.initObjects();
    }
  }

  ObjectLayer.prototype.initObjects = function() {
    var c,l,objectData,object;

    for ( c = 0, l = this.data.objects.length; c < l; c++ ) {
      objectData = this.data.objects[c];
      object = this.makeObjectFromData(objectData);

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
        console.log(objectData.name);
        //.. couldn't add to b2d world
      }

      if ( objectData.name && objectData.name != '' ) {
        this.objects[objectData.name] = object;
        this.map.objects[objectData.name] = object;
      }
    }
  }

  ObjectLayer.prototype.initObjectsAsB2dBodies = function() {
    var c,l,objectData,object;

    for ( c = 0, l = this.data.objects.length; c < l; c++ ) {
      objectData = this.data.objects[c];
      object = boxledjs.Box2DUtils.makeB2DBodyFromData(objectData,this.map.b2dWorld);
    }

    if ( objectData.name && objectData.name != '' ) {
      this.objects[objectData.name] = object;
      this.map.objects[objectData.name] = object;
    }
  }

  ObjectLayer.prototype.makeObjectFromData = function(objectData) {
    var className,objectClass,objectParams,object,properties = objectData.properties;

    if ( (objectData.type && objectData.type != '')
      || (properties.classDefinition && properties.classDefinition != '') ) {

      className = objectData.type || properties.classDefinition;
      objectClass = (boxledjs.Utils.getDefinitionByName(className));

      if ( properties.parameter && properties.parameter != '' ) {

        objectParams = JSON.parse(properties.parameter);
        if ( typeof(objectParams) == 'object' ) {
          object = boxledjs.Utils.applyConstruct(objectClass,objectParams);
        }
      }
      object = object || new objectClass(); //in case no parameters were given
    }
    object = object || {}; //in case no classDefinition was given

    for ( var key in properties ) {
      if ( key != 'classDefinition' && key != 'parameter' ) {
        object[key] = properties[key];
      }
    }

    object.x = objectData.x;
    object.y = objectData.y;
    object.rotation = objectData.rotation;

    return object;
  }
  
  scope.ObjectLayer = ObjectLayer; 
} (boxledjs));