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
            let models = [];
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
                    model.indexArray = [];
                    $.each($(geo).find('p'), function (k, indexArrayNode) {
                        model.indexArray = model.indexArray.concat(text2Array($(indexArrayNode).text(), " ", parseInt));
                    });
                    models.push(model);
                });
                if(complete) complete(models);
            }, "xml");
            return models;
        },
        mergeModels: function(models) {
            let mergedModel = MODELS.createModel();
            $.each(models, function (i, model) {
                if(model.coordArray.length === model.normalArray.length && Math.max(...model.indexArray) <= model.coordArray.length / 3) {
                    let offset = mergedModel.coordArray.length / 3;
                    mergedModel.coordArray = mergedModel.coordArray.concat(model.coordArray);
                    mergedModel.normalArray = mergedModel.normalArray.concat(model.normalArray);
                    $.each(model.indexArray, function (j, index) {
                        mergedModel.indexArray.push(index + offset);
                        mergedModel.triBufferSize++;
                    });
                } else {
                    console.log("maxIndex = " + Math.max(...model.indexArray) + ": coordCount = " + model.coordArray.length / 3);
                }
            });
            return mergedModel;
        },
        loadModel: function (gl, modelFile, callback) {
            SKECHUP_MODEL.incomplete++;
            SKECHUP_MODEL.parseModels(modelFile, function (models) {
                let model = SKECHUP_MODEL.mergeModels(models);

                // Initialize light mode
                model.doubleSide = true;

                // Add dummy UVs
                MODELS.addDummyTexture(model);

                // Buffer data arrays into GPU
                MODELS.bufferTriangleSet(gl, model);

                SKECHUP_MODEL.incomplete--;
                $('canvas').trigger('loadData');
                if(callback) callback(model);
            });
        }
    };
}();