var EVENTS = function () {
    var currentlyPressedKeys = [];
    return {
        handleKeyDown: function (event) {
            currentlyPressedKeys[event.keyCode] = true;

            // Part 4: interactively change view
            // Part 5: Interactively select a model
            switch(event.key) {
                case "a":    // a — translate view left along view X
                    CAMERA.translateCamera(vec3.fromValues(-DELTA_TRANS, 0, 0));
                    return;
                case "d":    // d — translate view right along view X
                    CAMERA.translateCamera(vec3.fromValues(DELTA_TRANS, 0, 0));
                    return;
                case "w":    // w — translate view forward along view Z
                    CAMERA.translateCamera(vec3.fromValues(0, 0, -DELTA_TRANS));
                    return;
                case "s":    // s — translate view backward along view Z
                    CAMERA.translateCamera(vec3.fromValues(0, 0, DELTA_TRANS));
                    return;
                case "q":    // q — translate view up along view Y
                    CAMERA.translateCamera(vec3.fromValues(0, DELTA_TRANS, 0));
                    return;
                case "e":    // e — translate view down along view Y
                    CAMERA.translateCamera(vec3.fromValues(0, -DELTA_TRANS, 0));
                    return;
                case "A":    // A — rotate view left around view Y (yaw)
                    CAMERA.rotateCamera(DELTA_ROT, vec3.fromValues(0, 1, 0));
                    return;
                case "D":    // D — rotate view right around view Y (yaw)
                    CAMERA.rotateCamera(-DELTA_ROT, vec3.fromValues(0, 1, 0));
                    return;
                case "W":    // W — rotate view forward around view X (pitch)
                    CAMERA.rotateCamera(DELTA_ROT, vec3.fromValues(1, 0, 0));
                    return;
                case "S":    // S — rotate view backward around view X (pitch)
                    CAMERA.rotateCamera(-DELTA_ROT, vec3.fromValues(1, 0, 0));
                    return;
            }

            // Part 6: Interactively change lighting on a model
            // Part 7: Interactively transform models
            if (-1 !== MODELS.selectId) {
                let model = MODELS.array[MODELS.selectId];
                switch (event.key) {
                    case "k":   // k — translate selection left along view X
                        mat4.translate(model.tMatrix, model.tMatrix, vec3.scale(vec3.create(), CAMERA.X, -DELTA_TRANS));
                        renderTriangles();
                        return;
                    case ";":   // ; — translate selection right along view X
                        mat4.translate(model.tMatrix, model.tMatrix, vec3.scale(vec3.create(), CAMERA.X, DELTA_TRANS));
                        renderTriangles();
                        return;
                    case "o":   // o — translate selection forward along view Z
                        mat4.translate(model.tMatrix, model.tMatrix, vec3.scale(vec3.create(), CAMERA.Z, -DELTA_TRANS));
                        renderTriangles();
                        return;
                    case "l":   // l — translate selection backward along view Z
                        mat4.translate(model.tMatrix, model.tMatrix, vec3.scale(vec3.create(), CAMERA.Z, DELTA_TRANS));
                        renderTriangles();
                        return;
                    case "i":   // i — translate selection up along view Y
                        mat4.translate(model.tMatrix, model.tMatrix, vec3.scale(vec3.create(), CAMERA.Y, DELTA_TRANS));
                        renderTriangles();
                        return;
                    case "p":   // p — translate selection down along view Y
                        mat4.translate(model.tMatrix, model.tMatrix, vec3.scale(vec3.create(), CAMERA.Y, -DELTA_TRANS));
                        renderTriangles();
                        return;
                    case "K":   // K — rotate selection left around view Y (yaw)
                        mat4.multiply(model.rMatrix, mat4.fromRotation(mat4.create(), -DELTA_ROT, CAMERA.Y), model.rMatrix);
                        renderTriangles();
                        return;
                    case ":":   // : — rotate selection right around view Y (yaw)
                        mat4.multiply(model.rMatrix, mat4.fromRotation(mat4.create(), DELTA_ROT, CAMERA.Y), model.rMatrix);
                        renderTriangles();
                        return;
                    case "O":   // O — rotate selection forward around view X (pitch)
                        mat4.multiply(model.rMatrix, mat4.fromRotation(mat4.create(), -DELTA_ROT, CAMERA.X), model.rMatrix);
                        renderTriangles();
                        return;
                    case "L":   // L — rotate selection backward around view X (pitch)
                        mat4.multiply(model.rMatrix, mat4.fromRotation(mat4.create(), DELTA_ROT, CAMERA.X), model.rMatrix);
                        renderTriangles();
                        return;
                    case "I":   // I — rotate selection clockwise around view Z (roll)
                        mat4.multiply(model.rMatrix, mat4.fromRotation(mat4.create(), -DELTA_ROT, CAMERA.Z), model.rMatrix);
                        renderTriangles();
                        return;
                    case "P":   // P — rotate selection counterclockwise around view Z (roll)
                        mat4.multiply(model.rMatrix, mat4.fromRotation(mat4.create(), DELTA_ROT, CAMERA.Z), model.rMatrix);
                        renderTriangles();
                        return;
                }
            }
        },
        handleKeyUp: function (event) {
            currentlyPressedKeys[event.keyCode] = false;
        },
        setupKeyEvent: function() {
            document.onkeydown = EVENTS.handleKeyDown;
            document.onkeyup = EVENTS.handleKeyUp;
        }
    };
}();