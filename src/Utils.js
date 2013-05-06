var boxledjs = boxledjs || {};

(function(scope) {

  /**
   * Utils is a set of utility-methods to help with common tasks.
   * 
   * @class Utils
   */
  Utils = new Object();

  /**
   * Returns the width of the screen.
   * 
   * @method getScreenWidth
   * @static
   * @return {Number} the screenWidth
   */
  Utils.getScreenWidth = function() {
    if( typeof( window.innerWidth ) == 'number' ) {
      return window.innerWidth;
    } else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
      return document.documentElement.clientWidth;
    } else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
      return document.body.clientWidth;
    }
  }

  /**
   * Returns the height of the screen.
   * 
   * @method getScreenHeight
   * @static
   * @return {Number} the screenHeight
   */
  Utils.getScreenHeight = function() {
    if( typeof( window.innerWidth ) == 'number' ) {
      return window.innerHeight;
    } else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
      return document.documentElement.clientHeight;
    } else if( document.body && ( document.body.clientHeight || document.body.clientHeight ) ) {
      return document.body.clientHeight;
    }
  }

  /**
   * Finds the stage for a createJs.DisplayObject
   * 
   * @method getStage
   * @static
   * @param  {DisplayObject} obj
   * @return {Stage} The createjs.Stage or null if not found
   */
  Utils.getStage = function(obj) {
    if ( obj.canvas ) return obj;
    if ( obj.parent ) {
      if ( obj.parent.canvas ) return obj.parent;

      return scope.getStage(obj.parent);
    }

    return null;
  }

  /**
   * This will return the class according to a String describing the classpath+name
   * e.g.: 'boxledjs.Map' will return the actual class to be used for instatiation.
   * This is used to reference custom classes in Tiled.
   * 
   * @method getDefinitionByName
   * @static
   * @throws {Error} If Class not found
   * @param  {String} className The fully qualified name of the class. e.g.: 'boxledjs.Map'
   * @param  {Object} [pkg=window] The package to start searching, defaults to 'window'
   * @param  {String} [fullPath] The full path, only used for recursive iterations, not needed for the initial call.
   * @return {Function} The constructor of the class.
   */
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
   * Constructors cannot be executed with '.apply([...])' like methods, this method mocks that.
   * (from: http://stackoverflow.com/questions/3871731/dynamic-object-construction-in-javascript)
   * 
   * @method applyConstruct
   * @static
   * @param  {Function} ctor The constructor.
   * @param  {Array} params The parameters to apply to the constructor.
   * @return {Object} The instatiated object.
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