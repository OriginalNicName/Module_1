'use strict';
var canvas, context;
var stageWidth, stageHeight, offSetL, offSetT;
var tank;
const TANK = 'tank', ENEMY = 'enemy', MISSILE = 'missile';
var sceneList = [], keys = [];
var loadCount = 0, loadMin = 2;
var gameOver = false;
var interval = 1000;
var id;
var secs;
window.onload = function () {
  initGame();
  secs = 0;
  id = setInterval(function () {
    secs++; console.log(secs);
  }, 1000);

}

function initGame() {
  canvas = document.getElementById('canvas');
  context = canvas.getContext('2d');
  stageWidth = canvas.width;
  stageHeight = canvas.height;
  offSetL = canvas.offsetLeft;
  offSetT = canvas.offsetTop;
  //id, x, y, speed, maxSpeed, accel, drag, angle
  tank = makeObject(TANK, stageWidth / 2, stageHeight / 2, 0, 3, 1, 0.9, 270)
  sceneList.push(tank);
  tank.image.addEventListener('load', loadHandler, false);
  tank.image.src = "Assets/playerTank.png";
  //id, x, y, speed, maxSpeed, accel, drag, angle
  var missile = makeObject(MISSILE, tank.x, tank.y, 0, 0, 0, 1, 0);
  sceneList.push(missile);
  missile.image.addEventListener('load', loadHandler, false);
  missile.image.src = "Assets/tankShell.png";
  spawnEnemy()

}

function spawnEnemy(x, y) {
  //id, x, y, speed, maxSpeed, accel, drag, angle
  var enemy = makeObject(ENEMY, Math.random() * 800, Math.random() * -100, 1, 0, 0, 1, getRandomInt(60, 120));
  sceneList.splice(1, 0, enemy);
  enemy.image.addEventListener('load', loadHandler, false);
  enemy.image.src = "Assets/enemyTank.png";
  var adjustPercentage = (0.2 / 10000) * interval

  interval = interval - (interval * adjustPercentage);
  setTimeout(spawnEnemy, interval);
}

function loadHandler(e) {
  for (var i = 0; i < sceneList.length; i++) {
    if (e.target == sceneList[i].image) {
      sceneList[i].width = e.target.width;
      sceneList[i].height = e.target.height;
      break;
    }

  }

  if (++loadCount == loadMin) {
    window.addEventListener('keydown', keyDownHandler, false);
    window.addEventListener('keyup', keyUpHandler, false);
    render();
  }
}

function render() {
  if (!gameOver) {
    //input
    manageInput();
    manageProjectiles();
    //update objects
    manageMovement();
    //resolve collision etc
    manageCollisions();
    //draw
    draw();
    requestAnimationFrame(render);
  } else {
    context.fillStyle = '#FF0000'
    context.fillRect(0, 0, stageWidth, stageHeight);
    clearInterval(id);
    alert('Total Time Survived: ' + secs + ' seconds');
  }
}

function manageInput() {
  //forward key - w
  if (keys[87]) {
    if (tank.speed < tank.maxSpeed) {
      tank.speed += tank.accel
    }

  }
  //left key - a
  if (keys[65]) {
    tank.angle -= 2;
  }

  //right key - d
  if (keys[68]) {
    tank.angle += 2;
  }

  //space key
  if (keys[32]) {
    tank.shoot = true;
  }

}

function manageProjectiles() {
  if (tank.shoot) {
    tank.shoot = false;
    var missile;
    var obj;
    //player will always be at first position
    for (var i = 1; i < sceneList.length; i++) {
      obj = sceneList[i];
      if (obj.id == MISSILE && !obj.inFlight) {
        missile = obj;
        missile.inFlight = true;
        missile.speed = 10;
        break
      }

    }

  }

}

