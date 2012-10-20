CH.ai = (function(){
    var Timer = CH.define({
        init:function(duration){
            var s = this;
            s.limit = new Date().getMilliseconds() + duration;
        },
        property:{
            isOver:function(){
                var s = this;
                return new Date().getMilliseconds() > s.limit;
            }
        }
    });
    var Preference = CH.define({
        init:function(data){
            var s = this;
            for(var key in data){
                if(data.hasOwnProperty(key)){
                    s[key] = data[key];
                }
            }
        },
        property:{
            clone:function(){
                var s = this, clone = new Preference();
                for(var key in s){
                    if(!s.hasOwnProperty(key)) continue;
                    clone[key] = s.key;
                }
            }
        }
    });

    var getDefaultPreference = function(){
         return {
                pieceValue:new Preference({
                    king:1000000,
                    queen:200,
                    knight:40,
                    rook:50,
                    bishop:40,
                    pawn:10
                }),
                strategyWeight:new Preference({
                enemyDamage:810,
                approachEnemyKing:330,
                openWay:140,
                flee:490,
                avoidSameChoice:490,
                protect:480,
                promote:40,
                guardOwnerKing:100,
                multiAttackable:310,
                check:200
            })
        };
    };

    function toLowerInitial(str){
        return str.substr(0, 1).toLowerCase() + str.substr(1);
    }

    CH.game.Game.prototype.loadPreference = function(preference){
        var s = this;
        for(var color in s.troop){
            if(s.troop.hasOwnProperty(color)){
                s.troop[color].reflectPieceValues(preference.pieceValue);
            }
        }
    };
    CH.troop.Troop.prototype.reflectPieceValues = function(preference){
        var s = this;
        for(var i=0; i< s.pieces.length; i++){
            var piece = s.pieces[i];
            piece.value = preference[piece.type];
        }
    };

    var AI = CH.define({
        init:function(game, color, preference){
            var s = this;
            s.prefrence = preference || getDefaultPreference();

            s.strategies = (function(color, weight){
                var strategies = [];
                for(var key in CH.simulator){
                    if(!CH.simulator.hasOwnProperty(key)) continue;
                    var strategy = new CH.simulator[key](color);
                    var preferKey = toLowerInitial(key).replace(/Strategy$/, "");
                    strategy.weight = weight[preferKey] || 0;
                    strategies.push(strategy);

                    if(preferKey === 'enemyDamage'){
                        s.enemyDamageStrategy = strategy;
                    }
                }
                return strategies;
            })(s.color, s.prefrence.strategyWeight);
            s.strategies.sort(function(a, b){return b.weight - a.weight});
            if(color) s.color = color;
            if(game) s.setGame(game);
        },
        property:{
            debug:false,
            level:1,
            color:CH.enum.Color.BLACK,
            move:function(piece, point){
                var s = this;
                s.game.movePiece(piece, point);
            },
            setGame:function(game){
                var s = this;
                s.game = game;
                var turn = s.game.turn;
                s.game.turn = function(){
                    turn.apply(this, arguments);
                    if(s.game.owner === s.color){
                        s.think();
                    }
                };
                var promotePiece = s.game.promotePiece;
                s.game.promotePiece  = function(){
                    var piece = promotePiece.apply(this, arguments);
                    piece.value = s.prefrence.pieceValue[piece.type];
                    return piece;
                };
                var color = s.color.toString();
                s.game.askPromotion[color] = function(){
                    var hasQueen = s.game.troop[s.game.owner].findPieceByType('queen').length > 0;
                    if(!hasQueen){
                        if(Math.random() > Math.random() * 1.5){
                            return 'knight';
                        }
                    }
                    return 'queen';
                };
                s.game.loadPreference(s.prefrence);
            },
            beAggressive:function(rate){
                var s = this;
//                console.log('beAggressive', rate);
                s.enemyDamageStrategy.weight *= rate;
            },
            beNoncommittal:function(){
                var s = this;
                s.noncommittal = true;
            },
            think:function(){
                var s = this;
                if(s.game.isOver) return;
                switch(s.game.phase){
                    case 100:
                    case 101:
                        s.beAggressive(1.2);
                        break;
                    case 300:
                    case 301:
                        s.beAggressive(2);
                        break;
                    case 500:
                    case 501:
                    case 600:
                    case 601:
                        s.beAggressive(5);
                        s.beNoncommittal();
                        break;
                }


                var choices = CH.scenario.getChoices(s.game);

                for(var i=0; i < choices.length; i++){
                    var scenario = new CH.scenario.Scenario(s.game, choices[i]),
                        timer = new Timer(100);
                    scenario.phase = 0;
                    for(var j=0; j<s.strategies.length  ; j++){
                        if(timer.isOver()) {
                            console.log('timer.isOver', timer.isOver());
                            break;
                        }

                        var oldWeight = choices[i].weight;//FIXME

                        s.strategies[j].simulate(scenario);

                        if(!choices[i].weightRecord) choices[i].weightRecord = {};
                        choices[i].weightRecord[s.strategies[j].type] = choices[i].weight - oldWeight;

                    }
                }

                if(s.debug){
                    choices.sort(function(a, b){return b.weight - a.weight});
                    for(var k=0; k<3; k++){
                        var choice2 = choices[k];
                        if(choice2) console.log('candidate:', choice2.weight, choice2.point.toString(), choice2.piece.type, choice2.weightRecord);
                    }
                }

                var choice = choices.isEmpty()?CH.scenario.getChoices(s.game).getRandom(): s.selectChoice(choices);

                if(!choice) return;
                if(s.debug) console.log('selected:', choice.weight, choice.point.toString(), choice.piece.type);

                setTimeout(function(){
                    s.move.call(s, choice.piece, choice.point);
                }, 200);
            },
            selectChoice:function(choices){
                var s = this;
                if(s.noncommittal){
                    s.noncommittal = false;
                    return choices.getRandom();
                }

                if(choices.length === 1) return choices[0];
                choices.sort(function(a, b){return b.weight - a.weight});
                var top = choices[0];
                var candidate = [top];
                for(var i=1; i<choices.length; i++){
                    if(i > 3) break;
                    var choice = choices[i];
                    if(top.weight - choice.weight < top.weight / 100){
                        candidate.push(choice);
                    }
                }
                return candidate.getRandom();
            }

        }
    });




    return {
        Preference:Preference,
        AI:AI,
        getDefaultPreference:getDefaultPreference
    }
})();