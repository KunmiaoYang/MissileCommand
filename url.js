var URL = function () {
    let baseAddress = 'https://kunmiaoyang.github.io/MissileCommand/';
    return {
        triangles: baseAddress + 'model/triangles.json',
        ellipsoids: baseAddress + 'model/ellipsoids.json',
        lights: baseAddress + 'model/lights.json',
        cityModel: baseAddress + 'model/city.dae',
        batteryModel: baseAddress + 'model/battery.dae',
        attackMissileModel: baseAddress + 'model/AttackMissile.dae',
        defenseMissileModel: baseAddress + 'model/DefenseMissile.dae',
        UFOModel: baseAddress + 'model/UFO.dae',
        img: {
            base: baseAddress + 'img/',
            terrain: baseAddress + 'img/terrain.jpg',
            background: baseAddress + 'img/background.jpg',
            explosion: baseAddress + 'img/explosion.jpg'
        }
    };
}();