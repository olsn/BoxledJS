var boxledjs = boxledjs || {};

(function(scope) {
  Utils = new Object();

  Math.seed = 0;
  Math.seededRandom = function(max,min) {
    max = max || 1;
    min = min || 0;

    Math.seed = (Math.seed*9301+49297) % 233280;
    var rnd = Math.seed / 233280.0;

    return min + rnd * (max-min);
  }

  Utils.snapValue = function(value,snap)
  {
    var roundedSnap = (value/snap + (value > 0 ? .5 : -.5)) | 0;
    return roundedSnap * snap;
  }

  Utils.getScreenWidth = function() {
    if( typeof( window.innerWidth ) == 'number' ) {
      return window.innerWidth;
    } else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
      return document.documentElement.clientWidth;
    } else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
      return document.body.clientWidth;
    }
  }

  Utils.getScreenHeight = function() {
    if( typeof( window.innerWidth ) == 'number' ) {
      return window.innerHeight;
    } else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
      return document.documentElement.clientHeight;
    } else if( document.body && ( document.body.clientHeight || document.body.clientHeight ) ) {
      return document.body.clientHeight;
    }
  }

  Utils.getStage = function(obj) {
    if ( obj.canvas ) return obj;
    if ( obj.parent ) {
      if ( obj.parent.canvas ) return obj.parent;

      return scope.getStage(obj.parent);
    }

    return null;
  }

  Utils.getDefinitionByName = function(className,pkg,fullPath) {
    pkg = pkg || window;
    fullPath = fullPath || className;
    var nodes = className.split('.'),
        currentNodeName = nodes.shift(),
        currentNode = pkg[currentNodeName];

    if ( currentNode ) {
      if ( nodes.length ) {
        return scope.getDefinitionByName(nodes.join('.'),currentNode,fullPath);
      }

      return currentNode;
    } else {
      throw new Error('Could not find \'' + currentNodeName + '\' of \'' + fullPath + '\'')
    }
  }

  /**
   * from: http://stackoverflow.com/questions/3871731/dynamic-object-construction-in-javascript
   */
  Utils.applyConstruct = function(ctor, params) {
    var obj, newobj;

    if (typeof Object.create === "function") {
        obj = Object.create(ctor.prototype);
    }
    else if ({}.__proto__) {
        obj = {};
        obj.__proto__ = ctor.prototype;
        if (obj.__proto__ !== ctor.prototype) {
            obj = makeObjectWithFakeCtor();
        }
    }
    else {
        obj = makeObjectWithFakeCtor();
    }

    obj.constructor = ctor;
    newobj = ctor.apply(obj, params);

    if (typeof newobj === "object") {
        obj = newobj;
    }

    return obj;

    function makeObjectWithFakeCtor() {
        function fakeCtor() {
        }
        fakeCtor.prototype = ctor.prototype;
        return new fakeCtor();
    }
  }

  scope.Utils = Utils;
}(boxledjs));