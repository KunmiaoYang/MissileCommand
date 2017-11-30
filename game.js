var GAME = function() {
    const CITY_SCALE = 0.003, CITY_COUNT = 6,
        BATTERY_SCALE = 0.05, BATTERY_COUNT = 3,
        MISSILE_SCALE = 0.01, UFO_SCALE = 0.02;
    function guidance(missile, target) {

    }
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
            renderTriangles();
        }
    }
}();