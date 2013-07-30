var boxledjs = boxledjs || {};

(function (scope) {
  function PlatformerContactListener() {

  }
  PlatformerContactListener.prototype = new boxledjs.BoxledJSContactListener();
  var p = PlatformerContactListener.prototype;

  p.super_BeginContact = p.BeginContact;
  p.BeginContact = function(contact) {
    this.super_BeginContact(contact);
    this.__HandleContact(contact,1);
  }

  p.super_EndContact = p.EndContact;
  p.EndContact = function(contact) {
    this.super_EndContact(contact);
    this.__HandleContact(contact,-1);
  }

  p.__HandleContact = function(contact,begin) {
    var fixtureA=contact.GetFixtureA();
    var fixtureB=contact.GetFixtureB();

    var sensor = fixtureA.IsSensor() ? fixtureA : fixtureB.IsSensor() ? fixtureB : null;
    if ( !sensor ) return;
    var contactFixture = fixtureA != sensor ? fixtureA : fixtureB;

    var contactData,contactObject;
    contactData = contactObject = contactFixture.GetBody().GetUserData();
    if ( contactData && contactData.objectData ) contactData = contactData.objectData;

    var sensorObject = sensor.GetUserData();
    if ( sensorObject && sensorObject.object ) sensorObject = sensorObject.object;
    if ( contactObject && contactObject.object ) contactObject = contactObject.object;

    if ( !sensor.GetUserData() || !sensor.GetUserData().sensorPosition )
      return;

    var body = sensor.GetBody(),
        obj = body.GetUserData(),
        objB = contactFixture.GetBody().GetUserData();
    if ( objB && objB.onContact ) {
      objB.onContact(obj,begin==1);
    }

    // if the colliding object is a "cloud" (noBottomCollision) and
    // the sensor is either a left- or right-sensor, then don't detect it
    var sensorPosition = ( sensor.GetUserData() && sensor.GetUserData().sensorPosition );
    
    //var ignColA = sensorObject.ignoreCollisionsWith || ((sensorObject.properties&&sensorObject.properties.ignoreCollisionsWith)?sensorObject.properties.ignoreCollisionsWith:this._ea);
    //var ignColB = contactObject.ignoreCollisionsWith || ((contactObject.properties&&contactObject.properties.ignoreCollisionsWith)?contactObject.properties.ignoreCollisionsWith:this._ea);

    if ( /*begin == 1 &&*/ ( ( contactData && contactData.properties && contactData.properties.noBottomCollision
            && ( sensorPosition == 'left' || sensorPosition == 'right' ) )
        || contactFixture.IsSensor()
        || obj == sensor
        || obj == objB
        /*|| ( ignColA.indexOf(contactObject.subType) >= 0 || ignColA.indexOf(contactObject.type) >= 0 || ignColB.indexOf(sensorObject.subType) >= 0 || ignColB.indexOf(sensorObject.type) >= 0 )*/
    ) ) {
      return;
    }

    
    if ( obj && obj.bxd && obj.bxd.sensors && sensorPosition ) {
      //if ( obj.visible !== false && objB.visible !== false ) {
        if ( begin == 1 && obj.bxd.sensors[sensorPosition].indexOf(contactFixture.GetBody()) == -1 ) {
          obj.bxd.sensors[sensorPosition].push(contactFixture.GetBody());
        } else if ( begin == -1 && obj.bxd.sensors[sensorPosition].indexOf(contactFixture.GetBody()) >= 0 ) {
          obj.bxd.sensors[sensorPosition].splice(obj.bxd.sensors[sensorPosition].indexOf(contactFixture.GetBody()),1);
        }
        //obj.bxd.sensors[sensorPosition] += begin;
        //obj.bxd.sensors[sensorPosition] = Math.max(obj.bxd.sensors[sensorPosition],0);
      //}
    }
  }

  p._ea = [];
  p.super_PreSolve = p.PreSolve;
  p.PreSolve = function(contact, oldManifold) {
    this.super_PreSolve(contact, oldManifold);

    var fixtureA=contact.GetFixtureA();
    var fixtureB=contact.GetFixtureB();

    var player_AABB, platform_AABB, vel, player_invMass;
    var dataA = fixtureA.GetBody().GetUserData(),
        dataB = fixtureB.GetBody().GetUserData();

    if ( dataA && dataA.objectData ) dataA = dataA.objectData;
    if ( dataB && dataB.objectData ) dataB = dataB.objectData;

    var ignColA = dataA.ignoreCollisionsWith || dataA.properties.ignoreCollisionsWith || this._ea;
    var ignColB = dataB.ignoreCollisionsWith || dataB.properties.ignoreCollisionsWith || this._ea;
    if ( ( dataA.visible === false || dataB.visible === false )
      || ( ignColA.indexOf(dataB.subType) >= 0 || ignColA.indexOf(dataB.type) >= 0 || ignColB.indexOf(dataA.subType) >= 0 || ignColB.indexOf(dataA.type) >= 0 ) ) {
      contact.SetEnabled(false);
      return;
    }

    if ((dataA && dataA.properties && dataA.properties.noBottomCollision)||(dataB && dataB.properties && dataB.properties.noBottomCollision)) {

      if (fixtureA.GetBody().GetDefinition().type == Box2D.Dynamics.b2Body.b2_staticBody) {
        vel = fixtureB.GetBody().m_linearVelocity.y;
        player_invMass = fixtureB.GetBody().m_invMass;
        player_AABB=fixtureB.GetAABB();
        platform_AABB=fixtureA.GetAABB();
      } else {
        vel = fixtureA.GetBody().m_linearVelocity.y;
        player_invMass = fixtureA.GetBody().m_invMass;
        player_AABB=fixtureA.GetAABB();
        platform_AABB=fixtureB.GetAABB();
      }

      var pHeight = Math.abs(platform_AABB.lowerBound.y - platform_AABB.upperBound.y);
      var moveY = vel * player_invMass / Box2D.Dynamics.b2World.s_timestep2.velocityIterations;
      if ( ((player_AABB.upperBound.y-moveY > platform_AABB.upperBound.y) && player_AABB.upperBound.y > platform_AABB.upperBound.y) || ((player_AABB.upperBound.y-moveY > platform_AABB.lowerBound.y + pHeight/25) && player_AABB.upperBound.y > platform_AABB.lowerBound.y + pHeight/25) ) {
        contact.SetEnabled(false);
      }
    }
  }

  scope.PlatformerContactListener = PlatformerContactListener; 
} (boxledjs));