// render the loaded model
function renderTriangles() {
    SHADER.gl.clear(SHADER.gl.COLOR_BUFFER_BIT | SHADER.gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers

    SHADER.gl.uniform3fv(SHADER.uniforms.cameraPosUniform, CAMERA.xyz);
    SHADER.gl.uniformMatrix4fv(SHADER.uniforms.vMatrixUniform, false, CAMERA.vMatrix);
    SHADER.gl.uniformMatrix4fv(SHADER.uniforms.pMatrixUniform, false, CAMERA.pMatrix);
    for (let i = 0; i < LIGHTS.array.length; i++) {
        LIGHTS.setLightUniform(SHADER.gl, SHADER.uniforms.lightUniformArray[i], LIGHTS.array[i]);
    }

    for(let i = 0; i < MODELS.array.length; i++) {
        if(OPTION.useLight)
            SHADER.gl.uniform1i(SHADER.uniforms.lightModelUniform, MODELS.array[i].specularModel);
        else
            SHADER.gl.uniform1i(SHADER.uniforms.lightModelUniform, -1);
        // triangleSetArray[i].material.ambient = [0.5,1.0,1.0];
        SHADER.gl.uniform1f(SHADER.uniforms.doubleSideUniform, MODELS.array[i].doubleSide);
        MODELS.setMaterialUniform(SHADER.gl, SHADER.uniforms.materialUniform, MODELS.array[i].material);
        var mMatrix = mat4.multiply(mat4.create(), MODELS.array[i].tMatrix, MODELS.array[i].rMatrix);
        SHADER.gl.uniformMatrix4fv(SHADER.uniforms.mMatrixUniform, false, mMatrix);
        SHADER.gl.uniformMatrix3fv(SHADER.uniforms.nMatrixUniform, false, mat3.normalFromMat4(mat3.create(), MODELS.array[i].rMatrix));

        // vertex buffer: activate and feed into vertex shader
        SHADER.gl.bindBuffer(SHADER.gl.ARRAY_BUFFER, MODELS.array[i].vertexBuffer); // activate
        SHADER.gl.vertexAttribPointer(SHADER.vertexPositionAttrib,3,SHADER.gl.FLOAT,false,0,0); // feed

        // vertex normal buffer: activate and feed into vertex shader
        SHADER.gl.bindBuffer(SHADER.gl.ARRAY_BUFFER, MODELS.array[i].normalBuffer); // activate
        SHADER.gl.vertexAttribPointer(SHADER.vertexNormalAttrib,3,SHADER.gl.FLOAT,false,0,0); // feed

        // triangle buffer: activate and render
        SHADER.gl.bindBuffer(SHADER.gl.ELEMENT_ARRAY_BUFFER, MODELS.array[i].triangleBuffer); // activate
        SHADER.gl.drawElements(SHADER.gl.TRIANGLES, MODELS.array[i].triBufferSize,SHADER.gl.UNSIGNED_SHORT,0); // render
    }
} // end render triangles

// set up on load event for canvas
function setupOnLoad() {
    $('canvas').on('loadData', function () {
        if (!LIGHTS.ready) {
            console.log('LIGHTS not ready!');
        } else if(SKECHUP_MODEL.incomplete > 0) {
            console.log('SKECHUP_MODEL not ready!');
        } else {
            console.log('All model ready!');
            SHADER.setupShaders(); // setup the webGL shaders
            renderTriangles(); // draw the triangles using webGL
        }
    });
}

// refresh image when settings are changed
function refresh() {
    DOM.load(OPTION, CAMERA, URL);   // load the data from html page
    LIGHTS.load(); // load in the lights
    SHADER.setupWebGL(); // set up the webGL environment
    CAMERA.pMatrix = CAMERA.calcPerspective(CAMERA.left, CAMERA.right, CAMERA.top, CAMERA.bottom, CAMERA.near, CAMERA.far);
}

/* MAIN -- HERE is where execution begins after window load */
function main() {
    DOM.load(OPTION, CAMERA, URL);   // load the data from html page
    LIGHTS.load(); // load in the lights
    SHADER.setupWebGL(); // set up the webGL environment
    CAMERA.initCamera(); // Initialize camera
    JSON_MODEL.loadTriangleSets(SHADER.gl); // load in the triangles from tri file
    JSON_MODEL.loadEllipsoids(SHADER.gl); // load in the ellipsoids from ellipsoids file
    SKECHUP_MODEL.loadModel(SHADER.gl, URL.cityModel, 'city', 0.002);
    EVENTS.setupKeyEvent();
    setupOnLoad();
} // end main
