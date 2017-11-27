var GAME = function() {
    const CITY_SCALE = 0.003, CITY_COUNT = 6;
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
        },
        play: function () {
            MODELS.array = GAME.model.background.concat(GAME.model.cities);
            renderTriangles();
        }
    }
}();