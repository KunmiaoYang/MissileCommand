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

/* webgl globals */
var gl = null; // the all powerful gl object. It's all here folks!
var shaderProgram;
var vertexPositionAttrib; // where to put position for vertex shader
var vertexNormalAttrib; // where to put normal for vertex shader
var uniforms = {};
//endregion

// ASSIGNMENT HELPER FUNCTIONS

//region Set up environment
// Set up the webGL environment
function setupWebGL() {

    // Get the canvas and context
    var canvas = document.getElementById("myWebGLCanvas"); // create a js canvas
    gl = canvas.getContext("webgl"); // get a webgl object from it
    gl.viewportWidth = canvas.width; // store width
    gl.viewportHeight = canvas.height; // store height
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    try {
      if (gl == null) {
        throw "unable to create gl context -- is your browser gl ready?";
      } else {
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // use black when we clear the frame buffer
        gl.clearDepth(1.0); // use max when we clear the depth buffer
        gl.enable(gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
      }
    } // end try
    
    catch(e) {
      console.log(e);
    } // end catch
 
} // end setupWebGL

// Set up the webGL shaders
function setupShaders() {

    // define fragment shader in essl using es6 template strings
    var fShaderCode = `
        
        precision mediump float;
        struct light_struct {
          vec3 xyz;
          vec3 ambient;
          vec3 diffuse;
          vec3 specular;
        };
        struct material_struct {
          vec3 ambient;
          vec3 diffuse;
          vec3 specular;
          float n;
        };
        
        uniform light_struct uLights[N_LIGHT];
        uniform material_struct uMaterial;
        uniform int uLightModel;
        
        varying vec3 vTransformedNormal;
        varying vec4 vPosition;
        varying vec3 vCameraDirection;

        void main(void) {
            vec3 rgb = vec3(0, 0, 0);
            
            if(uLightModel < 0) {
                rgb = uMaterial.diffuse;
            } else {
                for(int i = 0; i < N_LIGHT; i++) {
                    vec3 L = normalize(uLights[i].xyz - vPosition.xyz);
                    vec3 V = normalize(vCameraDirection);
                    vec3 N = normalize(vTransformedNormal);
                    float dVN = dot(V, N);
                    float dLN = dot(L, N);
                    rgb += uMaterial.ambient * uLights[i].ambient; // Ambient shading
                    if(dLN > 0.0 && dVN > 0.0) {
                        rgb += dLN * (uMaterial.diffuse * uLights[i].diffuse);      // Diffuse shading
                        if(0 == uLightModel) {          // Phong specular shading
                            vec3 R = normalize(2.0 * dot(N, L) * N - L);
                            float weight = pow(dot(V, R), uMaterial.n);
                            if(weight > 0.0) rgb += weight * (uMaterial.specular * uLights[i].specular);
                        } else if(1 == uLightModel) {          // Blinn-Phong specular shading
                            vec3 H = normalize(V + L);
                            float weight = pow(dot(N, H), uMaterial.n);
                            if(weight > 0.0) rgb += weight * (uMaterial.specular * uLights[i].specular);
                        }
                    }
                }
            }
            gl_FragColor = vec4(rgb, 1); // all fragments are white
        }
    `;
    fShaderCode = "#define N_LIGHT " + LIGHTS.array.length + "\n" + fShaderCode;

    // define vertex shader in essl using es6 template strings
    var vShaderCode = `
        attribute vec3 vertexPosition;
        attribute vec3 vertexNormal;

        uniform mat4 uMMatrix;      // Model transformation
        uniform mat4 uVMatrix;      // Viewing transformation
        uniform mat4 uPMatrix;      // Projection transformation
        uniform mat3 uNMatrix;      // Normal vector transformation
        uniform vec3 uCameraPos;    // Camera position
        uniform bool uDoubleSide;
        
        varying vec3 vTransformedNormal;
        varying vec4 vPosition;
        varying vec3 vCameraDirection;

        void main(void) {
            vPosition = uMMatrix * vec4(vertexPosition, 1.0);
            vCameraDirection = uCameraPos - vPosition.xyz;
            gl_Position = uPMatrix * uVMatrix * vPosition;
            vTransformedNormal = uNMatrix * vertexNormal;
            if(uDoubleSide && dot(vCameraDirection, vTransformedNormal) < 0.0)
                vTransformedNormal = -vTransformedNormal;
        }
    `;

    try {
        // console.log("fragment shader: "+fShaderCode);
        var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
        gl.shaderSource(fShader,fShaderCode); // attach code to shader
        gl.compileShader(fShader); // compile the code for gpu execution

        // console.log("vertex shader: "+vShaderCode);
        var vShader = gl.createShader(gl.VERTEX_SHADER); // create vertex shader
        gl.shaderSource(vShader,vShaderCode); // attach code to shader
        gl.compileShader(vShader); // compile the code for gpu execution

        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) { // bad frag shader compile
            throw "error during fragment shader compile: " + gl.getShaderInfoLog(fShader);
            gl.deleteShader(fShader);
        } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) { // bad vertex shader compile
            throw "error during vertex shader compile: " + gl.getShaderInfoLog(vShader);
            gl.deleteShader(vShader);
        } else { // no compile errors
            shaderProgram = gl.createProgram(); // create the single shader program
            gl.attachShader(shaderProgram, fShader); // put frag shader in program
            gl.attachShader(shaderProgram, vShader); // put vertex shader in program
            gl.linkProgram(shaderProgram); // link program into gl context

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) { // bad program link
                throw "error during shader program linking: " + gl.getProgramInfoLog(shaderProgram);
            } else { // no shader program link errors
                gl.useProgram(shaderProgram); // activate shader program (frag and vert)
                vertexPositionAttrib = // get pointer to vertex shader input
                    gl.getAttribLocation(shaderProgram, "vertexPosition");
                gl.enableVertexAttribArray(vertexPositionAttrib); // input to shader from array

                vertexNormalAttrib = gl.getAttribLocation(shaderProgram, "vertexNormal");
                gl.enableVertexAttribArray(vertexNormalAttrib); // input to shader from array

                // Get uniform matrices
                uniforms.lightModelUniform = gl.getUniformLocation(shaderProgram, "uLightModel");
                uniforms.cameraPosUniform = gl.getUniformLocation(shaderProgram, "uCameraPos");
                uniforms.mMatrixUniform = gl.getUniformLocation(shaderProgram, "uMMatrix");
                uniforms.vMatrixUniform = gl.getUniformLocation(shaderProgram, "uVMatrix");
                uniforms.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
                uniforms.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
                uniforms.doubleSideUniform = gl.getUniformLocation(shaderProgram, "uDoubleSide");
                uniforms.materialUniform = MODELS.getMaterialUniformLocation(gl, shaderProgram, "uMaterial");
                uniforms.lightUniformArray = [];
                for (let i = 0; i < LIGHTS.array.length; i++) {
                    uniforms.lightUniformArray[i] = LIGHTS.getLightUniformLocation(gl, shaderProgram, "uLights[" + i + "]");
                }
            } // end if no shader program link errors
        } // end if no compile errors
    } // end try

    catch(e) {
        console.log(e);
    } // end catch
} // end setup shaders
//endregion

