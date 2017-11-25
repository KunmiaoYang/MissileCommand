var JSON_MODEL = function() {
    var nLatitude = 20,
        nLongitude = 40;
    return {
        triangleSets: {},
        ellipsoids: {},
        loadTriangleSets: function(gl) {
            var inputTriangles = getJSONFile(INPUT_TRIANGLES_URL,"triangles");
            JSON_MODEL.triangleSets.array = [];
            JSON_MODEL.triangleSets.selectId = 0;

            if (inputTriangles != String.null) {
                var whichSetTri; // index of triangle in current triangle set
                var vtxToAdd = []; // vtx coords to add to the coord array

                for (var whichSet=0; whichSet<inputTriangles.length; whichSet++) {
                    var curSet = inputTriangles[whichSet];
                    var triangleSet = {};
                    triangleSet.doubleSide = true;
                    triangleSet.triBufferSize = 0;
                    triangleSet.specularModel = 1;
                    triangleSet.material = curSet.material;
                    triangleSet.coordArray = []; // 1D array of vertex coords for WebGL
                    triangleSet.normalArray = []; // 1D array of vertex normals for WebGL
                    triangleSet.indexArray = []; // 1D array of vertex indices for WebGL

                    // Calculate triangles center
                    var triCenter = vec3.create();
                    for(let i = 0; i < curSet.vertices.length; i++) {
                        vec3.add(triCenter, triCenter, curSet.vertices[i]);
                    }
                    vec3.scale(triCenter, triCenter, 1.0/curSet.vertices.length);

                    // Add coordinates to buffer
                    for(let i = 0; i < curSet.vertices.length; i++) {
                        vtxToAdd = vec3.subtract(vec3.create(), curSet.vertices[i], triCenter);
                        triangleSet.coordArray.push(vtxToAdd[0],vtxToAdd[1],vtxToAdd[2]);
                    }

                    // Add normals to buffer
                    for(let i = 0; i < curSet.normals.length; i++) {
                        triangleSet.normalArray.push(curSet.normals[i][0],curSet.normals[i][1],curSet.normals[i][2]);
                    }

                    // Add triangles to buffer
                    for (whichSetTri=0; whichSetTri<curSet.triangles.length; whichSetTri++) {
                        for (let i = 0; i < 3; i++, triangleSet.triBufferSize++) {
                            triangleSet.indexArray.push(curSet.triangles[whichSetTri][i]);
                        }
                    } // end for triangles in set

                    // Buffer data arrays into GPU
                    MODELS.bufferTriangleSet(gl, triangleSet);

                    // Initialize model transform matrices
                    triangleSet.tMatrix = mat4.fromTranslation(mat4.create(), triCenter);
                    triangleSet.rMatrix = mat4.identity(mat4.create());

                    // Push triangleset into array
                    triangleSet.id = MODELS.array.length;
                    MODELS.array.push(triangleSet);
                    JSON_MODEL.triangleSets.array.push(triangleSet);
                } // end for each triangle set
            } // end if triangles found
        },
        loadEllipsoids: function(gl) {
            var inputEllipsoids = getJSONFile(INPUT_SPHERES_URL,"ellipsoids");
            JSON_MODEL.ellipsoids.array = [];
            JSON_MODEL.ellipsoids.selectId = 0;

            if (inputEllipsoids != String.null) {
                for (var whichSet=0; whichSet<inputEllipsoids.length; whichSet++) {
                    var curSet = inputEllipsoids[whichSet];
                    var triangleSet = {};
                    triangleSet.doubleSide = false;
                    triangleSet.triBufferSize = 0;
                    triangleSet.specularModel = 1;
                    triangleSet.material = {};
                    triangleSet.material.ambient = curSet.ambient;
                    triangleSet.material.diffuse = curSet.diffuse;
                    triangleSet.material.specular = curSet.specular;
                    triangleSet.material.n = curSet.n;
                    triangleSet.coordArray = []; // 1D array of vertex coords for WebGL
                    triangleSet.normalArray = []; // 1D array of vertex normals for WebGL
                    triangleSet.indexArray = []; // 1D array of vertex indices for WebGL

                    // Create triangles center
                    var triCenter = vec3.fromValues(curSet.x, curSet.y, curSet.z);

                    // Calculate and add vertices coordinates and normals
                    let deltaLat = Math.PI / nLatitude;
                    let deltaLong = 2 * Math.PI / nLongitude;
                    for(let i = 0, theta = 0.0; i <= nLatitude; i++, theta += deltaLat) {
                        let sinT = Math.sin(theta), cosT = Math.cos(theta);
                        for(let j = 0, phi = 0.0; j <= nLongitude; j++, phi += deltaLong) {
                            let sinP = Math.sin(phi), cosP = Math.cos(phi);
                            let xu = cosP*sinT, yu = cosT, zu = sinP*sinT;
                            triangleSet.coordArray.push(xu * curSet.a, yu * curSet.b, zu * curSet.c);
                            triangleSet.normalArray.push(xu / curSet.a, yu / curSet.b, zu / curSet.c);
                        }
                    }

                    // Calculate and add triangles
                    for(let i = 0, up = 0, down = nLongitude + 1; i < nLatitude; i++, up = down, down += nLongitude + 1) {
                        for(let left = 0, right = 1; left < nLongitude; left++, right++, triangleSet.triBufferSize += 6) {
                            triangleSet.indexArray.push(up + left, down + left, up + right);
                            triangleSet.indexArray.push(down + left, down + right, up + right);
                        }
                    }

                    // Buffer data arrays into GPU
                    MODELS.bufferTriangleSet(gl, triangleSet);

                    // Initialize model transform matrices
                    triangleSet.tMatrix = mat4.fromTranslation(mat4.create(), triCenter);
                    triangleSet.rMatrix = mat4.identity(mat4.create());

                    // Push triangleset into array
                    triangleSet.id = MODELS.array.length;
                    MODELS.array.push(triangleSet);
                    JSON_MODEL.ellipsoids.array.push(triangleSet);
                } // end for each ellipsoid
            } // end if ellipsoids found
        }
    };
}();