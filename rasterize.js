var RASTERIZE = function () {
    return {
        renderTriangles: function (gl) {    // render the loaded model
            gl.lineWidth(1.5);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers

            gl.uniform3fv(SHADER.uniforms.cameraPosUniform, CAMERA.xyz);
            gl.uniformMatrix4fv(SHADER.uniforms.vMatrixUniform, false, CAMERA.vMatrix);
            gl.uniformMatrix4fv(SHADER.uniforms.pMatrixUniform, false, CAMERA.pMatrix);
            for (let i = 0; i < LIGHTS.array.length; i++) {
                LIGHTS.setLightUniform(gl, SHADER.uniforms.lightUniformArray[i], LIGHTS.array[i]);
            }

            for (let i = 0; i < MODELS.array.length; i++) {
                if (OPTION.useLight)
                    gl.uniform1i(SHADER.uniforms.lightModelUniform, MODELS.array[i].specularModel);
                else
                    gl.uniform1i(SHADER.uniforms.lightModelUniform, -1);
                // triangleSetArray[i].material.ambient = [0.5,1.0,1.0];
                gl.uniform1f(SHADER.uniforms.doubleSideUniform, MODELS.array[i].doubleSide);
                MODELS.setMaterialUniform(gl, SHADER.uniforms.materialUniform, MODELS.array[i].material);
                gl.uniformMatrix4fv(SHADER.uniforms.mMatrixUniform, false, MODELS.calcModelMatrix(MODELS.array[i]));
                gl.uniformMatrix3fv(SHADER.uniforms.nMatrixUniform, false, mat3.normalFromMat4(mat3.create(), MODELS.array[i].mMatrix));

                // vertex buffer: activate and feed into vertex shader
                gl.bindBuffer(gl.ARRAY_BUFFER, MODELS.array[i].vertexBuffer); // activate
                gl.vertexAttribPointer(SHADER.vertexPositionAttrib, 3, gl.FLOAT, false, 0, 0); // feed

                // vertex normal buffer: activate and feed into vertex shader
                gl.bindBuffer(gl.ARRAY_BUFFER, MODELS.array[i].normalBuffer); // activate
                gl.vertexAttribPointer(SHADER.vertexNormalAttrib, 3, gl.FLOAT, false, 0, 0); // feed

                // texture uvs buffer: activate and feed into vertex shader
                gl.bindBuffer(gl.ARRAY_BUFFER, MODELS.array[i].textureUVBuffer); // activate
                gl.vertexAttribPointer(SHADER.textureUVAttrib, 2, gl.FLOAT, false, 0, 0); // feed

                // update texture uniform
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, MODELS.array[i].texture);
                gl.uniform1i(SHADER.uniforms.textureUniform, 0);

                // triangle buffer: activate and render
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, MODELS.array[i].triangleBuffer); // activate
                gl.drawElements(gl.TRIANGLES, MODELS.array[i].triBufferSize, gl.UNSIGNED_SHORT, 0); // render
            }
        },
        renderInfo: function() {    // render info
            $('#level').text(GAME.level.id);
            $('#score').text(GAME.score);
            $('#incoming').text(GAME.level.attackMissileCount - GAME.level.nextMissile);
        },
        setupOnLoad: function() {   // set up on load event for canvas
            $('canvas').on('loadData', function () {
                if (!LIGHTS.ready) {
                    console.log('Loading LIGHTS...');
                } else if(SKECHUP_MODEL.incomplete > 0) {
                    console.log('Loading SKECHUP MODEL...');
                } else {
                    console.log('All model ready!');
                    SHADER.setupShaders(); // setup the webGL shaders
                    RASTERIZE.renderTriangles(SHADER.gl); // draw the triangles using webGL
                }
            });
        },
        refresh: function() {   // refresh image when settings are changed
            DOM.load(OPTION, CAMERA, URL);   // load the data from html page
            LIGHTS.load(); // load in the lights
            SHADER.setupWebGL(); // set up the webGL environment
            CAMERA.pMatrix = CAMERA.calcPerspective(CAMERA.left, CAMERA.right, CAMERA.top, CAMERA.bottom, CAMERA.near, CAMERA.far);
        }
    }
}();