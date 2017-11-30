var GAME = function() {
    const CITY_SCALE = 0.003, CITY_COUNT = 6,
        BATTERY_SCALE = 0.05, BATTERY_COUNT = 3,
        MISSILE_SCALE = 0.01, UFO_SCALE = 0.02;
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
        x: [-0.015, 0, 0.015],
        z: [-0.015, 0, 0.015],
        tMatrixArray: [],
        rMatrixArray: []
    };
    for(let i = 0, idMatrix = mat4.create(); i < BATTERY_COUNT; i++) {
        battery.rMatrixArray.push(mat4.scale(mat4.create(), idMatrix, [BATTERY_SCALE, BATTERY_SCALE, BATTERY_SCALE]));
        battery.tMatrixArray.push(mat4.fromTranslation(mat4.create(), [battery.pos[i], 0, 0]));
        defenseMissile.rMatrixArray[i] = [];
        defenseMissile.tMatrixArray[i] = [];
        for(let j = 0; j < defenseMissile.x.length; j++) {
            for(let k = 0; k < defenseMissile.z.length; k++) {
                defenseMissile.rMatrixArray[i].push(mat4.scale(mat4.create(), idMatrix, [MISSILE_SCALE, MISSILE_SCALE, MISSILE_SCALE]));
                defenseMissile.tMatrixArray[i].push(mat4.fromTranslation(mat4.create(), [battery.pos[i] + defenseMissile.x[j], 0, defenseMissile.z[k]]));
            }
        }
    }
    return {
        model: {},
        initDefenseMissile: function () {
            let missiles = [];
            for(let i = 0; i < BATTERY_COUNT; i++) {
                missiles[i] = [];
                for(let j = 0, len = defenseMissile.tMatrixArray[i].length; j < len; j++) {
                    missiles[i][j] = MODELS.copyModel(GAME.model.missile.prototype,
                        defenseMissile.rMatrixArray[i][j], defenseMissile.tMatrixArray[i][j]);
                }
            }
            GAME.model.defenseMissiles = missiles;
        },
        init: function() {
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
                GAME.initDefenseMissile();
            })
        },
        play: function () {
            MODELS.array = GAME.model.background.concat(GAME.model.cities);
            MODELS.array = MODELS.array.concat(GAME.model.batteries);
            for (let i = 0; i < BATTERY_COUNT; i++) {
                MODELS.array = MODELS.array.concat(GAME.model.defenseMissiles[i]);
            }
            renderTriangles();
        }
    }
}();