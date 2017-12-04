var DOM = function() {
    return {
        canvas: document.getElementById("myWebGLCanvas"),
        load: function(option, camera, url) {
            var canvas = document.getElementById("myWebGLCanvas"); // create a js canvas
            option.useLight = document.getElementById("UseLight").checked;
            // url.lights = document.getElementById("LightsURL").value;
            canvas.width = parseInt(document.getElementById("Width").value);
            canvas.height = parseInt(document.getElementById("Height").value);
            camera.left = parseFloat(document.getElementById("WLeft").value);
            camera.right = parseFloat(document.getElementById("WRight").value);
            camera.top = parseFloat(document.getElementById("WTop").value);
            camera.bottom = parseFloat(document.getElementById("WBottom").value);
            camera.near = parseFloat(document.getElementById("WNear").value);
            camera.far = parseFloat(document.getElementById("WFar").value);
        }
    };
}();