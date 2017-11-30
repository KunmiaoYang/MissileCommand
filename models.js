var MODELS = function () {
    function shallowClone(model) {
        return {
            material: model.material,
            triBufferSize: model.triBufferSize,
            doubleSide: model.doubleSide,
            specularModel: model.specularModel,
            coordArray: model.coordArray,
            normalArray: model.normalArray,
            indexArray: model.indexArray,
            vertexBuffer: model.vertexBuffer,
            normalBuffer: model.normalBuffer,
            triangleBuffer: model.triangleBuffer
        };
    }
    return {
        array: [],
        createMaterial: function() {
            return {
                ambient: [0.1,0.1,0.1], diffuse: [1.0,1.0,1.0], specular: [0.3,0.3,0.3], n:1
            }
        },
        createModel: function() {
            var model = {
                material: this.createMaterial(),
                triBufferSize: 0,
                doubleSide: false,
                specularModel: 1,
                tMatrix: mat4.create(),
                rMatrix: mat4.create(),
                coordArray: [],
                normalArray: [],
                indexArray: []
            };
            return model;
        },
        getMaterialUniformLocation: function(gl, program, varName) {
            return {
                ambient: gl.getUniformLocation(program, varName + ".ambient"),
                diffuse: gl.getUniformLocation(program, varName + ".diffuse"),
                specular: gl.getUniformLocation(program, varName + ".specular"),
                n: gl.getUniformLocation(program, varName + ".n")
            };
        },
        setMaterialUniform: function(gl, materialUniform, material) {
            gl.uniform3fv(materialUniform.ambient, material.ambient);
            gl.uniform3fv(materialUniform.diffuse, material.diffuse);
            gl.uniform3fv(materialUniform.specular, material.specular);
            gl.uniform1f(materialUniform.n, material.n);
        },
        bufferTriangleSet: function(gl, triangleSet) {
            // send the vertex coords to webGL
            triangleSet.vertexBuffer = gl.createBuffer(); // init empty vertex coord buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, triangleSet.vertexBuffer); // activate that buffer
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleSet.coordArray), gl.STATIC_DRAW); // coords to that buffer

            // send the vertex normals to webGL
            triangleSet.normalBuffer = gl.createBuffer(); // init empty vertex coord buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, triangleSet.normalBuffer); // activate that buffer
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleSet.normalArray), gl.STATIC_DRAW); // normals to that buffer

            // send the triangle indices to webGL
            triangleSet.triangleBuffer = gl.createBuffer(); // init empty triangle index buffer
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleSet.triangleBuffer); // activate that buffer
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangleSet.indexArray), gl.STATIC_DRAW); // indices to that buffer
        },
        copyModel: function(prototype, rMatrix, tMatrix) {
            let newModel = shallowClone(prototype);
            newModel.rMatrix = rMatrix;
            newModel.tMatrix = tMatrix;
            return newModel;
        }
    }
}();