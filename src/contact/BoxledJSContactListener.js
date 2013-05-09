var boxledjs = boxledjs || {};

(function (scope) {
  function BoxledJSContactListener() {

  }
  BoxledJSContactListener.prototype = new Box2D.Dynamics.b2ContactListener();
  var p = BoxledJSContactListener.prototype;

  p.BeginContact = function(contact) {
    var fixtureA=contact.GetFixtureA();
    var fixtureB=contact.GetFixtureB();

    this.__BeginContactOrdered(fixtureA,fixtureB,contact);
    this.__BeginContactOrdered(fixtureB,fixtureA,contact);
  }
  p.__BeginContactOrdered = function(fixtureA,fixtureB,contact) {
    var dataA = fixtureA.GetBody().GetUserData(),
        dataB = fixtureB.GetBody().GetUserData();

    if ( dataA && dataA.objectData ) dataA = objectData;
    if ( dataB && dataB.objectData ) dataB = objectData;
    
    this.__applyForceField(fixtureA,fixtureB,dataA,dataB,1,1,contact);
    this.__applyImpulse(fixtureA,fixtureB,dataA,dataB,contact);
    this.__handleCustomEvents(fixtureA,fixtureB,dataA,dataB,contact,'beginContact');
  }

  p.EndContact = function(contact) {
    var fixtureA=contact.GetFixtureA();
    var fixtureB=contact.GetFixtureB();

    this.__EndContactOrdered(fixtureA,fixtureB);
    this.__EndContactOrdered(fixtureB,fixtureA);
  }
  p.__EndContactOrdered = function(fixtureA,fixtureB,contact) {
    var dataA = fixtureA.GetBody().GetUserData(),
        dataB = fixtureB.GetBody().GetUserData();

    if ( dataA && dataA.objectData ) dataA = objectData;
    if ( dataB && dataB.objectData ) dataB = objectData;

    this.__applyForceField(fixtureA,fixtureB,dataA,dataB,-1,0,contact);
    this.__handleCustomEvents(fixtureA,fixtureB,dataA,dataB,contact,'endContact');
  }

  p.__applyForceField = function(fixtureA,fixtureB,dataA,dataB,addOrRemove,fallBackMultiplier,contact) {
    if ( dataA && dataA.properties && (dataA.properties.forceX || dataA.properties.forceY) ) {
      if ( (dataA.properties.forceX || dataA.properties.forceY) && !fixtureB.IsSensor()) {
        var fx = parseFloat(dataA.properties.forceX) || 0,
            fy = parseFloat(dataA.properties.forceY) || 0,
            body = fixtureB.GetBody();
        body.o_fieldForceX = body.o_fieldForceX + (fx*addOrRemove) || fx * (fallBackMultiplier||0);
        body.o_fieldForceY = body.o_fieldForceY + (fy*addOrRemove) || fy * (fallBackMultiplier||0);
      }
    }

    if ( dataA && dataA.properties && (dataA.properties.force || dataA.properties.gravityFactor != undefined) && !fixtureB.IsSensor() ) {
      var body = fixtureB.GetBody();
      body.o_dynamicForceFields = body.o_dynamicForceFields || [];
      if ( addOrRemove == 1 ) {
        body.o_dynamicForceFields.push(fixtureA.GetBody());
      } else {
        body.o_dynamicForceFields.splice(body.o_dynamicForceFields.indexOf(fixtureA.GetBody()),1);
      }
    }
  }

  p.__applyImpulse = function(fixtureA,fixtureB,dataA,dataB,contact) {
    if ( dataA && dataA.properties && (dataA.properties.impulseX || dataA.properties.impulseY || dataA.properties.impulse) ) {
      if ( (dataA.properties.impulseX || dataA.properties.impulseY) && !fixtureB.IsSensor()) {
        var fx = parseFloat(dataA.properties.impulseX) || 0,
            fy = parseFloat(dataA.properties.impulseY) || 0,
            body = fixtureB.GetBody();
        body.ApplyImpulse(new Box2D.Common.Math.b2Vec2((fx||0),(fy||0)),body.GetWorldCenter());
      }

      if ( dataA.properties.impulse && !fixtureB.IsSensor()) {
        var f = parseFloat(dataA.properties.impulse) || 0,
            bodyA = fixtureA.GetBody(), bodyB = fixtureB.GetBody();

        var dirImpulse = new Box2D.Common.Math.b2Vec2(bodyB.GetWorldCenter().x,bodyB.GetWorldCenter().y);
            dirImpulse.Subtract(bodyA.GetWorldCenter())
            dirImpulse.Normalize();
            dirImpulse.Multiply(f);

        //bodyB.ApplyImpulse(dirImpulse,bodyB.GetWorldCenter());
        bodyB.ApplyImpulse(dirImpulse,bodyB.GetWorldPoint(contact.GetManifold().m_localPoint));
      }
    }
  }

  p.__handleCustomEvents = function(fixtureA,fixtureB,dataA,dataB,contact,status) {
    if ( dataA && dataA.properties && dataA.properties.event ) {
      var eventData = {
        type: dataA.properties.event,
        detail: {
          status: status,
          targetFixture: fixtureA,
          triggeringFixture: fixtureB
        }
      };
      
      dataA.eventsToDispatch = dataA.eventsToDispatch || [];
      dataA.eventsToDispatch.push(eventData);
    }
  }

  p.PreSolve = function(contact, oldManifold) {
    //...
  }

  scope.BoxledJSContactListener = BoxledJSContactListener; 
} (boxledjs));