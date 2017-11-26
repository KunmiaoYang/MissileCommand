// Globals
var SKECHUP_MODEL = function() {
    function text2Array(text, delimiter, parser) {
        return $.map(text.split(delimiter), function (str, i) {
            return parser(str);
        });
    }
    return {
        incomplete: 0,
        parseModels: function (modelFile, complete) {
            models = [];
            $.get(modelFile, function (data, status) {
                let geometries = $(data).find('geometry');
                $.each(geometries, function (i, geo) {
                    let model = {};
                    $.each($(geo).find('input'), function (j, inp) {
                        let sem = $(inp).attr('semantic');
                        if ('POSITION' === sem) {
                            model.posId = $(inp).attr('source');
                        } else if ('NORMAL' === sem) {
                            model.norId = $(inp).attr('source');
                        }
                    });
                    model.coordArray = text2Array($(geo).find(model.posId).find('float_array').text(), " ", parseFloat);
                    model.normalArray = text2Array($(geo).find(model.norId).find('float_array').text(), " ", parseFloat);
                    model.indexArray = text2Array($(geo).find('p').text(), " ", parseInt);
                    models.push(model);
                });
                if(complete) complete(models);
            }, "xml");
            return models;
        },
        mergeModels: function(models) {
            let mergedModel = MODELS.createModel();
            $.each(models, function (i, model) {
                let offset = mergedModel.coordArray.length / 3;
                mergedModel.coordArray = mergedModel.coordArray.concat(model.coordArray);
                mergedModel.normalArray = mergedModel.normalArray.concat(model.normalArray);
                $.each(model.indexArray, function(j, index) {
                    mergedModel.indexArray.push(index + offset);
                    mergedModel.triBufferSize++;
                });
            });
            return mergedModel;
        },
        loadModel: function (gl, modelFile, name, scale) {
            SKECHUP_MODEL.incomplete++;
            SKECHUP_MODEL.parseModels(modelFile, function (models) {
                let model = SKECHUP_MODEL.mergeModels(models);

                // Initialize light mode
                model.doubleSide = false;
                model.specularModel = 1;

                // Initialize model transform matrices
                model.tMatrix = mat4.create();
                model.rMatrix = mat4.create();
                model.rMatrix = mat4.scale(model.rMatrix, model.rMatrix, [scale, scale, scale]);

                // Buffer data arrays into GPU
                MODELS.bufferTriangleSet(gl, model);

                // Push triangleset into array
                model.id = MODELS.array.length;
                MODELS.array.push(model);
                MODELS[name] = model;
                SKECHUP_MODEL.incomplete--;
                $('canvas').trigger('loadData');
            });
        }
    };
}();