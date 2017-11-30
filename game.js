var GAME = function() {
    const CITY_SCALE = 0.003, CITY_COUNT = 6,
        BATTERY_SCALE = 0.05, BATTERY_COUNT = 3,
        MISSILE_SCALE = 0.01, UFO_SCALE = 0.02,
        DEFENSE_MISSILE_SPEED = 0.4,
        EXPLOSION_RANGE = 0.04;
    const ZERO_THRESHOLD = 0.0001;
    function guidance(missile, target) {
        missile.target = target;
        missile.distance = 0;
        let direction = vec3.subtract(vec3.create(), target.xyz, missile.xyz);
        missile.target.distance = vec3.length(direction);
        vec3.normalize(direction, direction);
        let axis = vec3.cross(vec3.create(), missile.direction, direction),
            rad = vec3.length(axis);
        if(rad > ZERO_THRESHOLD) {
            missile.rMatrix = mat4.rotate(mat4.create(), missile.rMatrix, rad, axis);
            missile.direction = direction;
        }
    }
    function hitAir() {
        let i;
        if((i = MODELS.array.indexOf(this)) > -1) MODELS.array.splice(i, 1);
        launchedMissile.splice(launchedMissile.indexOf(this), 1);
    }
    function createAirTarget(xyz) {
        return {
            xyz: xyz,
        }
    }
    function launch(missile, speed, target, hit) {
        guidance(missile, target);
        missile.speed = speed;
        missile.hit = hit;
        launchedMissile.push(missile);
    }
    var launchedMissile = [];
    var city = {
        pos: [0.875, 0.75, 0.625, 0.375, 0.25, 0.125],
        tMatrixArray: [],
        rMatrixArray: []
    };
    for(let i = 0; i < CITY_COUNT; i++) {
        let rMatrix = mat4.create();
        city.rMatrixArray.push(mat4.scale(rMatrix, rMatrix, [CITY_SCALE, CITY_SCALE, CITY_SCALE]));
        city.tMatrixArray.push(mat4.fromTranslation(mat4.create(), [city.pos[i], 0, 0]));
    }
    var battery = {
        pos: [1, 0.5, 0],
        tMatrixArray: [],
        rMatrixArray: []
    };
    var defenseMissile = {
        xPos: [-0.015, 0, 0.015],
        zPos: [-0.015, 0, 0.015],
        xyz: [],
        tMatrixArray: [],
        rMatrixArray: []
    };
    var attackMissile = {
        speed: 0.02
    }
    for(let i = 0, idMatrix = mat4.create(); i < BATTERY_COUNT; i++) {
        battery.rMatrixArray.push(mat4.scale(mat4.create(), idMatrix, [BATTERY_SCALE, BATTERY_SCALE, BATTERY_SCALE]));
        battery.tMatrixArray.push(mat4.fromTranslation(mat4.create(), [battery.pos[i], 0, 0]));
        defenseMissile.xyz[i] = [];
        defenseMissile.rMatrixArray[i] = [];
        defenseMissile.tMatrixArray[i] = [];
        for(let j = 0; j < defenseMissile.xPos.length; j++) {
            for(let k = 0; k < defenseMissile.zPos.length; k++) {
                let xyz = vec3.fromValues(battery.pos[i] + defenseMissile.xPos[j], 0, defenseMissile.zPos[k]);
                defenseMissile.xyz[i].push(xyz);
                defenseMissile.rMatrixArray[i].push(mat4.scale(mat4.create(), idMatrix, [MISSILE_SCALE, MISSILE_SCALE, MISSILE_SCALE]));
                defenseMissile.tMatrixArray[i].push(mat4.fromTranslation(mat4.create(), xyz));
            }
        }
    }
    return {
        model: {},
        initMODELS() {
            MODELS.array = [];
            for(let i = 0, len = GAME.model.background.length; i < len; i++)
                MODELS.array.push(GAME.model.background[i]);
        },
        initDefenseMissile: function () {
            let missiles = [];
            for(let i = 0; i < BATTERY_COUNT; i++) {
                missiles[i] = [];
                for(let j = 0, len = defenseMissile.tMatrixArray[i].length; j < len; j++) {
                    missiles[i][j] = MODELS.copyModel(GAME.model.missile.prototype,
                        defenseMissile.rMatrixArray[i][j], defenseMissile.tMatrixArray[i][j]);
                    missiles[i][j].xyz = defenseMissile.xyz[i][j];
                    missiles[i][j].direction = vec3.fromValues(0, 1, 0);
                    MODELS.array.push(missiles[i][j]);
                }
            }
            GAME.model.defenseMissiles = missiles;
        },
        initDefenseTarget: function () {
            GAME.model.defenseTarget = new Array(CITY_COUNT + BATTERY_COUNT);
            for(let i = 0; i < CITY_COUNT; i++) {
                GAME.model.cities[i].xyz = vec3.fromValues(city.pos[i], 0, 0);
                GAME.model.defenseTarget[i] = GAME.model.cities[i];
                MODELS.array.push(GAME.model.cities[i]);
            }
            for(let i = 0; i < BATTERY_COUNT; i++) {
                GAME.model.batteries[i].xyz = vec3.fromValues(battery.pos[i], 0, 0);
                GAME.model.defenseTarget[i + CITY_COUNT] = GAME.model.batteries[i];
                MODELS.array.push(GAME.model.batteries[i]);
            }
        },
        loadModels: function() {
            GAME.model.background = JSON_MODEL.loadTriangleSets(SHADER.gl);
            SKECHUP_MODEL.loadModel(SHADER.gl, URL.cityModel, function (model) {
                GAME.model.cities = [];
                for(let i = 0; i < CITY_COUNT; i++) {
                    GAME.model.cities[i] = MODELS.copyModel(model, city.rMatrixArray[i], city.tMatrixArray[i]);
                }
            });
            SKECHUP_MODEL.loadModel(SHADER.gl, URL.batteryModel, function (model) {
                GAME.model.batteries = [];
                for(let i = 0; i < BATTERY_COUNT; i++) {
                    GAME.model.batteries[i] = MODELS.copyModel(model, battery.rMatrixArray[i], battery.tMatrixArray[i]);
                }
            });
            SKECHUP_MODEL.loadModel(SHADER.gl, URL.missileModel, function (model) {
                GAME.model.missile = {prototype: model};
            })
        },
        play: function () {
            GAME.initMODELS();
            GAME.initDefenseTarget();
            GAME.initDefenseMissile();
            ANIMATION.start();
            // renderTriangles();
        },
        update: function(duration) {
            let seconds = duration/1000;
            for(let i = 0, len = launchedMissile.length; i < len; i++) {
                let distance = launchedMissile[i].speed * seconds;
                launchedMissile[i].tMatrix[12] += distance * launchedMissile[i].direction[0];
                launchedMissile[i].tMatrix[13] += distance * launchedMissile[i].direction[1];
                launchedMissile[i].tMatrix[14] += distance * launchedMissile[i].direction[2];
                launchedMissile[i].distance += distance;
                if(launchedMissile[i].distance > launchedMissile[i].target.distance) launchedMissile[i].hit();
            }
        },
        test: function (i, j) {
            let missiles = GAME.model.defenseMissiles;
            let t = createAirTarget(vec3.fromValues(0.5, 0.5, 0));
            launch(missiles[i][j], DEFENSE_MISSILE_SPEED, t, hitAir);
        }
    }
}();