var EVENTS = function () {
    const DELTA_TRANS = 0.0125; const DELTA_ROT = 0.02;
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
        },
        handleKeyUp: function (event) {
            currentlyPressedKeys[event.keyCode] = false;
        },
        handleClick: function(event) {
            GAME.launchDefenseMissile(event.offsetX/DOM.canvas.width, event.offsetY/DOM.canvas.height);
            GAME.rotateBatteries(event.offsetX/DOM.canvas.width, event.offsetY/DOM.canvas.height);
        },
        setupEvent: function() {
            document.onkeydown = EVENTS.handleKeyDown;
            document.onkeyup = EVENTS.handleKeyUp;
            $(DOM.canvas).on('click', EVENTS.handleClick);
        }
    };
}();