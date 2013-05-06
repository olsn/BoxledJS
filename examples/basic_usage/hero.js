(function (scope) {
  function Hero(image) {
    image = image || window.assets.getResult('hero');

    this.initialize(image);
  }
  Hero.prototype = new createjs.BitmapAnimation();
  Hero.prototype.Bitmap_init = Hero.prototype.initialize;
  Hero.prototype.initialize = function (image) {
    var sd = {
      images: [image],
      frames: {
        height: 120,
        width: 100,
        count: 20
      },
      animations: {
        stand: {
          frames:[0],
          frequency: 2
        },
        walk: {
          frames:[0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
          frequency: 2
        },
        run: {
          frames:[10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
          frequency: 2
        },
        endRun: {
          frames:[5, 6, 7, 8, 9],
          next: 'stand',
          frequency: 2
        }
      }
    }

    this.Bitmap_init(new createjs.SpriteSheet(sd));
    this.gotoAndPlay('stand');
    this.snapToPixel = true;
    this.regX = (100/2);
    this.regY = (120/2);
    this.scaleX = this.scaleY = 0.5;

    this.reset();
  }

  Hero.prototype.reset = function () {
    var self = this;

    boxledjs.Box2DUtils.injectBox2d(this,boxledjs.Box2DUtils.RECT,50*this.scaleX,120*this.scaleY,1,0.95,0.05);
    this.bxd.onBodyCreated = function(body) { self.onBodyCreated(body) };
  }

  Hero.prototype.onBodyCreated = function(body) {
    body.SetFixedRotation(true);
    body.SetBullet(true);
  }
  
  Hero.prototype.onTick = function () {
    this.xDir = 0; this.yDir = 0;
    window.LEFT && !this.bxd.sensors.left && (this.xDir -= 1);
    window.RIGHT && !this.bxd.sensors.right && (this.xDir += 1);
    window.UP && (this.yDir -= 1);
    window.DOWN && (this.yDir += 1);

    if ( this.bxd && this.bxd.body ) {
      if ( this.xDir > 0 && this.bxd.body.m_linearVelocity.x < 7.5 ) {
        this.bxd.body.SetAwake(true);
        this.bxd.body.m_linearVelocity.x += (7.5-this.bxd.body.m_linearVelocity.x)/3;
      } else if ( this.xDir < 0 && this.bxd.body.m_linearVelocity.x > -7.5 ) {
        this.bxd.body.SetAwake(true);
        this.bxd.body.m_linearVelocity.x += (-7.5-this.bxd.body.m_linearVelocity.x)/3;
      } else if ( this.xDir == 0 ) {
        if ( this.currentAnimation != 'endRun' && this.currentAnimation != 'stand' ) {
          //this.gotoAndPlay('endRun');
        }
      }
    }

    if ( this.bxd.sensors.bottom && Math.abs(this.bxd.body.m_linearVelocity.x) > 5.5 ) {
      this.currentAnimation != 'run' && this.gotoAndPlay('run');
    } else if ( this.bxd.sensors.bottom && Math.abs(this.bxd.body.m_linearVelocity.x) > 0 && this.xDir ) {
      this.currentAnimation != 'walk' && this.gotoAndPlay('walk');
    } else if ( this.bxd.sensors.bottom && !this.xDir ) {
      if ( this.currentAnimation != 'endRun' && this.currentAnimation != 'stand' ) {
          this.gotoAndPlay('endRun');
        }
    }

    if ( this.xDir < 0 ) {
      this.scaleX = -0.5;
    } else if ( this.xDir > 0 ) {
      this.scaleX = 0.5;
    }
  }

  Hero.prototype.jump = function() {
    if ( this.bxd && this.bxd.body /*&& this.bxd.sensors.bottom*/ ) {
      this.bxd.body.ApplyImpulse(new Box2D.Common.Math.b2Vec2(0,-14),this.bxd.body.GetWorldCenter());
    }
  }
  
  scope.Hero = Hero; 
} (window));