// render the loaded model
function renderTriangles() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers

    gl.uniform3fv(uniforms.cameraPosUniform, CAMERA.xyz);
    gl.uniformMatrix4fv(uniforms.vMatrixUniform, false, CAMERA.vMatrix);
    gl.uniformMatrix4fv(uniforms.pMatrixUniform, false, CAMERA.pMatrix);
    for (let i = 0; i < LIGHTS.array.length; i++) {
        LIGHTS.setLightUniform(gl, uniforms.lightUniformArray[i], LIGHTS.array[i]);
    }

    var scaleMatrix = mat4.identity(mat4.create());
    mat4.scale(scaleMatrix, scaleMatrix, [1.2, 1.2, 1.2]);

    for(let i = 0; i < MODELS.array.length; i++) {
        if(OPTION.useLight)
            gl.uniform1i(uniforms.lightModelUniform, MODELS.array[i].specularModel);
        else
            gl.uniform1i(uniforms.lightModelUniform, -1);
        // triangleSetArray[i].material.ambient = [0.5,1.0,1.0];
        gl.uniform1f(uniforms.doubleSideUniform, MODELS.array[i].doubleSide);
        MODELS.setMaterialUniform(gl, uniforms.materialUniform, MODELS.array[i].material);
        var mMatrix = mat4.multiply(mat4.create(), MODELS.array[i].tMatrix, MODELS.array[i].rMatrix);
        if (MODELS.selectId === i) {
            mMatrix = mat4.multiply(mat4.create(), mMatrix, scaleMatrix);
        }
        gl.uniformMatrix4fv(uniforms.mMatrixUniform, false, mMatrix);
        gl.uniformMatrix3fv(uniforms.nMatrixUniform, false, mat3.normalFromMat4(mat3.create(), MODELS.array[i].rMatrix));

        // vertex buffer: activate and feed into vertex shader
        gl.bindBuffer(gl.ARRAY_BUFFER, MODELS.array[i].vertexBuffer); // activate
        gl.vertexAttribPointer(vertexPositionAttrib,3,gl.FLOAT,false,0,0); // feed

        // vertex normal buffer: activate and feed into vertex shader
        gl.bindBuffer(gl.ARRAY_BUFFER, MODELS.array[i].normalBuffer); // activate
        gl.vertexAttribPointer(vertexNormalAttrib,3,gl.FLOAT,false,0,0); // feed

        // triangle buffer: activate and render
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, MODELS.array[i].triangleBuffer); // activate
        gl.drawElements(gl.TRIANGLES, MODELS.array[i].triBufferSize,gl.UNSIGNED_SHORT,0); // render
    }
} // end render triangles

// set up on load event for canvas
function setupOnLoad() {
    $('canvas').on('loadData', function () {
        if (!LIGHTS.ready) {
            console.log('LIGHTS not ready!');
        } else {
            setupShaders(); // setup the webGL shaders
            renderTriangles(); // draw the triangles using webGL
        }
    });
}

function refresh() {
    DOM.load(OPTION, CAMERA, URL);   // load the data from html page
    LIGHTS.load(); // load in the lights
    setupWebGL(); // set up the webGL environment
    CAMERA.pMatrix = CAMERA.calcPerspective(CAMERA.left, CAMERA.right, CAMERA.top, CAMERA.bottom, CAMERA.near, CAMERA.far);
}

/* MAIN -- HERE is where execution begins after window load */
function main() {
    DOM.load(OPTION, CAMERA, URL);   // load the data from html page
    LIGHTS.load(); // load in the lights
    setupWebGL(); // set up the webGL environment
    CAMERA.initCamera(Eye, LookAt, ViewUp); // Initialize camera
    JSON_MODEL.loadTriangleSets(gl); // load in the triangles from tri file
    JSON_MODEL.loadEllipsoids(gl); // load in the ellipsoids from ellipsoids file
    EVENTS.setupKeyEvent();
    setupOnLoad();
} // end main
