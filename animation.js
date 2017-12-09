var ANIMATION = function () {
    var lastTime = 0;
    var callTime = 0;
    var callback;
    return {
        stop: true,
        timeStart: 0,
        start: function () {
            lastTime = performance.now();
            ANIMATION.stop = false;
            requestAnimationFrame(ANIMATION.animate);
        },
        animate: function(now) {
            if(ANIMATION.stop) return;
            let duration = now - lastTime;
            if (duration > 20) {
                lastTime = now;
                GAME.update(duration, now);
                if(!ANIMATION.stop) RASTERIZE.renderTriangles(SHADER.gl);
                RASTERIZE.renderInfo();
            }
            requestAnimationFrame(ANIMATION.animate);
        },
        delayRun: function (timeRemain, fun) {
            callback = fun;
            callTime = performance.now() + timeRemain;
            requestAnimationFrame(ANIMATION.sleep);
        },
        sleep: function (now) {
            if(now > callTime) callback();
            else requestAnimationFrame(ANIMATION.sleep);
        }
    }
}();