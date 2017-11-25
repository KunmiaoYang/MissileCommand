var LIGHTS = function () {
    return {
        ready: false,
        array: [],
        load: function () {
            this.ready = false;
            $.getJSON(URL.lights, function (data) {
                LIGHTS.array = data;
                LIGHTS.ready = true;
                $('canvas').trigger('loadData');
            });
        },
        getLightUniformLocation: function(gl, program, varName) {
            return {
                xyz: gl.getUniformLocation(program, varName + ".xyz"),
                ambient: gl.getUniformLocation(program, varName + ".ambient"),
                diffuse: gl.getUniformLocation(program, varName + ".diffuse"),
                specular: gl.getUniformLocation(program, varName + ".specular")
            };
        },
        setLightUniform: function(gl, lightUniform, light) {
            gl.uniform3f(lightUniform.xyz, light.x, light.y, light.z);
            gl.uniform3fv(lightUniform.ambient, light.ambient);
            gl.uniform3fv(lightUniform.diffuse, light.diffuse);
            gl.uniform3fv(lightUniform.specular, light.specular);
        }
    }
}();