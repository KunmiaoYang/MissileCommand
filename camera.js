var CAMERA = function () {
    return {
        left: -0.5, right: 0.5,
        top: -0.5, bottom: 0.5,
        near: 0.5, far: 1.5,
        initCamera: function(eye, lookAt, viewUp) {
            this.xyz = vec3.fromValues(eye[0], eye[1], eye[2]);
            this.pMatrix = this.calcPerspective(this.left, this.right, this.top, this.bottom, this.near, this.far);

            let center = vec3.fromValues(eye[0] + lookAt[0], eye[1] + lookAt[1], eye[2] + lookAt[2]);
            this.vMatrix = mat4.lookAt(mat4.create(), eye, center, viewUp);
            this.updateCameraAxis();
        },
        updateCameraAxis: function() {
            this.X = vec3.fromValues(this.vMatrix[0], this.vMatrix[4], this.vMatrix[8]);
            this.Y = vec3.fromValues(this.vMatrix[1], this.vMatrix[5], this.vMatrix[9]);
            this.Z = vec3.fromValues(this.vMatrix[2], this.vMatrix[6], this.vMatrix[10]);
        },
        rotateCamera: function (rad, axis) {
            mat4.multiply(this.vMatrix, mat4.fromRotation(mat4.create(), -rad, axis), this.vMatrix);
            this.updateCameraAxis();
        },
        translateCamera: function (vec) {
            for(let i = 0; i < 3; i++) {
                this.vMatrix[i + 12] -= vec[i];
                this.xyz[i] += this.X[i] * vec[0] + this.Y[i] * vec[1] + this.Z[i] * vec[2];
            }
        },
        calcPerspective: function(left, right, top, bottom, near, far) {
            let n = Math.abs(near), f = Math.abs(far);
            let width = right - left, height = top - bottom, deep = f - n;
            let pMatrix = mat4.create();
            pMatrix[0] = 2*n/width;
            pMatrix[1] = 0;
            pMatrix[2] = 0;
            pMatrix[3] = 0;
            pMatrix[4] = 0;
            pMatrix[5] = 2*n/height;
            pMatrix[6] = 0;
            pMatrix[7] = 0;
            pMatrix[8] = (right + left)/width;
            pMatrix[9] = (top + bottom)/height;
            pMatrix[10] = -(f+n)/deep;
            pMatrix[11] = -1;
            pMatrix[12] = 0;
            pMatrix[13] = 0;
            pMatrix[14] = -2*f*n/deep;
            pMatrix[15] = 0;
            return pMatrix;
        }
    }
}();