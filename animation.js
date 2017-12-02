var ANIMATION = function () {
    var lastTime = 0;
    var restartTime = 0;
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
                GAME.update(duration);
                if(!ANIMATION.stop) renderTriangles();
            }
            requestAnimationFrame(ANIMATION.animate);
        },
        pause: function (timeRemain) {
            ANIMATION.stop = true;
            restartTime = performance.now() + timeRemain;
            requestAnimationFrame(ANIMATION.sleep);
        },
        sleep: function (now) {
            if(now > restartTime) ANIMATION.start();
            else requestAnimationFrame(ANIMATION.sleep);
        }
    }
}();