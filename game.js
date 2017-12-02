var GAME = function() {
    const WIDTH = 1.3, HEIGHT = 1.3,
        CANVAS_ORIGIN = [1.15, 1.15, 0];
    const CITY_SCALE = 0.003, CITY_COUNT = 6,
        BATTERY_SCALE = 0.05, BATTERY_COUNT = 3,
        MISSILE_SCALE = 0.01, UFO_SCALE = 0.02,
        DEFENSE_MISSILE_SPEED = 1.0, ATTACK_MISSILE_HEIGHT = 1.2,
        EXPLOSION_RANGE = 0.04, EXPLOSION_DURATION = 1500;
    const ZERO_THRESHOLD = 0.0001;
    function guidance(missile, target) {
        missile.target = target;
        missile.distance = 0;
        let direction = vec3.subtract(vec3.create(), target.xyz, missile.xyz);
        missile.targetDistance = vec3.length(direction);
        vec3.normalize(direction, direction);
        let axis = vec3.cross(vec3.create(), missile.direction, direction),
            sinRad = vec3.length(axis), cosRad = vec3.dot(missile.direction, direction);
        if(sinRad > ZERO_THRESHOLD) {
            let rad = cosRad > 0 ? Math.asin(sinRad) : Math.PI - Math.asin(sinRad);
            let rotMatrix = mat4.fromRotation(mat4.create(), Math.asin(sinRad), axis);
            missile.rMatrix = mat4.multiply(mat4.create(), rotMatrix, missile.rMatrix);
            missile.direction = direction;
        } else if(cosRad < 0) {
            // reverse direction
            let rotMatrix = mat4.fromRotation(mat4.create(), Math.PI, [0,0,1]);
            missile.rMatrix = mat4.multiply(mat4.create(), rotMatrix, missile.rMatrix);
            missile.direction = direction;
        }
    }
    function hitAir() {
        this.disable = true;

        // create explosion
        let expModel = MODELS.copyModel(GAME.model.explosion.prototype, mat4.create(),
            mat4.fromTranslation(mat4.create(), this.target.xyz));
        MODELS.array.push(expModel);
        airExplosions.push({
            xyz: this.target.xyz,
            timeRemain: EXPLOSION_DURATION,
            range: EXPLOSION_RANGE,
            model: expModel
        });
    }
    function hitTarget() {
        this.disable = true;

        // destroy target
        if((j = MODELS.array.indexOf(this.target)) > -1) MODELS.array.splice(j, 1);
        this.target.destroy();
    }
    function destroyCity() {
        if(this.disable) return;
        this.disable = true;
        city.count--;
    }
    function destroyBattery() {
        if(this.disable) return;
        this.disable = true;
        let i = GAME.model.batteries.indexOf(this), missiles = GAME.model.defenseMissiles[i];
        for(let j = 0, len = missiles.length, k; j < len; j++) {
            if ((k = MODELS.array.indexOf(missiles[j])) > -1) MODELS.array.splice(k, 1);
        }
        GAME.model.defenseMissiles[i] = [];
        battery.count--;
    }
    function createAirTarget(xyz) {
        return {
            xyz: xyz,
        }
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
        tMatrixArray: [],
        rMatrixArray: []
    };
    for(let i = 0; i < CITY_COUNT; i++) {
        let rMatrix = mat4.create();
        city.rMatrixArray.push(mat4.scale(rMatrix, rMatrix, [CITY_SCALE, CITY_SCALE, CITY_SCALE]));
        city.tMatrixArray.push(mat4.fromTranslation(mat4.create(), [city.pos[i], 0, 0]));
    }
    var battery = {
        count: BATTERY_COUNT,
        pos: [1, 0.5, 0],
        tMatrixArray: [],
        rMatrixArray: []
    };
    var defenseMissile = {
        material: MODELS.createMaterial(),
        xPos: [-0.015, 0, 0.015],
        zPos: [-0.015, 0, 0.015],
        xyz: [],
        tMatrixArray: [],
        rMatrixArray: []
    };
    var attackMissile = {
        material: MODELS.createMaterial(),
        rMatrix: mat4.scale(mat4.create(), idMatrix, [MISSILE_SCALE, -MISSILE_SCALE, MISSILE_SCALE]),
        splitMissile: function() {
            console.log("Split missile: " + this.xyz[1]);
            let count = Math.floor(Math.random()*GAME.level.splitLimit) + 1,
                targets = GAME.model.defenseTarget,
                curIndex = targets.indexOf(this.target),
                startIndex = Math.max(0, curIndex - Math.floor(Math.random()*(count + 1))),
                targetCount = BATTERY_COUNT + CITY_COUNT;
            for(let i = startIndex, j = 0; i < targetCount && j < count; i++) {
                if(i === curIndex) continue;
                let missile = attackMissile.create(vec3.clone(this.xyz));
                launch(missile, GAME.level.attackMissileSpeed, targets[i], hitTarget);
                j++;
            }
        },
        create: function(xyz) {
            let missile = MODELS.copyModel(GAME.model.missile.prototype,
                mat4.clone(attackMissile.rMatrix),
                mat4.fromTranslation(mat4.create(), xyz));
            missile.xyz = xyz;
            missile.direction = vec3.fromValues(0, -1, 0);
            missile.material = attackMissile.material;
            missile.split = attackMissile.splitMissile;
            missile.isDefense = false;
            MODELS.array.push(missile);
            return missile;
        }
    };
    defenseMissile.material.diffuse = [0,0,1];
    attackMissile.material.diffuse = [1,0,0];
    for(let i = 0; i < BATTERY_COUNT; i++) {
        battery.rMatrixArray.push(mat4.scale(mat4.create(), idMatrix, [BATTERY_SCALE, BATTERY_SCALE, BATTERY_SCALE]));
        battery.tMatrixArray.push(mat4.fromTranslation(mat4.create(), [battery.pos[i], 0, 0]));
        defenseMissile.xyz[i] = [];
        defenseMissile.rMatrixArray[i] = [];
        defenseMissile.tMatrixArray[i] = [];
        for(let j = 0; j < defenseMissile.xPos.length; j++) {
            for(let k = 0; k < defenseMissile.zPos.length; k++) {
                let xyz = vec3.fromValues(battery.pos[i] + defenseMissile.xPos[j], 0, defenseMissile.zPos[k]);
                defenseMissile.xyz[i].push(xyz);
                defenseMissile.rMatrixArray[i].push(mat4.scale(mat4.create(), idMatrix, [MISSILE_SCALE, MISSILE_SCALE, MISSILE_SCALE]));
                defenseMissile.tMatrixArray[i].push(mat4.fromTranslation(mat4.create(), xyz));
            }
        }
    }
    return {
        model: {},
        level: {},
        initMODELS() {
            MODELS.array = [];
            for(let i = 0, len = GAME.model.background.length; i < len; i++)
                MODELS.array.push(GAME.model.background[i]);
        },
        initGame: function () {
            GAME.level = {
                id: 1,
                attackMissileCount: 10,
                attackMissileSpeed: 0.1,
                duration: 15000,
                splitLimit: 3,
                splitProbability: 0.001,
                nextMissile: 0,
                time: 0,
                missileSchedule: []
            };
            city.count = CITY_COUNT;
            for(let i = 0; i < CITY_COUNT; i++) {
                GAME.model.cities[i].disable = false;
            }
        },
        initLevel: function () {
            // schedule missile
            GAME.level.missileSchedule = [];
            for(let i = 0; i < GAME.level.attackMissileCount; i++)
                GAME.level.missileSchedule.push(Math.floor(Math.random() * GAME.level.duration));
            GAME.level.missileSchedule.sort(function(n1, n2){return n1 - n2});
            GAME.level.nextMissile = 0;
            GAME.level.time = 0;
            launchedMissile = [];
        },
        initAttackMissile: function () {
            let missiles = [];
            for(let i = 0; i < GAME.level.attackMissileCount; i++) {
                missiles[i] = attackMissile.create([Math.random(), ATTACK_MISSILE_HEIGHT, 0]);
            }
            GAME.model.attackMissiles = missiles;
        },
        initDefenseMissile: function () {
            let missiles = [];
            for(let i = 0; i < BATTERY_COUNT; i++) {
                missiles[i] = [];
                for(let j = 0, len = defenseMissile.tMatrixArray[i].length; j < len; j++) {
                    missiles[i][j] = MODELS.copyModel(GAME.model.missile.prototype,
                        mat4.clone(defenseMissile.rMatrixArray[i][j]), mat4.clone(defenseMissile.tMatrixArray[i][j]));
                    missiles[i][j].xyz = vec3.clone(defenseMissile.xyz[i][j]);
                    missiles[i][j].direction = vec3.fromValues(0, 1, 0);
                    missiles[i][j].material = defenseMissile.material;
                    missiles[i][j].isDefense = true;
                    MODELS.array.push(missiles[i][j]);
                }
            }
            GAME.model.defenseMissiles = missiles;
        },
        initDefenseTarget: function () {
            GAME.model.defenseTarget = new Array(CITY_COUNT + BATTERY_COUNT);
            for(let i = 0; i < CITY_COUNT; i++) {
                GAME.model.cities[i].xyz = vec3.fromValues(city.pos[i], 0, 0);
                GAME.model.cities[i].destroy = destroyCity;
                GAME.model.defenseTarget[i] = GAME.model.cities[i];
                if(!GAME.model.cities[i].disable) MODELS.array.push(GAME.model.cities[i]);
            }
            battery.count = BATTERY_COUNT;
            for(let i = 0; i < BATTERY_COUNT; i++) {
                GAME.model.batteries[i].xyz = vec3.fromValues(battery.pos[i], 0, 0);
                GAME.model.batteries[i].destroy = destroyBattery;
                GAME.model.batteries[i].disable = false;
                GAME.model.defenseTarget[i + CITY_COUNT] = GAME.model.batteries[i];
                MODELS.array.push(GAME.model.batteries[i]);
            }
        },
        loadModels: function() {
            GAME.model.background = JSON_MODEL.loadTriangleSets(SHADER.gl);
            MODELS.array = MODELS.array.concat(GAME.model.background);
            GAME.model.explosion = {
                prototype: JSON_MODEL.loadEllipsoids(SHADER.gl)[0],
                airExplosions: airExplosions
            };
            SKECHUP_MODEL.loadModel(SHADER.gl, URL.cityModel, function (model) {
                model.material.diffuse = [0.2, 0.2, 0.8];
                GAME.model.cities = [];
                for(let i = 0; i < CITY_COUNT; i++) {
                    GAME.model.cities[i] = MODELS.copyModel(model, city.rMatrixArray[i], city.tMatrixArray[i]);
                }
            });
            SKECHUP_MODEL.loadModel(SHADER.gl, URL.batteryModel, function (model) {
                model.material.diffuse = [0.2, 0.2, 0.8];
                GAME.model.batteries = [];
                for(let i = 0; i < BATTERY_COUNT; i++) {
                    GAME.model.batteries[i] = MODELS.copyModel(model, battery.rMatrixArray[i], battery.tMatrixArray[i]);
                }
            });
            SKECHUP_MODEL.loadModel(SHADER.gl, URL.missileModel, function (model) {
                GAME.model.missile = {
                    prototype: model,
                    launchedMissile: launchedMissile
                };
            })
        },
        play: function () {
            GAME.initGame();
            GAME.initLevel();
            GAME.initMODELS();
            GAME.initDefenseTarget();
            GAME.initDefenseMissile();
            GAME.initAttackMissile();
            ANIMATION.start();
            // renderTriangles();
        },
        nextLevel: function () {
            ANIMATION.pause(5000);
            GAME.level.id++;
            GAME.level.attackMissileCount += 2;
            GAME.level.attackMissileSpeed += 0.02;
            console.log("New level: " + GAME.level.id);
            GAME.initLevel();
            GAME.initMODELS();
            GAME.initDefenseTarget();
            GAME.initDefenseMissile();
            GAME.initAttackMissile();
        },
        over: function () {
            ANIMATION.stop = true;
            renderTriangles();
        },
        launchDefenseMissile: function(ratioX, ratioY) {
            let xyz = vec3.fromValues(CANVAS_ORIGIN[0] - WIDTH * ratioX, CANVAS_ORIGIN[1] - HEIGHT * ratioY, 0),
                tar = createAirTarget(xyz),
                batteryIndex = -1,
                missiles = GAME.model.defenseMissiles;
            if(xyz[1] < 0) return;
            for(let i = 0, delta = WIDTH; i < BATTERY_COUNT; i++) {
                if(0 === missiles[i].length) continue;
                if(delta > Math.abs(battery.pos[i] - xyz[0])) {
                    batteryIndex = i;
                    delta = Math.abs(battery.pos[i] - xyz[0]);
                }
            }
            if(-1 === batteryIndex) return;
            let missile = missiles[batteryIndex].pop();
            launch(missile, DEFENSE_MISSILE_SPEED, tar, hitAir);
        },
        update: function(duration) {
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
                else if(!launchedMissile[i].isDefense && Math.random() < GAME.level.splitProbability) launchedMissile[i].split();
            }

            // update explosion
            for(let i = 0, iLen = airExplosions.length; i < iLen; i++) {
                for(let j = 0, jLen = launchedMissile.length; j < jLen; j++) {
                    if(launchedMissile[j].disable || launchedMissile[j].isDefense) continue;
                    let dis = vec3.distance(airExplosions[i].xyz, launchedMissile[j].xyz);
                    if(dis <= airExplosions[i].range) launchedMissile[j].disable = true;
                }
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
                console.log(level.time + ": " + level.nextMissile + ": speed: " + level.attackMissileSpeed);
                let tar = defenseTarget[Math.floor(Math.random()*defenseTarget.length)];
                launch(GAME.model.attackMissiles.pop(), level.attackMissileSpeed, tar, hitTarget);
            }

            // next level
            if(0 == launchedMissile.length && level.nextMissile >= level.attackMissileCount) GAME.nextLevel();

            // game over
            if(0 >= city.count) GAME.over();
        },
        test: function (i, j) {
            let missiles = GAME.model.defenseMissiles;
            let t = createAirTarget(vec3.fromValues(0.5, 0.5, 0));
            launch(missiles[i][j], DEFENSE_MISSILE_SPEED, t, hitAir);
        }
    }
}();