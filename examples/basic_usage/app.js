(function (scope) {
  function TiledParserApp() {
    this.initialize();
  }
  var p = TiledParserApp.prototype;

  p.initialize = function() {
    var self = this;

    this.canvas = document.createElement('canvas'); 
    this.canvas.width = boxledjs.Utils.getScreenWidth();
    this.canvas.height = boxledjs.Utils.getScreenHeight();

    document.body.appendChild(this.canvas);
    this.stage = new createjs.Stage(this.canvas);

    window.assets = this.queue = new createjs.LoadQueue();
    this.queue.addEventListener("complete", function(e) {
      self.loadComplete(e);
    });
    this.queue.loadManifest([
       {id: "map", src:"map.json", type:"json"},
       {src:"assets/tileset.png"},
       {id:"hero", src:"assets/hero.png"}
    ]);
  }

  p.loadComplete = function() {
    // creating the boxledjs.Map
    var mapData = JSON.parse(this.queue.getResult("map",true));
    this.map = new boxledjs.Map(mapData);
    this.map.viewPort.width = this.canvas.width; //optional
    this.map.viewPort.height = this.canvas.height; //optional
    this.map.centerObject = 'hero'; //optional
    this.map.scaleX = this.map.scaleY = 1.5;
    
    this.stage.addChild(this.map);

    var self = this;
    document.onkeydown = function(e){ self.onKeyDown(e) };
    document.onkeyup = function(e){ self.onKeyUp(e) };

    createjs.Ticker.setFPS(30); 
    createjs.Ticker.addListener(this); 
  }

  p.tick = function(e) {
    this.map.update(e);
    this.stage.update(e);
    // uncomment the line below if you want to
    // see the box2d debug-data instead
    //this.map.drawDebugData();
  }

  // your custom listeners
  p.onKeyDown = function(e) {
    switch(e.keyCode) {
      case 38: this.map.objects['hero'].jump(); break;
      case 40: window.DOWN = true; break;
      case 37: window.LEFT = true; break;
      case 39: window.RIGHT = true; break;
    }
  }

  p.onKeyUp = function(e) {
    switch(e.keyCode) {
      case 38: window.UP = false; break;
      case 40: window.DOWN = false; break;
      case 37: window.LEFT = false; break;
      case 39: window.RIGHT = false; break;
    }
  }

  scope.TiledParserApp = TiledParserApp; 
} (window));

window.onload = function() {
  window.app = new TiledParserApp();
};