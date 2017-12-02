var SHADER = function() {
    // define fragment shader in essl using es6 template strings
    function getFShaderCode(nLight) {
        return "#define N_LIGHT " + nLight + "\n" +
            `
            
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
    }
    // define vertex shader in essl using es6 template strings
    function getVShaderCode() {
        return `
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
    }
    return {
        canvas: document.getElementById("myWebGLCanvas"),
        gl: null,
        shaderProgram: null,
        vertexPositionAttrib: null,
        vertexNormalAttrib: null,
        uniforms: {},
        setupWebGL: function() {

            // Get the canvas and context
            var canvas = SHADER.canvas; // create a js canvas
            SHADER.gl = canvas.getContext("webgl"); // get a webgl object from it
            SHADER.gl.viewportWidth = canvas.width; // store width
            SHADER.gl.viewportHeight = canvas.height; // store height
            SHADER.gl.viewport(0, 0, canvas.width, canvas.height);

            try {
                if (SHADER.gl == null) {
                    throw "unable to create gl context -- is your browser gl ready?";
                } else {
                    SHADER.gl.clearColor(0.0, 0.0, 0.0, 1.0); // use black when we clear the frame buffer
                    SHADER.gl.clearDepth(1.0); // use max when we clear the depth buffer
                    SHADER.gl.enable(SHADER.gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
                }
            } // end try

            catch(e) {
                console.log(e);
            } // end catch

        },
        setupShaders: function() {
        let fShaderCode = getFShaderCode(LIGHTS.array.length);
        let vShaderCode = getVShaderCode();
        try {
            // console.log("fragment shader: "+fShaderCode);
            var fShader = SHADER.gl.createShader(SHADER.gl.FRAGMENT_SHADER); // create frag shader
            SHADER.gl.shaderSource(fShader,fShaderCode); // attach code to shader
            SHADER.gl.compileShader(fShader); // compile the code for gpu execution

            // console.log("vertex shader: "+vShaderCode);
            var vShader = SHADER.gl.createShader(SHADER.gl.VERTEX_SHADER); // create vertex shader
            SHADER.gl.shaderSource(vShader,vShaderCode); // attach code to shader
            SHADER.gl.compileShader(vShader); // compile the code for gpu execution

            if (!SHADER.gl.getShaderParameter(fShader, SHADER.gl.COMPILE_STATUS)) { // bad frag shader compile
                throw "error during fragment shader compile: " + SHADER.gl.getShaderInfoLog(fShader);
                SHADER.gl.deleteShader(fShader);
            } else if (!SHADER.gl.getShaderParameter(vShader, SHADER.gl.COMPILE_STATUS)) { // bad vertex shader compile
                throw "error during vertex shader compile: " + SHADER.gl.getShaderInfoLog(vShader);
                SHADER.gl.deleteShader(vShader);
            } else { // no compile errors
                SHADER.shaderProgram = SHADER.gl.createProgram(); // create the single shader program
                SHADER.gl.attachShader(SHADER.shaderProgram, fShader); // put frag shader in program
                SHADER.gl.attachShader(SHADER.shaderProgram, vShader); // put vertex shader in program
                SHADER.gl.linkProgram(SHADER.shaderProgram); // link program into gl context

                if (!SHADER.gl.getProgramParameter(SHADER.shaderProgram, SHADER.gl.LINK_STATUS)) { // bad program link
                    throw "error during shader program linking: " + SHADER.gl.getProgramInfoLog(SHADER.shaderProgram);
                } else { // no shader program link errors
                    SHADER.gl.useProgram(SHADER.shaderProgram); // activate shader program (frag and vert)
                    SHADER.vertexPositionAttrib = // get pointer to vertex shader input
                        SHADER.gl.getAttribLocation(SHADER.shaderProgram, "vertexPosition");
                    SHADER.gl.enableVertexAttribArray(SHADER.vertexPositionAttrib); // input to shader from array

                    SHADER.vertexNormalAttrib = SHADER.gl.getAttribLocation(SHADER.shaderProgram, "vertexNormal");
                    SHADER.gl.enableVertexAttribArray(SHADER.vertexNormalAttrib); // input to shader from array

                    // Get uniform matrices
                    SHADER.uniforms.lightModelUniform = SHADER.gl.getUniformLocation(SHADER.shaderProgram, "uLightModel");
                    SHADER.uniforms.cameraPosUniform = SHADER.gl.getUniformLocation(SHADER.shaderProgram, "uCameraPos");
                    SHADER.uniforms.mMatrixUniform = SHADER.gl.getUniformLocation(SHADER.shaderProgram, "uMMatrix");
                    SHADER.uniforms.vMatrixUniform = SHADER.gl.getUniformLocation(SHADER.shaderProgram, "uVMatrix");
                    SHADER.uniforms.pMatrixUniform = SHADER.gl.getUniformLocation(SHADER.shaderProgram, "uPMatrix");
                    SHADER.uniforms.nMatrixUniform = SHADER.gl.getUniformLocation(SHADER.shaderProgram, "uNMatrix");
                    SHADER.uniforms.doubleSideUniform = SHADER.gl.getUniformLocation(SHADER.shaderProgram, "uDoubleSide");
                    SHADER.uniforms.materialUniform = MODELS.getMaterialUniformLocation(SHADER.gl, SHADER.shaderProgram, "uMaterial");
                    SHADER.uniforms.lightUniformArray = [];
                    for (let i = 0; i < LIGHTS.array.length; i++) {
                        SHADER.uniforms.lightUniformArray[i] = LIGHTS.getLightUniformLocation(SHADER.gl, SHADER.shaderProgram, "uLights[" + i + "]");
                    }
                } // end if no shader program link errors
            } // end if no compile errors
        } // end try

        catch(e) {
            console.log(e);
        } // end catch
    }
    }
}();