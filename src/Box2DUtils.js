var boxledjs = boxledjs || {};
(function (scope) {

  /**
   * Box2DUtils is a set of utility-methods to help with common Box2D tasks.
   * 
   * @class Box2DUtils
   */
  Box2DUtils = new Object();

  Box2DUtils.RECT = 'rect';
  Box2DUtils.CIRCLE = 'circle';

  /**
   * Converts a set of object definitions into a Box2D b2Body for the world-simulation.
   *
   * @method makeB2DBodyFromData
   * @static
   * @param  {Object} objectData The data as exported from Tiled to JSON.
   * @param  {b2World} world The Box2D b2World to create the body in.
   * @return {b2Body} The created Box2D b2Body.
   */
  Box2DUtils.makeB2DBodyFromData = function(objectData,world) {
    boxledjs.Const.scale = boxledjs.Const.scale || 32;
    var properties = objectData.properties;

    var fixDef = new Box2D.Dynamics.b2FixtureDef();
    fixDef.density = properties.density == undefined ? 1 : parseFloat(properties.density);
    fixDef.friction = properties.friction == undefined ? 0.5 : parseFloat(properties.friction);
    fixDef.restitution = properties.restitution == undefined ? 0.05 : parseFloat(properties.restitution);
    fixDef.isSensor = (properties.isSensor&&properties.isSensor != 'false') || (properties.noCollision&&properties.noCollision != 'false') || properties.force || properties.forceX || properties.forceY || properties.gravityFactor != undefined;

    var bodyDef = new Box2D.Dynamics.b2BodyDef();
    bodyDef.type = properties.dynamic ? Box2D.Dynamics.b2Body.b2_dynamicBody : Box2D.Dynamics.b2Body.b2_staticBody;
    var body = world.CreateBody(bodyDef),
        b2dWidth = objectData.width/boxledjs.Const.scale/2,
        b2dHeight = objectData.height/boxledjs.Const.scale/2;

    // parsing the properties for special shapes definitions
    if ( properties.topLeft || properties.topRight || properties.bottomRight || properties.bottomLeft ) {
      objectData.polygon = [];
      properties.topLeft != 'none' && objectData.polygon.push(_getPosOf(properties.topLeft||'0,0',objectData));
      properties.topRight != 'none' && objectData.polygon.push(_getPosOf(properties.topRight||'1,0',objectData));
      properties.bottomRight != 'none' && objectData.polygon.push(_getPosOf(properties.bottomRight||'1,1',objectData));
      properties.bottomLeft != 'none' && objectData.polygon.push(_getPosOf(properties.bottomLeft||'0,1',objectData));
    }

    // creating the shape
    if ( objectData.ellipse == true ) {
      // CIRCLE:
      fixDef.shape = new Box2D.Collision.Shapes.b2CircleShape(b2dWidth);
      body.CreateFixture(fixDef);
      objectData.x += objectData.width / 2;
      objectData.y += objectData.height / 2;
    } else if ( objectData.polygon && objectData.polygon.length > 1 ) {
      // POLYGON:
      Box2D.Ext.b2Separator.Separate(body,fixDef,objectData.polygon,boxledjs.Const.scale);
    } else if ( objectData.polyline && objectData.polyline.length > 1 ) {
      // POLYLINE:
      var v1,v2,c,l,pp;
      for ( c = 0, l = objectData.polyline.length; c < l-1; c++) {
        fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape();
        pp = objectData.polyline[c];
        v1 = new Box2D.Common.Math.b2Vec2(pp.x/boxledjs.Const.scale,pp.y/boxledjs.Const.scale);
        pp = objectData.polyline[c+1];
        v2 = new Box2D.Common.Math.b2Vec2(pp.x/boxledjs.Const.scale,pp.y/boxledjs.Const.scale);
        fixDef.shape.SetAsEdge(v1,v2);
        body.CreateFixture(fixDef);
      }
    } else {
      // DEFAULT IS BOX:
      fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape();
      fixDef.shape.SetAsBox(b2dWidth, b2dHeight);
      body.CreateFixture(fixDef);
      objectData.x += objectData.width / 2;
      objectData.y += objectData.height / 2;
    }

    body.SetPositionAndAngle(new Box2D.Common.Math.b2Vec2(objectData.x/boxledjs.Const.scale,objectData.y/boxledjs.Const.scale), (objectData.rotation||0)*Math.PI/180);
    body.SetUserData(objectData);
    return body;
  }

  function _getPosOf(pos, data) {
    pos = pos.split(',');
    return {
      x: parseFloat(pos[0]) * data.width,
      y: parseFloat(pos[1]) * data.height  
    }
  }

  /**
   * Whenever you want to create a custom object that is supposed to interact with the Box2D b2World,
   * it is strongly recommended that you call this method in the constructor of your class, see the example below:
   * <pre>
   * function Hero() {
   *   var self = this;
   * 
   *   // in the constructor or in a sub-method of the constructor
   *   boxledjs.Box2DUtils.injectBox2d(this, boxledjs.Box2DUtils.RECT, 100, 150, 1, 0.5, 0.05);
   * 
   *   // implement this method if you want to apply some special settings after
   *   // the body was created
   *   this.bxd.onBodyCreated = function(body) { self.onBodyCreated(body) };
   * }
   * 
   * Hero.prototype.onBodyCreated = function(body) {
   *   // for example setting a fixed rotation or more steps
   *   body.SetFixedRotation(true);
   *   body.SetBullet(true);
   * }</pre>
   * After the injection, the object will have a property called <em>bxd</em>, it holds the <em>body</em> and a <em>sensors</em> object,
   * where you can check if 'top','left','bottom' or 'right' is currently touching anything.
   * 
   * @method injectBox2d
   * @static
   * @param  {Object} object The object that the b2Body is injected to
   * @param  {String} type The type of the body, currently only 'rect' and 'circle' are supported.
   * @param  {Number} widthOrRadius The width of the body, or the radius in case of a circle.
   * @param  {Number} height The height of the body (ignored if circle).
   * @param  {Number} [density=1] The density of the body, this correlated to the Box2D-physics model.
   * @param  {Number} [friction=0.5] The friction of the body, this correlated to the Box2D-physics model.
   * @param  {Number} [restitution=0.05] The restitution of the body, this correlated to the Box2D-physics model.
   * @param  {Boolean} [dynamic=true] Defines if the body is supposed to be a dynamic or static(non-moving) body.
   */
  Box2DUtils.injectBox2d = function(object,type,widthOrRadius,height,density,friction,restitution,dynamic) {
    dynamic == undefined && (dynamic = true);

    var scale = boxledjs.Const.scale = boxledjs.Const.scale || 32;
    object.bxd = {};

    widthOrRadius *= 0.5;
    height *= 0.5;

    var fixDef = new Box2D.Dynamics.b2FixtureDef(), sensors;
    fixDef.density = density == undefined ? 1 : density;
    fixDef.friction = friction == undefined ? 0.5 : friction;
    fixDef.restitution = restitution == undefined ? 0.05 : restitution;

    if ( type == Box2DUtils.RECT ) {
      fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape();
      fixDef.shape.SetAsBox(widthOrRadius/scale, height/scale);

      sensorsDef = {};
      sensorsDef.bottom = Box2DUtils.makeSensorDef((widthOrRadius+2)/scale, 2/scale,0,height/scale);
      sensorsDef.top = Box2DUtils.makeSensorDef((widthOrRadius+2)/scale, 2/scale,0,-height/scale);
      sensorsDef.right = Box2DUtils.makeSensorDef(2/scale, (height-1)/scale,widthOrRadius/scale,0);
      sensorsDef.left = Box2DUtils.makeSensorDef(2/scale, (height-1)/scale,-widthOrRadius/scale,0);
    } else if ( type == Box2DUtils.CIRCLE ) {
      fixDef.shape = new Box2D.Collision.Shapes.b2CircleShape(widthOrRadius*2/scale);
    } else {
      throw new Error('Cannot resolve shape-type: ' + type);
    }

    object.bxd.fixDef = fixDef;
    object.bxd.sensors = {bottom:0,top:0,right:0,left:0};
    object.bxd.sensorsDef = sensorsDef;

    var bodyDef = new Box2D.Dynamics.b2BodyDef();
    bodyDef.type = !dynamic ? Box2D.Dynamics.b2Body.b2_staticBody : Box2D.Dynamics.b2Body.b2_dynamicBody;

    object.bxd.bodyDef = bodyDef;

    //injecting onTick methods;
    if ( object.onTick ) {
      object.__onTick = object.onTick;
    }
    object.onTick = function(e) {
      this.__onTick && this.__onTick(e);

      if ( !this.bxd.body ) return;
      var pt = this.bxd.body.GetPosition();
      this.x = pt.x * scale;
      this.y = pt.y * scale;
      this.rotation = this.bxd.body.GetAngle()/Math.PI*180;
    }
  }

  Box2DUtils.makeSensorDef = function(width,height,x,y) {
    var sensorDef = new Box2D.Dynamics.b2FixtureDef();
    sensorDef.isSensor = true;
    var sensorShape = new Box2D.Collision.Shapes.b2PolygonShape();
    sensorShape.SetAsOrientedBox(width,height,new Box2D.Common.Math.b2Vec2(x,y), 0);
    sensorDef.shape = sensorShape;

    return sensorDef;
  }

  scope.Box2DUtils = Box2DUtils; 
} (boxledjs));

Object.equals = function( x, y ) {
  if ( x === y ) return true;
  if ( ! ( x instanceof Object ) || ! ( y instanceof Object ) ) return false;
  if ( x.constructor !== y.constructor ) return false;

  for ( var p in x ) {
    if ( ! x.hasOwnProperty( p ) ) continue;
    if ( ! y.hasOwnProperty( p ) ) return false;
    if ( x[ p ] === y[ p ] ) continue;
    if ( typeof( x[ p ] ) !== "object" ) return false;
    if ( ! Object.equals( x[ p ],  y[ p ] ) ) return false;
  }

  for ( p in y ) {
    if ( y.hasOwnProperty( p ) && ! x.hasOwnProperty( p ) ) return false;
  }
  return true;
}