function checkOutOfBounds(obj) {
  var out = false;
  if (obj.x + obj.getRotatedWidth() / 2 >= stageWidth) {
    // stage right
    out = true;
    obj.x = stageWidth - obj.getRotatedWidth() / 2;
  }
  else if (obj.x - obj.getRotatedWidth() / 2 < 0) {
    out = true;
    obj.x = obj.getRotatedWidth() / 2;
  }

  if (obj.y + obj.getRotatedHeight() / 2 >= stageHeight) {
    out = true;
    obj.y = stageWidth - obj.getRotatedHeight() / 2;
  } else if (obj.y - obj.getRotatedHeight() / 2 < 0) {
    out = true;
    obj.y = obj.getRotatedHeight() / 2;
  }

  if (out) {
    obj.speed = 0;
  }

  return out
}

function manageCollisions() {
  var obj;
  for (var i = 0; i < sceneList.length; i++) {
    obj = sceneList[i];
    if (obj.id == TANK) {
      checkOutOfBounds(obj);
    } else if (obj.id == ENEMY) {
      if (checkOverlap(obj, tank)) {
        gameOver = true;
      }
      else {
        var missile;
        for (var j = i + 1; j < sceneList.length; j++) {
          if (sceneList[j].id == MISSILE && sceneList[j].inFlight) {
            missile = sceneList[j];
            if (checkOverlap(obj, missile)) {
              restoreMissile(missile);
              sceneList.splice(i, 1);
              break;
            }
          }
        }
      }
    } if (obj.id == MISSILE && obj.inFlight) {
      if (checkOutOfBounds(obj)) {
        restoreMissile(obj);

      }

    }

  }
  function checkOverlap(object, target) {
    var hit = false;
    var dx = target.x - object.x;
    var dy = target.y - object.y;
    var radii = object.width / 2 + target.width / 2;
    if (Math.abs(dx) < radii) {
      if (Math.abs(dy) < radii) {
        hit = true;
      }

    }

    return hit
  }

}

function restoreMissile(missile) {
  missile.inFlight = false;
  missile.speed = 0;
}

function manageMovement() {
  var obj, rads;
  for (var i = 0; i < sceneList.length; i++) {
    obj = sceneList[i];
    rads = deg2Rads(obj.angle)

    if (obj.id == MISSILE && !obj.inFlight) {
      obj.x = tank.x;
      obj.y = tank.y;
      obj.angle = tank.angle;
    }

    obj.speed *= obj.drag;
    obj.x += obj.speed * Math.cos(rads);
    obj.y += obj.speed * Math.sin(rads);
  }

}

function draw() {
  context.clearRect(0, 0, stageWidth, stageHeight);
  var obj;
  for (var i = 0; i < sceneList.length; i++) {
    obj = sceneList[i];
    context.save();
    context.translate(obj.x, obj.y);
    context.rotate(deg2Rads(obj.angle));
    context.drawImage(obj.image, -(obj.width / 2), -(obj.height / 2));
    context.restore();
  }

}

function keyDownHandler(e) {
  keys[e.keyCode] = true;
}

function keyUpHandler(e) {
  keys[e.keyCode] = false;
}

function makeObject(id, x, y, speed, maxSpeed, accel, drag, angle) {
  var obj = {};
  obj.id = id;
  obj.x = x;
  obj.y = y;
  obj.speed = speed;
  obj.maxSpeed = maxSpeed;
  obj.accel = accel;
  obj.drag = drag;
  obj.angle = angle;
  obj.image = new Image();
  obj.getRotatedWidth = function () {
    var rads = deg2Rads(this.angle);
    var a = Math.abs(this.width * Math.cos(rads));
    var b = Math.abs(this.height * Math.sin(rads));
    var rotatedwidth = a + b;
    return rotatedwidth
  }

  obj.getRotatedHeight = function () {
    var rads = deg2Rads(this.angle);
    var c = Math.abs(this.height * Math.cos(rads));
    var d = Math.abs(this.width * Math.sin(rads));
    var rotatedHeight = c + d;
    return rotatedHeight
  }

  return obj;
}

function deg2Rads(deg) {
  return Math.PI / 180 * deg
}

function rads2Degs(rads) {
  return rads * (180 / Math.PI);
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}