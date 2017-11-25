var MODELS = function () {
    return {
        selectId: -1,
        array: [],
        createMaterial: function() {
            return {
                ambient: [0.1,0.1,0.1], diffuse: [1.0,1.0,1.0], specular: [0.3,0.3,0.3], n:1
            }
        },
        createModel: function() {
            return {
                material: this.createMaterial(),
                coordArray: [],
                normalArray: [],
                indexArray: []
            };
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
        }
    }
}();