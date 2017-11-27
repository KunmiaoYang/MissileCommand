var GAME = function() {
    const CITY_SCALE = 0.003, CITY_COUNT = 6,
        BATTERY_SCALE = 0.05, BATTERY_COUNT = 3,
        MISSILE_SCALE = 0.01, UFO_SCALE = 0.02;
    var city = {
        pos: [0.875, 0.75, 0.625, 0.375, 0.25, 0.125],
        tMatrixArray: [],
        rMatrixArray: []
    }
    for(let i = 0; i < CITY_COUNT; i++) {
        let rMatrix = mat4.create();
        city.rMatrixArray.push(mat4.scale(rMatrix, rMatrix, [CITY_SCALE, CITY_SCALE, CITY_SCALE]));
        city.tMatrixArray.push(mat4.fromTranslation(mat4.create(), [city.pos[i], 0, 0]));
    }
    var battery = {
        pos: [1, 0.5, 0],
        tMatrixArray: [],
        rMatrixArray: []
    }
    for(let i = 0; i < BATTERY_COUNT; i++) {
        let rMatrix = mat4.create();
        battery.rMatrixArray.push(mat4.scale(rMatrix, rMatrix, [BATTERY_SCALE, BATTERY_SCALE, BATTERY_SCALE]));
        battery.tMatrixArray.push(mat4.fromTranslation(mat4.create(), [battery.pos[i], 0, 0]));
    }
    return {
        model: {},
        init: function() {
            GAME.model.background = JSON_MODEL.loadTriangleSets(SHADER.gl);
            SKECHUP_MODEL.loadModel(SHADER.gl, URL.cityModel, function (model) {
                GAME.model.cities = [];
                for(let i = 0; i < CITY_COUNT; i++) {
                    GAME.model.cities[i] = MODELS.shallowClone(model);
                    GAME.model.cities[i].rMatrix = city.rMatrixArray[i];
                    GAME.model.cities[i].tMatrix = city.tMatrixArray[i];
                }
            });
            SKECHUP_MODEL.loadModel(SHADER.gl, URL.batteryModel, function (model) {
                GAME.model.batteries = [];
                for(let i = 0; i < BATTERY_COUNT; i++) {
                    GAME.model.batteries[i] = MODELS.shallowClone(model);
                    GAME.model.batteries[i].rMatrix = battery.rMatrixArray[i];
                    GAME.model.batteries[i].tMatrix = battery.tMatrixArray[i];
                }
            });
            SKECHUP_MODEL.loadModel(SHADER.gl, URL.missileModel, function (model) {
                GAME.model.missile = {prototype: model};
                let rMatrix = mat4.create();
                GAME.model.missile.prototype.rMatrix = mat4.scale(rMatrix, rMatrix, [MISSILE_SCALE, MISSILE_SCALE, MISSILE_SCALE]);
                // GAME.model.missile.prototype.tMatrix[13] = 0.1;
            })
        },
        play: function () {
            MODELS.array = GAME.model.background.concat(GAME.model.cities);
            MODELS.array = MODELS.array.concat(GAME.model.batteries);
            MODELS.array.push(GAME.model.missile.prototype);
            renderTriangles();
        }
    }
}();