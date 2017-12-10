var URL = function () {
    let baseAddress = 'https://kunmiaoyang.github.io/MissileCommand/';
    return {
        triangles: baseAddress + 'model/triangles.json',
        ellipsoids: baseAddress + 'model/ellipsoids.json',
        lights: baseAddress + 'model/lights.json',
        cityModel: 'model/city.dae',
        batteryModel: 'model/battery.dae',
        attackMissileModel: 'model/AttackMissile.dae',
        defenseMissileModel: 'model/DefenseMissile.dae',
        UFOModel: baseAddress + 'model/UFO.dae',
        img: {
            base: baseAddress + 'img/',
            terrain: baseAddress + 'img/terrain.jpg',
            background: baseAddress + 'img/background.jpg',
            explosion: baseAddress + 'img/explosion.jpg'
        }
    };
}();