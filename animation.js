var ANIMATION = function () {
    var lastTime = 0;
    var callTime = 0;
    var node;
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
                if(!ANIMATION.stop) renderTriangles(SHADER.gl);
                renderInfo();
            }
            requestAnimationFrame(ANIMATION.animate);
        },
        delayPlay: function (timeRemain, media) {
            node = media;
            callTime = performance.now() + timeRemain;
            requestAnimationFrame(ANIMATION.sleep);
        },
        sleep: function (now) {
            if(now > callTime) node.play();
            else requestAnimationFrame(ANIMATION.sleep);
        }
    }
}();