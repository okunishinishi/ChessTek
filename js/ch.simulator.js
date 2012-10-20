CH.simulator = (function(){
    var Simulator = (function(){
        return CH.define({
            init:function(color){
                var s = this;
                s.color = color;
            },
            property:{
                max:2,
                weight:100,
                minWeight:-100,
                isMyTurn:function(scenario){
                    var s = this;
                    return s.color === scenario.owner;
                },
                weightScenario:function(scenario){
                    scenario.start.weight = 20;
                },
                simulate:function(game){
                    var s = this;
                    var proceed = s.weightScenario(game);
                    if(!proceed) return;
                    if(game.phase > s.max) return;
                    if(game.isOver) return;
                    var choices = CH.scenario.getChoices(game);
                    for(var i=0; i<choices.length; i++){
//                        if(choices[i].weight < s.minWeight) continue;
                        var scenario = new CH.scenario.Scenario(game, choices[i]);
                        s.simulate(scenario);
                    }
                }
            }
        });
    })();

    var EnemyDamageStrategy = (function(){
        return CH.define({
            prototype:Simulator,
            property:{
                max:0,
                weightScenario:function(scenario){
                    var s = this;
                    if(s.isMyTurn(scenario)){
                        return false;
                    } else {
                        var killed = scenario.killed;
                        if(killed){
                            var value = killed.value;
                            if(killed.promotable && killed.promotable()){
                                value *= 3;
                            }
                            scenario.addWeight(value * s.weight);
                        }
                        return false;
                    }
                }
            }
        });
    })();
    var ApproachEnemyKingStrategy = (function(){
        function getDistance(point1, point2){
            return Math.abs(point1.row - point2.row)
                + Math.abs(point1.column - point2.column);
        }
        return CH.define({
            prototype:Simulator,
            property:{
                max:0,
                weightScenario:function(scenario){
                    var s = this;
                    if(s.isMyTurn(scenario)){
                        return false;
                    } else {
                        var pieces = scenario.findOwnerPieces();
                        for(var i=0; i<pieces.length; i++){
                            var piece = pieces[i];
                            if(piece instanceof CH.piece.King){
                                var distance = getDistance(piece.point, scenario.choice.point);
                                scenario.addWeight((15 - distance) * s.weight);
                                return false;
                            }
                        }

                    }
                    return false;
                }
            }
        });
    })();
    var OpenWayStrategy = (function(){
        return CH.define({
            prototype:Simulator,
            property:{
                max:0,
                weightScenario:function(scenario){
                    var s = this;
                    if(s.isMyTurn(scenario)){
                        return false;
                    } else {
                        scenario.swapOwner();
                        var weight = 0;
                        var pieces = scenario.findOwnerPieces();
                        for(var i=0; i<pieces.length; i++){
                            var piece = pieces[i];
                            var points = scenario.findMovablePoints(piece);
                            if(points.length){
                                weight += points.length;
                            } else {
                                weight -= 5;
                            }
                        }
                        scenario.swapOwner();
                        scenario.addWeight(weight * s.weight);
                        return false;
                    }
                }
            }
        });
    })();
    var FleeStrategy = (function(){
        return CH.define({
            prototype:Simulator,
            property:{
                max:0,
                weightScenario:function(scenario){
                    var s = this;
                    if(s.isMyTurn(scenario)){
                        return false;
                    } else {
                        var weight = 0;
                        var pieces = scenario.findEnemyPieces();
                        for(var i=0; i<pieces.length; i++){
                            var piece = pieces[i];
                            var attackers = scenario.findPiecesMovableToPoint(piece.point, true);
                            if(!attackers.length) continue;
                            weight -= piece.value * attackers.length;
                        }
                        scenario.addWeight(weight * s.weight);
                    }
                    return false;
                }
            }
        })
    })();
    var ProtectStrategy = (function(){
        return CH.define({
            prototype:Simulator,
            property:{
                max:0,
                weightScenario:function(scenario){
                    var s = this;
                    if(s.isMyTurn(scenario)){
                        return false;
                    } else {
                        var weight = 0;
                        scenario.swapOwner();
                        var pieces = scenario.findOwnerPieces();
                        for(var i=0; i<pieces.length; i++){
                            var piece = pieces[i];
                            if(piece instanceof CH.piece.King) continue;
                            var protectable = scenario.findPiecesProtectableToPoint(piece.point);
                            if(protectable.length){
                                weight += protectable.length;
                            }
                        }
                        scenario.swapOwner();
                        scenario.addWeight(weight * s.weight);
                        return false;
                    }
                }
            }
        });
    })();
    var AvoidSameChoiceStrategy = (function(){
        return CH.define({
            prototype:Simulator,
            property:{
                max:0,
                weightScenario:function(scenario){
                    var s = this;
                    if(s.isMyTurn(scenario)){
                        return false;
                    } else {
                        var record = scenario.record.choices,
                            i = record.length - 1,
                            last = record[i],
                            weight = 0;
                        while((i-=4) > 0){
                            if(record.length - i > 13) break;
                            if(last === record[i]){
                                weight -= 10;
                            } else {
                            }
                        }
                        scenario.addWeight(weight * s.weight);
                    }
                    return false;
                }
            }
        });
    })();

    var PromoteStrategy = (function(){
        return CH.define({
            prototype:Simulator,
            property:{
                max:0,
                weightScenario:function(scenario){
                    var s = this;
                    if(s.isMyTurn(scenario)){
                        return false;
                    } else {
                        var piece = scenario.start.piece;
                        if(piece instanceof CH.piece.Pawn){
                            var weight = 0;
                            var row = scenario.start.point.row;
                            var distance =
                                (piece.dir === CH.enum.Dir.TOP)?row : 7-row;
                            weight += (7 - distance) * piece.value;
                            if(distance < 3) weight *= 1.5;
                            scenario.addWeight(weight * s.weight);
                        }
                    }
                    return false;
                }
            }
        });
    })();

    var GuardOwnerKingStrategy = (function(){
        return CH.define({
            prototype:Simulator,
            property:{
                max:0,
                weightScenario:function(scenario){
                    var s = this;
                    if(s.isMyTurn(scenario)){
                        return false;
                    } else {
                        var weight = 0;
                        scenario.swapOwner();
                        var king = scenario.findOwnerKing();
                        if(!king || scenario.start.piece instanceof CH.piece.King){
                            scenario.swapOwner();
                            return false;
                        }
                        var kingPoint = king.point;
                        for(var row=kingPoint.row-2;row<=kingPoint.row+2;row++){
                            for(var column=kingPoint.column-2;column<=kingPoint.column+2;column++){
                                var point = new CH.Point(row, column);
                                if(point.equals(kingPoint)) continue;
                                var piece = scenario.findOwnerPiece(point);
                                if(piece) weight += 1;
                            }
                        }
                        scenario.swapOwner();
                        scenario.addWeight(weight * s.weight);
                    }
                    return false;
                }
            }
        });
    })();
    var MultiAttackableStrategy = (function(){
        return CH.define({
            prototype:Simulator,
            property:{
                max:0,
                weightScenario:function(scenario){
                    var s = this;
                    if(s.isMyTurn(scenario)){
                        return false;
                    } else {
                        var weight = 0;
                        scenario.swapOwner();
                        var pieces = scenario.findMovablePieces();
                        for(var i=0; i<pieces.length; i++){
                            var attackablePoints = scenario.findAttackablePoints(pieces[i]);
                            if(attackablePoints.length > 1){
                                weight += attackablePoints.length;
                            }
                        }

                        scenario.swapOwner();
                        scenario.addWeight(weight * s.weight);
                    }
                }
            }
        });
    })();
    var CheckStrategy = (function(){
        return CH.define({
            prototype:Simulator,
            property:{
                max:0,
                weightScenario:function(scenario){
                    var s = this;
                    if(s.isMyTurn(scenario)){
                        return false;
                    } else {
                        if(!scenario.isKingSafe()){
                            var weight = 1;
                            var king = scenario.findOwnerKing();
                            var points = scenario.findMovablePoints(king);

                            scenario.swapOwner();
                            for(var i=0; i<points.length; i++){
                                var isAttackable = scenario.findPiecesMovableToPoint(points[i], true).length > 0;
                                if(isAttackable) weight += 1;
                            }
                            scenario.swapOwner();
                            scenario.addWeight(weight * s.weight);
                        }
                    }
                }
            }
        });
    })();
    var simulator = {
        ProtectStrategy:ProtectStrategy,
        EnemyDamageStrategy:EnemyDamageStrategy,
        ApproachEnemyKingStrategy:ApproachEnemyKingStrategy,
        OpenWayStrategy:OpenWayStrategy,
        FleeStrategy:FleeStrategy,
        AvoidSameChoiceStrategy:AvoidSameChoiceStrategy,
        PromoteStrategy:PromoteStrategy,
        GuardOwnerKingStrategy:GuardOwnerKingStrategy,
        MultiAttackableStrategy:MultiAttackableStrategy,
        CheckStrategy:CheckStrategy
    };

    for(var key in simulator){
        if(simulator.hasOwnProperty(key)){
            var type = key.substr(0,1).toLowerCase() + key.substr(1);
            type = type.replace(/Strategy$/, "");
            simulator[key].prototype.type = type;
        }
    }
    return simulator
})();
