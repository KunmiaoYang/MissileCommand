var MODELS = function () {
    function shallowClone(model) {
        return {
            material: model.material,
            triBufferSize: model.triBufferSize,
            doubleSide: model.doubleSide,
            texture: model.texture,
            specularModel: model.specularModel,
            coordArray: model.coordArray,
            normalArray: model.normalArray,
            indexArray: model.indexArray,
            uvArray: model.uvArray,
            vertexBuffer: model.vertexBuffer,
            normalBuffer: model.normalBuffer,
            triangleBuffer: model.triangleBuffer,
            textureUVBuffer: model.textureUVBuffer
        };
    }
    return {
        array: [],
        createMaterial: function() {
            return {
                ambient: [0.1,0.1,0.1], diffuse: [1.0,1.0,1.0], specular: [0.3,0.3,0.3], n:1, textureMode: 0
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
        calcModelMatrix: function (model) {
            let mMatrix = mat4.multiply(mat4.create(), model.tMatrix, model.rMatrix);
            if(model.rootModel) {
                mMatrix = mat4.multiply(mat4.create(), MODELS.calcModelMatrix(model.rootModel), mMatrix);
            }
            model.mMatrix = mMatrix;
            return mMatrix;
        },
        getMaterialUniformLocation: function(gl, program, varName) {
            return {
                ambient: gl.getUniformLocation(program, varName + ".ambient"),
                diffuse: gl.getUniformLocation(program, varName + ".diffuse"),
                specular: gl.getUniformLocation(program, varName + ".specular"),
                n: gl.getUniformLocation(program, varName + ".n"),
                textureMode: gl.getUniformLocation(program, varName + ".textureMode")
            };
        },
        setMaterialUniform: function(gl, materialUniform, material) {
            gl.uniform3fv(materialUniform.ambient, material.ambient);
            gl.uniform3fv(materialUniform.diffuse, material.diffuse);
            gl.uniform3fv(materialUniform.specular, material.specular);
            gl.uniform1f(materialUniform.n, material.n);
            gl.uniform1i(materialUniform.textureMode, material.textureMode);
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

            // send the texture to webGL
            triangleSet.textureUVBuffer = gl.createBuffer(); // init empty triangle index buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, triangleSet.textureUVBuffer); // activate that buffer
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleSet.uvArray), gl.STATIC_DRAW); // normals to that buffer
        },
        copyModel: function(prototype, rMatrix, tMatrix) {
            let newModel = shallowClone(prototype);
            newModel.rMatrix = rMatrix;
            newModel.tMatrix = tMatrix;
            return newModel;
        },
        addDummyTexture: function (model) {
            model.texture = SHADER.dummyTexture;
            let len = model.coordArray.length / 3 * 2;
            model.uvArray = new Array(len);
            for(let i = 0; i < len; i++)
                model.uvArray[i] = 0;
        }
    }
}();