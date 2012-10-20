CH.scenario = (function(){
    var Choice = CH.game.Choice;
    var Scenario = CH.define({
        prototype:CH.game.Game,
        init:function(game, choice){
            var s = this;
            s.troop = {};
            for(var color in game.troop){
                if(game.troop.hasOwnProperty(color)){
                    s.troop[color] = game.troop[color].clone();
                }
            }

            s.owner = game.owner;
            s.value = game.value;
            s.cache = new CH.game.Cache();
            s.phase = game.phase;
            s.start = game.start || choice;
            s.choice = choice;
            s.isOver = game.isOver;
            s.record = game.record.clone();

            s.ownerTroop = s.troop[s.owner];
            s.enemyTroop = s.troop[s.owner.invert()];

            var piece = s.findOwnerPiece(choice.piece.point),
                enemy = s.findEnemyPiece(choice.point);
            if(enemy){
                s.killed = enemy;
            }
            s.movePiece(piece, choice.point);
        },
        property:{
            addWeight:function(weight){
                var s= this;
                s.start.weight += weight;
            },
            findOwnerPieces:function(){
                var s = this;
                return s.ownerTroop.pieces;
            },
            findEnemyPieces:function(){
                var s = this;
                return s.enemyTroop.pieces;
            },
            findPiecesMovableToPoint:function(point, includesKing){
                var s = this, result = [];
                var pieces = s.findMovablePieces();
                for(var i=0; i<pieces.length; i++){
                    var piece = pieces[i];
                    if(!includesKing && (piece instanceof CH.piece.King)) continue;
                    var isMovable = s.findMovablePoints(piece).contains(point);
                    if(isMovable) result.push(piece);
                }
                return result;
            },
            findPiecesAttackableToPoint:function(point, includesKing){
                var s = this, result = [];
                var pieces = s.findMovablePieces();
                for(var i=0; i<pieces.length; i++){
                    var piece = pieces[i];
                    if(!includesKing && (piece instanceof CH.piece.King)) continue;
                    console.log('s.findAttackablePoints(piece)', s.findAttackablePoints(piece), point.toString());
                    var isAttackable = s.findAttackablePoints(piece).contains(point);
                    if(isAttackable) result.push(piece);
                }
                return result;
            },
            findPiecesProtectableToPoint:function(point, includesKing){
                var s = this, result = [];
                var pieces = s.findOwnerPieces();
                for(var i=0; i<pieces.length; i++){
                    var piece = pieces[i];
                    if(!includesKing && (piece instanceof CH.piece.King)) continue;
                    var movables = (piece.attackable && piece.attackable()) || piece.movable();
                    for(var j=0; j<movables.length; j++){
                        var movable = movables[j];
                        if(movable instanceof CH.LINE){
                            var points = movable.getPoints();
                            for(var k=0; k<points.length; k++){
                                if(points[k].equals(point)){
                                    result.push(piece);
                                    j = movables.length;// to break outer.
                                    break;
                                }
                                if(s.isOccupiedPoint(points[k]))break;
                            }
                        } else {
                            if(movable.equals(point)){
                                result.push(piece);
                                break;
                            }
                        }
                    }
                }
                return result;
            }
        }
    });
    function getChoices(game){
        var choices = [];
        if(game.isOver) return choices;
        var pieces = game.findMovablePieces();
        for(var i=0; i<pieces.length; i++){
            var piece = pieces[i];
            var points = game.findMovablePoints(piece),
                disallowed = game.findDisallowedPoints(piece);
            for(var j=0; j<points.length; j++){
                var point = points[j];
                if(disallowed.contains(point)){
                    continue;
                }
                var choice = new Choice(piece, point);
                choices.push(choice);
            }
        }
        return choices;
    }

    return {
        Scenario:Scenario,
        getChoices:getChoices
    }
})();