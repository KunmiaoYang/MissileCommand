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
          int textureMode;
        };
        
        uniform light_struct uLights[N_LIGHT];
        uniform material_struct uMaterial;
        uniform int uLightModel;
        uniform sampler2D uTexture;
        
        varying vec3 vTransformedNormal;
        varying vec4 vPosition;
        varying vec3 vCameraDirection;
        varying vec2 vTextureUV;

        void main(void) {
            vec3 rgb = vec3(0, 0, 0);
            vec4 textureColor = texture2D(uTexture, vTextureUV);
            
            if(1 == uMaterial.textureMode) {
                gl_FragColor = textureColor;
            } else {
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
        }
        `;
    }
    // define vertex shader in essl using es6 template strings
    function getVShaderCode() {
        return `
        attribute vec3 vertexPosition;
        attribute vec3 vertexNormal;
        attribute vec2 textureUV;

        uniform mat4 uMMatrix;      // Model transformation
        uniform mat4 uVMatrix;      // Viewing transformation
        uniform mat4 uPMatrix;      // Projection transformation
        uniform mat3 uNMatrix;      // Normal vector transformation
        uniform vec3 uCameraPos;    // Camera position
        uniform bool uDoubleSide;
        
        varying vec3 vTransformedNormal;
        varying vec4 vPosition;
        varying vec3 vCameraDirection;
        varying vec2 vTextureUV;

        void main(void) {
            vPosition = uMMatrix * vec4(vertexPosition, 1.0);
            vTextureUV = textureUV;
            vCameraDirection = uCameraPos - vPosition.xyz;
            gl_Position = uPMatrix * uVMatrix * vPosition;
            vTransformedNormal = uNMatrix * vertexNormal;
            if(uDoubleSide && dot(vCameraDirection, vTransformedNormal) < 0.0)
                vTransformedNormal = -vTransformedNormal;
        }
        `;
    }
    // load image
    function loadImage(image) {
        let gl = SHADER.gl,
            texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));

        texture.image = image;
        texture.image.onload = function () {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);       // Flip image v direction, so v oriented from bottom to top
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        };
        if(texture.image.complete) texture.image.onload();
        return texture;
    }

    return {
        gl: DOM.canvas.getContext('webgl'), // get a webgl object from it
        shaderProgram: null,
        vertexPositionAttrib: null,
        vertexNormalAttrib: null,
        textureUVAttrib: null,
        uniforms: {},
        texture: {},
        setupWebGL: function() {
            let canvas = DOM.canvas, gl = SHADER.gl;
            gl.viewportWidth = canvas.width; // store width
            gl.viewportHeight = canvas.height; // store height
            gl.viewport(0, 0, canvas.width, canvas.height);
            SHADER.dummyTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, SHADER.dummyTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));

            try {
                if (gl === null) {
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

                        SHADER.textureUVAttrib = SHADER.gl.getAttribLocation(SHADER.shaderProgram, "textureUV");
                        SHADER.gl.enableVertexAttribArray(SHADER.textureUVAttrib); // input to shader from array

                        // Get uniform matrices
                        SHADER.uniforms.lightModelUniform = SHADER.gl.getUniformLocation(SHADER.shaderProgram, "uLightModel");
                        SHADER.uniforms.cameraPosUniform = SHADER.gl.getUniformLocation(SHADER.shaderProgram, "uCameraPos");
                        SHADER.uniforms.mMatrixUniform = SHADER.gl.getUniformLocation(SHADER.shaderProgram, "uMMatrix");
                        SHADER.uniforms.vMatrixUniform = SHADER.gl.getUniformLocation(SHADER.shaderProgram, "uVMatrix");
                        SHADER.uniforms.pMatrixUniform = SHADER.gl.getUniformLocation(SHADER.shaderProgram, "uPMatrix");
                        SHADER.uniforms.nMatrixUniform = SHADER.gl.getUniformLocation(SHADER.shaderProgram, "uNMatrix");
                        SHADER.uniforms.doubleSideUniform = SHADER.gl.getUniformLocation(SHADER.shaderProgram, "uDoubleSide");
                        SHADER.uniforms.textureUniform = SHADER.gl.getUniformLocation(SHADER.shaderProgram, "uTexture");
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
        },
        loadTexture: loadImage,
        dummyTexture: null
    }
}();