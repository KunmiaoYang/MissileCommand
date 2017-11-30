var ANIMATION = function () {
    var lastTime = 0;
    return {
        pause: true,
        start: function () {
            lastTime = 0;
            ANIMATION.pause = false;
            requestAnimationFrame(ANIMATION.animate);
        },
        animate: function(now) {
            if(ANIMATION.pause) return;
            let duration = now - lastTime;
            if (duration > 100) {
                lastTime = now;
                renderTriangles();
            }
            requestAnimationFrame(ANIMATION.animate);
        }
    }
}();