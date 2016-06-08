/* global AFRAME THREE*/
AFRAME.registerComponent('collider', {
  schema: {},

  init: function () {
  },

  update: function () {
    var sceneEl = this.el.sceneEl;
    var mesh = this.el.getObject3D('mesh');
    var object3D = this.el.object3D;
    var originPoint = this.el.object3D.position.clone();
    for (var vertexIndex = 0; vertexIndex < mesh.geometry.vertices.length; vertexIndex++) {
      var localVertex = mesh.geometry.vertices[vertexIndex].clone();
      var globalVertex = localVertex.applyMatrix4(object3D.matrix);
      var directionVector = globalVertex.sub(object3D.position);

      var ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
      var collisionResults = ray.intersectObjects(sceneEl.object3D.children, true);
      collisionResults.forEach(hit);
    }
    function hit (collision) {
      if (collision.object === object3D) {
        return;
      }
      if (collision.distance < directionVector.length()) {
        if (!collision.object.el) { return; }
        collision.object.el.emit('hit');
      }
    }
  }
});

AFRAME.registerComponent('bullet', {
  schema: {
    direction: {type: 'vec3'},
    // speed: {default: 40.0}
    speed: {default: 10.0},
    acceleration: {default: 5.0}
  },

  init: function () {
    this.direction = new THREE.Vector3(this.data.direction.x, this.data.direction.y, this.data.direction.z);
    this.currentAcceleration = this.data.acceleration;
    this.startPosition = this.data.position;
    this.hit = false;
  },
  hitttt: function () {
    this.el.setAttribute('material', {color: '#AAA'});
    this.hit = true;
  },
  dead: function () {
    this.el.parentElement.removeChild(this.el);
  },
  tick: function (time, delta) {
    var pos = this.el.getAttribute('position');

    if (this.hit) {
      var offset = time - this.lastTimeWithoutHit;
      var t0 = offset / 1000;
      // t = TWEEN.Easing.Exponential.Out(t0);
      var t = Math.sin(t0);
      var sca = 1 + 5 * t;

      this.el.setAttribute('scale', {x: sca, y: sca, z: sca});
      this.el.getObject3D('mesh').material.transparent = true;
      this.el.getObject3D('mesh').material.opacity = 1 - t0;
      if (t0 > 1) {
        this.dead();
      }
      return;
    }

    var position = new THREE.Vector3(pos.x, pos.y, pos.z);
    if (position.length() >= 15) {
      var ray = new THREE.Raycaster(this.startPosition, this.direction.clone().normalize());
      var collisionResults = ray.intersectObjects(document.getElementById('sky').object3D.children, true);
      var self = this;
      collisionResults.forEach(function (collision) {
  /*      if (collision.object === object3D) {
          return;
        }
*/
        if (collision.distance < position.length()) {
          if (!collision.object.el) { return; }
          self.el.setAttribute('position', collision.point);
          self.hitttt();
        }
      });
    }

    this.lastTimeWithoutHit = time;

    if (this.currentAcceleration > 1) {
      this.currentAcceleration -= 2 * delta / 1000.0;
    } else if (this.currentAcceleration <= 1) {
      this.currentAcceleration = 1;
    }

    this.el.setAttribute('scale', {x: 1, y: 1, z: 1.5 * this.currentAcceleration});

    var newPosition = new THREE.Vector3(pos.x, pos.y, pos.z).add(this.direction.clone().multiplyScalar(this.currentAcceleration * this.data.speed * delta / 1000));
    this.el.setAttribute('position', newPosition);

    // megahack
    this.el.object3D.lookAt(this.direction.clone().multiplyScalar(1000));

    var enemies = document.querySelectorAll('[enemy]');
    for (var i = 0; i < enemies.length; i++) {
      if (newPosition.distanceTo(enemies[i].object3D.position) < 1) {
        enemies[i].emit('hit');
        this.hitttt();
        return;
      }
    }
  },

  remove: function () {
/*    if (!this.model) { return; }
    this.el.removeObject3D('mesh');*/
  }
});
