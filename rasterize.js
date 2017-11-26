//region GLOBAL CONSTANTS AND VARIABLES
/* assignment specific globals */
const WIN_Z = 0;  // default graphics window z coord in world space
const WIN_LEFT = 0; const WIN_RIGHT = 1;  // default left and right x coords in world space
const WIN_BOTTOM = 0; const WIN_TOP = 1;  // default top and bottom y coords in world space
const INPUT_TRIANGLES_URL = "https://ncsucgclass.github.io/prog2/triangles.json"; // triangles file loc
const INPUT_SPHERES_URL = "https://ncsucgclass.github.io/prog2/ellipsoids.json"; // ellipsoids file loc
const DELTA_TRANS = 0.0125; const DELTA_ROT = 0.02;

var Eye = new vec4.fromValues(0.5,0.5,-0.5,1.0); // default eye position in world space
var LookAt = vec3.fromValues(0, 0, 1); // default eye look at direction in world space
var ViewUp = vec3.fromValues(0, 1, 0); // default eye view up direction in world space
//endregion

// render the loaded model
function renderTriangles() {
    SHADER.gl.clear(SHADER.gl.COLOR_BUFFER_BIT | SHADER.gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers

    SHADER.gl.uniform3fv(SHADER.uniforms.cameraPosUniform, CAMERA.xyz);
    SHADER.gl.uniformMatrix4fv(SHADER.uniforms.vMatrixUniform, false, CAMERA.vMatrix);
    SHADER.gl.uniformMatrix4fv(SHADER.uniforms.pMatrixUniform, false, CAMERA.pMatrix);
    for (let i = 0; i < LIGHTS.array.length; i++) {
        LIGHTS.setLightUniform(SHADER.gl, SHADER.uniforms.lightUniformArray[i], LIGHTS.array[i]);
    }

    var scaleMatrix = mat4.identity(mat4.create());
    mat4.scale(scaleMatrix, scaleMatrix, [1.2, 1.2, 1.2]);

    for(let i = 0; i < MODELS.array.length; i++) {
        if(OPTION.useLight)
            SHADER.gl.uniform1i(SHADER.uniforms.lightModelUniform, MODELS.array[i].specularModel);
        else
            SHADER.gl.uniform1i(SHADER.uniforms.lightModelUniform, -1);
        // triangleSetArray[i].material.ambient = [0.5,1.0,1.0];
        SHADER.gl.uniform1f(SHADER.uniforms.doubleSideUniform, MODELS.array[i].doubleSide);
        MODELS.setMaterialUniform(SHADER.gl, SHADER.uniforms.materialUniform, MODELS.array[i].material);
        var mMatrix = mat4.multiply(mat4.create(), MODELS.array[i].tMatrix, MODELS.array[i].rMatrix);
        if (MODELS.selectId === i) {
            mMatrix = mat4.multiply(mat4.create(), mMatrix, scaleMatrix);
        }
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
        } else {
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
    CAMERA.initCamera(Eye, LookAt, ViewUp); // Initialize camera
    JSON_MODEL.loadTriangleSets(SHADER.gl); // load in the triangles from tri file
    JSON_MODEL.loadEllipsoids(SHADER.gl); // load in the ellipsoids from ellipsoids file
    EVENTS.setupKeyEvent();
    setupOnLoad();
} // end main
