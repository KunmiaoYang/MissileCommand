var GAME = function() {
    const WIDTH = 1.3, HEIGHT = 1.3,
        CANVAS_ORIGIN = [1.15, 1.15, 0];
    const INTRO_STATUS = 0, PLAY_STATUS = 1, MISSION_COMPLETE_STATUS = 2,
        GAME_OVER_STATUS = 3, PAUSE_STATUS = 4, TEST_STATUS = -1;
    const CITY_SCALE = 0.0038, CITY_COUNT = 6, CITY_SCORE = 20,
        BATTERY_SCALE = 0.0025, BATTERY_COUNT = 3, BATTERY_SCORE = 10,
        TARGET_HEIGHT_BOTTOM = 0.05, TARGET_HEIGHT_RANGE = 0.15,
        TARGET_FLOAT_AMPLITUDE = 0.01, TARGET_FLOAT_PERIOD = 3000,
        MISSILE_SCALE = 0.015, MISSILE_SCORE = 1,
        UFO_SCALE = 0.02, UFO_OFFSET = 0.2, UFO_SCORE = 5,
        DEFENSE_MISSILE_SPEED = 1.5, ATTACK_MISSILE_HEIGHT = 1.2,
        EXPLOSION_RANGE = 0.08, DESTRUCT_EXPLOSION_RANGE = 0.04,
        EXPLOSION_DURATION = 2000;
    const ZERO_THRESHOLD = 0.0001;
    function calcXYZFromScreen(ratioX, ratioY) {
        return vec3.fromValues(CANVAS_ORIGIN[0] - WIDTH * ratioX, CANVAS_ORIGIN[1] - HEIGHT * ratioY, 0);
    }
    function calcRotationMatrix(oldDirection, newDirection) {
        vec3.normalize(oldDirection, oldDirection);
        vec3.normalize(newDirection, newDirection);
        let axis = vec3.cross(vec3.create(), oldDirection, newDirection),
            sinRad = vec3.length(axis), cosRad = vec3.dot(oldDirection, newDirection),
            rotMatrix = null;
        if(sinRad > ZERO_THRESHOLD) {
            let rad = cosRad > 0 ? Math.asin(sinRad) : Math.PI - Math.asin(sinRad);
            rotMatrix = mat4.fromRotation(mat4.create(), Math.asin(sinRad), axis);
        } else if(cosRad < 0) {
            // reverse direction
            rotMatrix = mat4.fromRotation(mat4.create(), Math.PI, [0,0,1]);
        }
        return rotMatrix;
    }
    function guidance(missile, target) {
        missile.target = target;
        missile.distance = 0;
        let direction = vec3.subtract(vec3.create(), target.xyz, missile.xyz);
        missile.targetDistance = vec3.length(direction);
        let rotMatrix = calcRotationMatrix(missile.direction, direction);
        if (rotMatrix) {
            missile.rMatrix = mat4.multiply(mat4.create(), rotMatrix, missile.rMatrix);
            missile.direction = direction;
        }
    }
    function hitAir() {
        this.disable = true;

        // create explosion
        createExplosion(this.target.xyz, EXPLOSION_RANGE, destroyObjectsInRange);
    }
    function hitTarget() {
        this.disable = true;

        // create explosion
        createExplosion(this.target.xyz, EXPLOSION_RANGE, destroyObjectsInRange);

        // destroy target
        if((j = MODELS.array.indexOf(this.target)) > -1) MODELS.array.splice(j, 1);
        this.target.destruct();
    }
    function destroyCity() {
        if(this.disable) return;
        this.disable = true;
        city.count--;
    }
    function destroyBattery() {
        if(this.disable) return;
        this.disable = true;
        let i = GAME.model.batteries.indexOf(this), missiles = GAME.model.defenseMissile.array[i];
        for(let j = 0, len = missiles.length, k; j < len; j++) {
            if ((k = MODELS.array.indexOf(missiles[j])) > -1) MODELS.array.splice(k, 1);
        }
        GAME.model.defenseMissile.array[i] = [];
        battery.count--;
    }
    function destroyObjectsInRange(objects) {
        for(let i = 0, len = objects.length; i < len; i++) {
            if(objects[i].disable || objects[i].isDefense) continue;
            let dis = vec3.distance(this.xyz, objects[i].xyz);
            if(dis <= this.range) {
                objects[i].destruct();
            }
        }
    }
    function createAirTarget(xyz) {
        return {
            xyz: xyz,
        }
    }
    function createExplosion(xyz, maxRange, destroy) {
        SOUND.explosion.play();
        let expModel = MODELS.copyModel(GAME.model.explosion.prototype,
            mat4.scale(mat4.create(), idMatrix,[ZERO_THRESHOLD, ZERO_THRESHOLD, ZERO_THRESHOLD]),
            mat4.fromTranslation(mat4.create(), xyz));
        MODELS.array.push(expModel);
        // TODO: add status determine whether this explosion destroy missile
        airExplosions.push({
            xyz: xyz,
            timeRemain: EXPLOSION_DURATION,
            maxRange: maxRange,
            range: ZERO_THRESHOLD,
            model: expModel,
            updateModel: function () {
                this.range = 2 * Math.sin(this.timeRemain / EXPLOSION_DURATION * Math.PI) * this.maxRange;
                if(this.range > this.maxRange) this.range = this.maxRange;
                this.model.rMatrix[0] = this.range;
                this.model.rMatrix[5] = this.range;
                this.model.rMatrix[10] = this.range;
            },
            destroyObjects: destroy
        });
    }
    function launch(missile, speed, target, hit) {
        guidance(missile, target);
        missile.speed = speed;
        missile.hit = hit;
        launchedMissile.push(missile);
    }

    var idMatrix = mat4.create();
    var launchedMissile = [], airExplosions = [];
    var city = {
        count: CITY_COUNT,
        pos: [0.875, 0.75, 0.625, 0.375, 0.25, 0.125],
        material: {
            ambient: [0,0,0], diffuse: [1.0, 1.0, 1.0], specular: [1.0, 1.0, 1.0], n:10, textureMode: 0
        },
        tMatrixArray: [],
        rMatrixArray: [],
        countScore: function () {
            for(let i = 0; i < CITY_COUNT; i++) if(!GAME.model.cities[i].disable) GAME.score += CITY_SCORE;
        }
    };
    var battery = {
        count: BATTERY_COUNT,
        pos: [1, 0.5, 0],
        material: {
            ambient: [0,0,0], diffuse: [0.1, 0.1, 0.1], specular: [1.0, 1.0, 1.0], n:10, textureMode: 0
        },
        tMatrixArray: [],
        rMatrixArray: [],
        scaleMatrix: mat4.scale(mat4.create(), idMatrix, [BATTERY_SCALE, BATTERY_SCALE, BATTERY_SCALE]),
        countScore: function () {
            for(let i = 0; i < BATTERY_COUNT; i++) if(!GAME.model.batteries[i].disable) GAME.score += BATTERY_SCORE;
        },
        getNearestIndex: function (x) {
            let batteryIndex = -1,
                missiles = GAME.model.defenseMissile.array;
            for(let i = 0, delta = WIDTH; i < BATTERY_COUNT; i++) {
                if(0 === missiles[i].length) continue;
                let curDelta = Math.abs(battery.pos[i] - x);
                if(delta > curDelta) {
                    batteryIndex = i;
                    delta = curDelta;
                }
            }
            return batteryIndex;
        }
    };
    var defenseMissile = {
        material: {
            ambient: [0,0,0], diffuse: [1.0, 1.0, 1.0], specular: [1.0, 1.0, 1.0], n:10, textureMode: 0
        },
        xPos: [-0.015, 0, 0.015],
        zPos: [0.015, 0, -0.015],
        xyz: [],
        tMatrixArray: [],
        rMatrixArray: []
    };
    var attackMissile = {
        material: {
            ambient: [0,0,0], diffuse: [1.0, 0.0, 0.0], specular: [1.0, 1.0, 1.0], n:10, textureMode: 0
        },
        rMatrix: mat4.scale(mat4.create(), idMatrix, [MISSILE_SCALE, -MISSILE_SCALE, MISSILE_SCALE]),
        splitMissile: function() {
            if(PLAY_STATUS === GAME.status) {
                console.log("Split missile: " + this.xyz[1]);
                let count = Math.floor(Math.random() * GAME.level.splitLimit) + 1,
                    targets = GAME.model.defenseTarget,
                    curIndex = targets.indexOf(this.target),
                    startIndex = Math.max(0, curIndex - Math.floor(Math.random() * (count + 1))),
                    targetCount = BATTERY_COUNT + CITY_COUNT;
                for (let i = startIndex, j = 0; i < targetCount && j < count; i++) {
                    if (i === curIndex) continue;
                    let missile = attackMissile.create(vec3.clone(this.xyz));
                    launch(missile, GAME.level.attackMissileSpeed, targets[i], hitTarget);
                    j++;
                }
            }
        },
        destruct: function () {
            GAME.score += MISSILE_SCORE;
            this.disable = true;
            // create explosion
            createExplosion(this.xyz, DESTRUCT_EXPLOSION_RANGE, destroyObjectsInRange);
        },
        create: function(xyz) {
            let missile = MODELS.copyModel(GAME.model.attackMissile.prototype,
                mat4.clone(attackMissile.rMatrix),
                mat4.fromTranslation(mat4.create(), xyz));
            missile.xyz = xyz;
            missile.direction = vec3.fromValues(0, -1, 0);
            missile.material = attackMissile.material;
            missile.split = attackMissile.splitMissile;
            missile.isDefense = false;
            missile.isMissile = true;
            missile.destruct = attackMissile.destruct;
            MODELS.array.push(missile);
            return missile;
        }
    };
    var UFO = {
        material: {
            ambient: [0,0,0], diffuse: [1.0, 0.0, 0.0], specular: [1.0, 1.0, 1.0], n:10, textureMode: 0
        },
        rMatrix: mat4.scale(mat4.create(), idMatrix, [UFO_SCALE, UFO_SCALE, UFO_SCALE]),
        disappear: function () {
            this.disable = true;
            GAME.model.UFO.models.splice(GAME.model.UFO.models.indexOf(this), 1);
        },
        destruct: function () {
            GAME.score += UFO_SCORE;
            this.disable = true;
            GAME.model.UFO.models.splice(GAME.model.UFO.models.indexOf(this), 1);
            SOUND.UFO.pause();
            // create explosion
            createExplosion(this.xyz, DESTRUCT_EXPLOSION_RANGE, destroyObjectsInRange);
        },
        create: function(xyz) {
            let spaceship = MODELS.copyModel(GAME.model.UFO.prototype,
                mat4.clone(UFO.rMatrix),
                mat4.fromTranslation(mat4.create(), xyz));
            spaceship.xyz = xyz;
            spaceship.direction = vec3.fromValues(xyz[0] < 0.5 ? 1 : -1, 0, 0);
            spaceship.material = UFO.material;
            spaceship.split = attackMissile.splitMissile;
            spaceship.isDefense = false;
            spaceship.destruct = UFO.destruct;
            MODELS.array.push(spaceship);
            return spaceship;
        }
    };
    for(let i = 0; i < CITY_COUNT; i++) {
        // Init cities
        city.rMatrixArray.push(mat4.scale(mat4.create(), idMatrix, [CITY_SCALE, CITY_SCALE, CITY_SCALE]));
        city.tMatrixArray.push(mat4.fromTranslation(mat4.create(), [city.pos[i], 0, 0]));
    }
    for(let i = 0; i < BATTERY_COUNT; i++) {
        // Init batteries
        battery.rMatrixArray.push(mat4.scale(mat4.create(), idMatrix, [BATTERY_SCALE, BATTERY_SCALE, BATTERY_SCALE]));
        battery.tMatrixArray.push(mat4.fromTranslation(mat4.create(), [battery.pos[i], 0, 0]));

        // Init defense missiles
        let relativeScale = MISSILE_SCALE/BATTERY_SCALE;
        defenseMissile.xyz[i] = [];
        defenseMissile.rMatrixArray[i] = [];
        defenseMissile.tMatrixArray[i] = [];
        for(let j = 0; j < defenseMissile.xPos.length; j++) {
            for(let k = 0; k < defenseMissile.zPos.length; k++) {
                let xyz = vec3.fromValues(battery.pos[i] + defenseMissile.xPos[j], 0, defenseMissile.zPos[k]);
                defenseMissile.xyz[i].push(xyz);
                defenseMissile.rMatrixArray[i].push(mat4.scale(mat4.create(), idMatrix, [relativeScale, relativeScale, relativeScale]));
                defenseMissile.tMatrixArray[i].push(mat4.fromTranslation(mat4.create(), [defenseMissile.xPos[j]/BATTERY_SCALE, 0, defenseMissile.zPos[k]/BATTERY_SCALE]));
            }
        }
    }

    return {
        status: INTRO_STATUS,
        model: {},
        level: {},
        score: 0,
        initMODELS() {
            MODELS.array = [];
            for(let i = 0, len = GAME.model.background.length; i < len; i++)
                MODELS.array.push(GAME.model.background[i]);
        },
        initGame: function () {
            GAME.score = 0;
            GAME.level = {
                id: 1,
                duration: 15000,
                time: 0,

                attackMissileCount: 10,
                attackMissileSpeed: 0.1,
                nextMissile: 0,
                missileSchedule: [],

                spaceshipCount: 1,
                spaceshipSpeed: 0.1,
                nextSpaceship: 0,
                spaceshipSchedule: [],

                splitLimit: 3,
                splitProbability: 0.0005
            };
            city.count = CITY_COUNT;
            for(let i = 0; i < CITY_COUNT; i++) {
                GAME.model.cities[i].disable = false;
            }
        },
        initLevel: function () {
            let level = GAME.level;
            GAME.level.time = 0;

            // schedule missile
            GAME.level.missileSchedule = [];
            for(let i = 0; i < GAME.level.attackMissileCount; i++)
                GAME.level.missileSchedule.push(Math.floor(Math.random() * GAME.level.duration));
            GAME.level.missileSchedule.sort(function(n1, n2){return n1 - n2});
            GAME.level.nextMissile = 0;
            launchedMissile = [];

            // schedule spaceship
            let lastMissileTime = level.missileSchedule[level.attackMissileCount - 1];
            level.spaceshipSchedule = [];
            for(let i = 0; i < level.spaceshipCount; i++)
                level.spaceshipSchedule.push(Math.floor(Math.random() * lastMissileTime));
            level.spaceshipSchedule.sort(function(n1, n2){return n1 - n2});
            level.nextSpaceship = 0;
        },
        initAttackMissile: function () {
            let missiles = [];
            for(let i = 0; i < GAME.level.attackMissileCount; i++) {
                missiles[i] = attackMissile.create([Math.random(), ATTACK_MISSILE_HEIGHT, 0]);
            }
            GAME.model.attackMissile.array = missiles;
            GAME.model.UFO.models = [];
        },
        initDefenseMissile: function () {
            let missiles = [];
            for(let i = 0; i < BATTERY_COUNT; i++) {
                missiles[i] = [];
                for(let j = 0, len = defenseMissile.tMatrixArray[i].length; j < len; j++) {
                    let tMatrix = mat4.clone(defenseMissile.tMatrixArray[i][j]);
                    // tMatrix[13] = GAME.model.batteries[i].xyz[1];
                    let missile = MODELS.copyModel(GAME.model.defenseMissile.prototype,
                        mat4.clone(defenseMissile.rMatrixArray[i][j]), tMatrix);
                    missile.rootModel = GAME.model.batteries[i];
                    missile.xyz = vec3.clone(defenseMissile.xyz[i][j]);
                    missile.xyz[1] = GAME.model.batteries[i].xyz[1];
                    missile.direction = vec3.fromValues(0, 1, 0);
                    missile.material = defenseMissile.material;
                    missile.isDefense = true;
                    missile.isMissile = true;
                    MODELS.array.push(missile);
                    missiles[i][j] = missile;
                }
            }
            GAME.model.defenseMissile.array = missiles;
        },
        initDefenseTarget: function () {
            GAME.model.defenseTarget = new Array(CITY_COUNT + BATTERY_COUNT);
            // Init cities
            for(let i = 0; i < CITY_COUNT; i++) {
                let targetModel =  GAME.model.cities[i],
                    height = Math.random() * TARGET_HEIGHT_RANGE + TARGET_HEIGHT_BOTTOM,
                    rotMatrix = mat4.fromRotation(mat4.create(), Math.random()*2*Math.PI, [0,1,0]);
                targetModel.phase = Math.random()*2*Math.PI;
                targetModel.rMatrix = mat4.multiply(mat4.create(), rotMatrix, city.rMatrixArray[i]);
                targetModel.tMatrix[13] = height;
                targetModel.xyz = vec3.fromValues(city.pos[i], height, 0);
                targetModel.destruct = destroyCity;
                GAME.model.defenseTarget[i] = targetModel;
                if(!targetModel.disable) MODELS.array.push(targetModel);
            }

            // initialize batteries
            battery.count = BATTERY_COUNT;
            for(let i = 0; i < BATTERY_COUNT; i++) {
                // Init battery models
                let targetModel =  GAME.model.batteries[i],
                    height = Math.random() * TARGET_HEIGHT_RANGE + TARGET_HEIGHT_BOTTOM;
                targetModel.phase = Math.random()*2*Math.PI;
                targetModel.tMatrix[13] = height;
                targetModel.xyz = vec3.fromValues(battery.pos[i], height, 0);
                targetModel.destruct = destroyBattery;
                targetModel.disable = false;
                GAME.model.defenseTarget[i + CITY_COUNT] = targetModel;
                MODELS.array.push(targetModel);
            }
        },
        loadModels: function() {
            var background = JSON_MODEL.loadTriangleSets(SHADER.gl);
            GAME.model.background = background;
            MODELS.array = MODELS.array.concat(background);

            GAME.model.explosion = {
                prototype: JSON_MODEL.loadEllipsoids(SHADER.gl)[0],
                airExplosions: airExplosions
            };
            SKECHUP_MODEL.loadModel(SHADER.gl, URL.cityModel, function (model) {
                model.material = city.material;
                GAME.model.cities = [];
                for(let i = 0; i < CITY_COUNT; i++) {
                    GAME.model.cities[i] = MODELS.copyModel(model, city.rMatrixArray[i], city.tMatrixArray[i]);
                }
            });
            SKECHUP_MODEL.loadModel(SHADER.gl, URL.batteryModel, function (model) {
                model.material = battery.material;
                GAME.model.batteries = [];
                for(let i = 0; i < BATTERY_COUNT; i++) {
                    GAME.model.batteries[i] = MODELS.copyModel(model, battery.rMatrixArray[i], battery.tMatrixArray[i]);
                }
            });
            SKECHUP_MODEL.loadModel(SHADER.gl, URL.attackMissileModel, function (model) {
                GAME.model.attackMissile = {
                    prototype: model,
                    launchedMissile: launchedMissile
                };
            });
            SKECHUP_MODEL.loadModel(SHADER.gl, URL.defenseMissileModel, function (model) {
                GAME.model.defenseMissile = {
                    prototype: model,
                };
            });
            SKECHUP_MODEL.loadModel(SHADER.gl, URL.UFOModel, function (model) {
                GAME.model.UFO = {
                    prototype: model,
                    models: []
                };
            });
        },

        launchDefenseMissile: function(ratioX, ratioY) {
            if(GAME.status !== PLAY_STATUS && GAME.status !== TEST_STATUS) return;
            let xyz = calcXYZFromScreen(ratioX, ratioY);
            if(xyz[1] < 0) return;
            let batteryIndex = battery.getNearestIndex(xyz[0]);
            if(-1 === batteryIndex) return;
            let missiles = GAME.model.defenseMissile.array,
                tar = createAirTarget(xyz);
            let missile = missiles[batteryIndex].pop();
            missile.rootModel = null;
            missile.rMatrix = mat4.scale(mat4.create(), idMatrix, [MISSILE_SCALE, MISSILE_SCALE, MISSILE_SCALE]);
            missile.tMatrix = mat4.fromTranslation(mat4.create(), missile.xyz);
            launch(missile, DEFENSE_MISSILE_SPEED, tar, hitAir);
            SOUND.launch.play();
        },
        rotateBatteries: function (ratioX, ratioY) {
            if(GAME.status !== PLAY_STATUS && GAME.status !== TEST_STATUS) return;
            let xyz = calcXYZFromScreen(ratioX, ratioY), oldDirection = vec3.fromValues(0,1,0),
                batteryIndex = battery.getNearestIndex(xyz[0]);
            if(-1 === batteryIndex) return;
            let curBattery = GAME.model.batteries[batteryIndex],
                direction = vec3.subtract(vec3.create(), xyz, curBattery.xyz),
                rotMatrix = calcRotationMatrix(oldDirection, direction);
            if (rotMatrix) {
                curBattery.rMatrix = mat4.multiply(mat4.create(), battery.scaleMatrix, rotMatrix);
            }
        },

        pause: function () {
            if(PLAY_STATUS === GAME.status) {
                GAME.status = PAUSE_STATUS;
                ANIMATION.pause();
                DOM.pauseButton.attr('class', 'pause').attr('onclick', "GAME.continue()");
            }
        },
        continue: function () {
            if(PAUSE_STATUS === GAME.status) {
                GAME.status = PLAY_STATUS;
                ANIMATION.start();
                DOM.pauseButton.attr('class', 'play').attr('onclick', "GAME.pause()");
            }
        },
        play: function () {
            GAME.status = PLAY_STATUS;
            GAME.initGame();
            GAME.initLevel();
            GAME.initMODELS();
            GAME.initDefenseTarget();
            GAME.initDefenseMissile();
            GAME.initAttackMissile();
            SOUND.intro.pause();
            SOUND.gamePlay.load();
            SOUND.gamePlay.play();
            ANIMATION.start();
            DOM.playButton.hide("fade");
            DOM.title.hide("fade");
        },
        endLevel: function () {
            GAME.status = MISSION_COMPLETE_STATUS;
            // ANIMATION.stop = true;
            SOUND.gamePlay.pause();
            SOUND.missionComplete.load();
            SOUND.missionComplete.play();
            city.countScore();
            battery.countScore();
            DOM.playButton.show("fade").attr('class', 'next').attr('onclick',"GAME.nextLevel()");
        },
        nextLevel: function () {
            GAME.status = PLAY_STATUS;
            GAME.level.id++;
            GAME.level.splitProbability += 0.0002;
            GAME.level.spaceshipCount = Math.floor(GAME.level.id / 2) + 1;
            GAME.level.attackMissileSpeed += 0.02;
            GAME.level.spaceshipSpeed += 0.02;
            GAME.level.attackMissileCount += 1;
            console.log(launchedMissile);
            console.log(GAME.model.UFO.models);
            console.log("Level: " + GAME.level.id);
            GAME.initLevel();
            GAME.initMODELS();
            GAME.initDefenseTarget();
            GAME.initDefenseMissile();
            GAME.initAttackMissile();
            SOUND.missionComplete.pause();
            SOUND.gamePlay.load();
            SOUND.gamePlay.play();
            ANIMATION.start();
            DOM.playButton.hide("fade");
        },
        over: function () {
            GAME.status = GAME_OVER_STATUS;
            DOM.title.show("fade").attr('class', 'over');
            // ANIMATION.stop = true;
            SOUND.UFO.pause();
            SOUND.missionComplete.pause();
            SOUND.gamePlay.pause();
            SOUND.gameOver.play();
            SOUND.gamePlay.load();
            ANIMATION.delayRun(5000, function () {
                SOUND.intro.play();
                DOM.playButton.show("fade").attr('class', 'play').attr('onclick',"GAME.play()");
                DOM.title.attr('class', 'intro');
                GAME.status = INTRO_STATUS;
            });
            RASTERIZE.renderTriangles(SHADER.gl);
        },
        update: function(duration, now) {
            let seconds = duration/1000, level = GAME.level;
            GAME.level.time += duration;

            // update missile
            for(let i = 0, len = launchedMissile.length; i < len; i++) {
                let distance = launchedMissile[i].speed * seconds;
                launchedMissile[i].tMatrix[12] += distance * launchedMissile[i].direction[0];
                launchedMissile[i].tMatrix[13] += distance * launchedMissile[i].direction[1];
                launchedMissile[i].tMatrix[14] += distance * launchedMissile[i].direction[2];
                launchedMissile[i].distance += distance;
                launchedMissile[i].xyz[0] = launchedMissile[i].tMatrix[12];
                launchedMissile[i].xyz[1] = launchedMissile[i].tMatrix[13];
                launchedMissile[i].xyz[2] = launchedMissile[i].tMatrix[14];

                if(launchedMissile[i].distance > launchedMissile[i].targetDistance) launchedMissile[i].hit();
                else if(!launchedMissile[i].isDefense && Math.random() < GAME.level.splitProbability
                    && launchedMissile[i].xyz[1] > 0.3 && launchedMissile[i].xyz[1] < 0.9)
                    launchedMissile[i].split();
            }

            // update explosion
            for(let i = 0, iLen = airExplosions.length; i < iLen; i++) {
                airExplosions[i].updateModel();
                airExplosions[i].destroyObjects(launchedMissile);
                airExplosions[i].timeRemain -= duration;
            }

            // remove disabled missiles
            for(let i = 0, j; i < launchedMissile.length; ) {
                if(launchedMissile[i].disable) {
                    if((j = MODELS.array.indexOf(launchedMissile[i])) > -1) MODELS.array.splice(j, 1);
                    launchedMissile.splice(i, 1);
                } else i++;
            }

            // remove disabled explosions
            for(let i = 0; i < airExplosions.length; ) {
                if(airExplosions[i].timeRemain <= 0) {
                    explosion = airExplosions.splice(i, 1)[0];
                    if((j = MODELS.array.indexOf(explosion.model)) > -1) MODELS.array.splice(j, 1);
                } else i++;
            }

            // launch attack missiles
            for(let len = level.attackMissileCount, defenseTarget = GAME.model.defenseTarget;
                level.nextMissile < len && level.missileSchedule[level.nextMissile] < level.time; level.nextMissile++) {
                let tar = defenseTarget[Math.floor(Math.random()*defenseTarget.length)];
                launch(GAME.model.attackMissile.array.pop(), level.attackMissileSpeed, tar, hitTarget);
            }

            // launch space ship
            for(; level.nextSpaceship < level.spaceshipCount && level.spaceshipSchedule[level.nextSpaceship] < level.time; level.nextSpaceship++) {
                let xyz = [Math.random() < 0.5 ? -UFO_OFFSET : 1 + UFO_OFFSET, Math.random()*0.5 + 0.5, 0],
                    spaceship = UFO.create(xyz),
                    tar = createAirTarget([1.0 - xyz[0], xyz[1], 0]);
                GAME.model.UFO.models.push(spaceship);
                launch(spaceship, level.spaceshipSpeed, tar, UFO.disappear);
                SOUND.UFO.play();
            }

            // update target height
            for(let i = 0; i < CITY_COUNT; i++) {
                let curCity = GAME.model.cities[i];
                curCity.tMatrix[13] = curCity.xyz[1] + Math.sin(now * 2 * Math.PI / TARGET_FLOAT_PERIOD + curCity.phase) * TARGET_FLOAT_AMPLITUDE;
            }
            for(let i = 0; i < BATTERY_COUNT; i++) {
                let curBattery = GAME.model.batteries[i];
                if(curBattery.disable) continue;
                let offset = Math.sin(now * 2 * Math.PI / TARGET_FLOAT_PERIOD + curBattery.phase) * TARGET_FLOAT_AMPLITUDE;
                curBattery.tMatrix[13] = curBattery.xyz[1] + offset;
            }

            if(GAME.status !== PLAY_STATUS) return;
            else if(0 >= city.count) GAME.over();    // game over
            else if(level.nextMissile >= level.attackMissileCount) {    // next level
                let isEnd = true;
                for(let i = 0, len = launchedMissile.length; i < len; i++) {
                    if (launchedMissile[i].isMissile) {
                        isEnd = false;
                        break;
                    }
                }
                if(isEnd) GAME.endLevel();
            }

        },
        main: function () {
            DOM.load(OPTION, CAMERA, URL);   // load the data from html page
            LIGHTS.load(); // load in the lights
            SHADER.setupWebGL(); // set up the webGL environment
            CAMERA.initCamera(); // Initialize camera
            GAME.loadModels();
            EVENTS.setupEvent();
            RASTERIZE.setupOnLoad();
        },
        test: function () {
            DOM.playButton.hide("fade");
            DOM.title.hide("fade");
            GAME.status = TEST_STATUS;
            GAME.initGame();
            GAME.initLevel();
            GAME.initMODELS();
            GAME.initDefenseTarget();
            GAME.initDefenseMissile();
            SOUND.intro.pause();
            SOUND.gamePlay.load();
            SOUND.gamePlay.play();
            ANIMATION.start();
            let missiles = GAME.model.defenseMissile.array, missile = missiles[0][0];
            let battery = GAME.model.batteries[0];
            let t = createAirTarget(vec3.fromValues(0.5, 0.5, 0));
            let level = GAME.level;
            level.nextMissile = level.attackMissileCount;
            level.nextSpaceship = level.spaceshipCount;

            // Test

            RASTERIZE.renderTriangles(SHADER.gl);
            // launch(missiles[i][j], DEFENSE_MISSILE_SPEED, t, hitAir);
        }
    }
}();