var SOUND = function () {
    const COPY_COUNT = 5;
    function playNext() {
        this.array[(this.next++)%COPY_COUNT].play();
    }
    var intro = document.getElementById('sound_intro'),
        gamePlay =  document.getElementById('sound_play'),
        missionComplete =  document.getElementById('sound_mission_complete'),
        gameOver =  document.getElementById('sound_game_over'),
        UFO =  document.getElementById('sound_UFO'),
        explosions =  [document.getElementById('sound_explosion')],
        launches =  [document.getElementById('sound_launch')];
    intro.volume = 0.3;
    gamePlay.volume = 0.3;
    UFO.volume = 0.5;
    for(let i = 1; i < COPY_COUNT; i++) {
        explosions[i] = explosions[0].cloneNode(true);
        launches[i] = launches[0].cloneNode(true);
    }
    return {
        intro: intro,
        gamePlay: gamePlay,
        missionComplete: missionComplete,
        gameOver: gameOver,
        UFO: UFO,
        explosion: {
            array: explosions,
            next: 0,
            play: playNext
        },
        launch: {
            array: launches,
            next: 0,
            play: playNext
        }
    }
}();