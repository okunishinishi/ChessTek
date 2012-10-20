CH.piece = (function(){
    function _upperInitial(str){
        return str.substr(0,1).toUpperCase() + str.substr(1);
    }
    var Piece = CH.define({
        property:{
            _sequence:0,
            row:null,
            column:null,
            point:null,
            movable:function(){
            },
            moveTo:function(point){
                var s = this;
                s.point = point;
                s.clearCache();
            },
            clearCache:function(){
                var s = this;
                if(!s.cache)  return;
                if(s.cache.movable)s.cache.movable = null;
            },
            clone:function(){
                var s = this;
                var clone = new p[_upperInitial(s.type)](s.point.row, s.point.column);
                clone.color = s.color;
                clone.type = s.type;
                clone.dir = s.dir;
                clone.value = s.value || 0;
                clone.origin = s;
                return clone;
            },
            enable:function(){
                var s = this;
                if(!s.point && s.savedPoint){
                    s.point = s.savedPoint;
                    s.savedPoint = null;
                }
            },
            disable:function(){
                var s = this;
                s.savedPoint = s.point;
                s.point = null;
            }
        }
    });
    Piece._sequence = 0;

    function makeInit(){
        return function(row, column){
            var s = this;
            if(arguments[0] instanceof CH.Point){
                s.point = arguments[0].clone();
            } else {
                s.point = new CH.Point(row, column);
            }
            Piece._sequence ++;
            s.pieceId = Piece._sequence;
            s.cache = {};
        }
    }


    function makeMovableLine(from, dirY, dirX){
        from = from.clone();
        var to = (function(point, x, y){
            do{
                point.row += y;
                point.column += x;
            } while(point.isValid());
            point.row -= y;
            point.column -= x;
            return point;
        })(from.clone(), dirX, dirY);
        from.move(dirY, dirX);
        if(!from.isValid()) return null;
        return new CH.LINE(from, to);
    }
    var p = {};
    p.Pawn = CH.define({
        init:makeInit(),
        prototype:Piece,
        property:{
            movable:function(double){
                var s = this;
                var result = null, amount;
                if(double){
                    if(s.cache.movableDouble) return s.cache.movableDouble;
                    switch(s.dir){
                        case CH.enum.Dir.TOP:
                            amount = -2;
                            break;
                        case CH.enum.Dir.BOTTOM:
                            amount = 2;
                            break;
                    }
                    result = s.point.clone().move(amount, 0);
                    s.cache.movableDouble = result;
                } else {
                    if(s.cache.movable) return s.cache.movable;
                    switch(s.dir){
                        case CH.enum.Dir.TOP:
                            amount = -1;
                            break;
                        case CH.enum.Dir.BOTTOM:
                            amount = 1;
                            break;
                    }
                    result = s.point.clone().move(amount, 0);
                    s.cache.movable = result;
                }
                return result;
            },
            attackable:function(){
                var result = [];
                var s = this;
                if(s.cache.attackable) return s.cache.attackable;
                var left, right;
                switch(s.dir){
                    case CH.enum.Dir.TOP:
                        left = s.point.clone().move(-1, -1);
                        right = s.point.clone().move(-1, 1);
                        break;
                    case CH.enum.Dir.BOTTOM:
                        left = s.point.clone().move(1, -1);
                        right = s.point.clone().move(1, 1);
                        break;
                }
                if(left.isValid()) result.push(left);
                if(right.isValid()) result.push(right);
                s.cache.attackable = result;
                return result;
            },
            atEnPassantPosition:function(){
                var s = this;
                switch(s.dir){
                    case CH.enum.Dir.TOP:
                        return s.point.row === 3;
                    case CH.enum.Dir.BOTTOM:
                        return s.point.row === 4;
                }
            },
            enPassable:function(){
                var s = this;
                if(s.cache.enPassable) return s.cache.enPassable;
                var result = [];
                var x = [-1, 1];
                for(var i=0; i<x.length; i++){
                    var point = s.point.clone().move(0, x[i]);
                    if(point.isValid()) result.push(point);
                }
                s.cache.enPassable = result;
                return result;
            },
            promotable:function(){
                var s = this;
                switch(s.dir){
                    case CH.enum.Dir.TOP:
                        return s.point.row === 0;
                    case CH.enum.Dir.BOTTOM:
                        return s.point.row === 7;
                }
            },
            clearCache:function(){
                var s = this;
                if(!s.cache)  return;
                if(s.cache.movable)s.cache.movable = null;
                if(s.cache.attackable)s.cache.attackable = null;
                if(s.cache.enPassable)s.cache.enPassable = null;
                if(s.cache.movableDouble) s.cache.movableDouble = null;
            }
        }
    });
    p.Bishop = CH.define({
        init:makeInit(),
        prototype:Piece,
        property:{
            movable:function(){
                var s = this;
                if(s.cache.movable) return s.cache.movable;
                var result = [];
                var dirs = [
                    [-1, -1],
                    [ 1, -1],
                    [-1,  1],
                    [ 1,  1]
                ];
                for(var i=0; i<dirs.length; i++){
                    var dir = dirs[i];
                    var line = makeMovableLine(s.point, dir[0], dir[1]);
                    if(line) result.push(line);
                }
                s.cache.movable = result;
                return result;
            }
        }
    });
    p.Knight = CH.define({
        init:makeInit(),
        prototype:Piece,
        property:{
            movable:function(){
                var s = this;
                if(s.cache.movable) return s.cache.movable;
                var result = [];
                var moves = [
                    [-2, -1],
                    [-2,  1],
                    [-1,  2],
                    [-1, -2],
                    [ 1,  2],
                    [ 1, -2],
                    [ 2,  1],
                    [ 2, -1]
                ];
                for(var i=0; i<moves.length; i++){
                    var move = moves[i];
                    var point = s.point.clone().move(move[0], move[1]);
                    if(point.isValid()){
                        result.push(point);
                    }
                }
                s.cache.movable = result;
                return result;
            }
        }
    });
    p.Rook = CH.define({
        init:makeInit(),
        prototype:Piece,
        property:{
            castlingAvailable:true,
            movable:function(){
                var s = this;
                if(s.cache.movable) return s.cache.movable;
                var result = [];
                var dirs = [
                    [-1,  0],
                    [ 1,  0],
                    [ 0,  1],
                    [ 0, -1]
                ];
                for(var i=0; i<dirs.length; i++){
                    var dir = dirs[i];
                    var line = makeMovableLine(s.point, dir[0], dir[1]);
                    if(line)result.push(line);
                }
                s.cache.movable = result;
                return result;
            }
        }
    });
    p.Queen = CH.define({
        init:makeInit(),
        prototype:Piece,
        property:{
            movable:function(){
                var s = this;
                if(s.cache.movable) return s.cache.movable;
                var result = [];
                var dirs = [
                    [-1,  0],
                    [ 1,  0],
                    [ 0,  1],
                    [ 0, -1],
                    [-1, -1],
                    [ 1, -1],
                    [-1,  1],
                    [ 1,  1]
                ];
                for(var i=0; i<dirs.length; i++){
                    var dir = dirs[i];
                    var line = makeMovableLine(s.point, dir[0], dir[1]);
                    if(line) result.push(line);
                }
                s.cache.movable = result;
                return result;
            }
        }
    });

    p.King = CH.define({
        init:makeInit(),
        prototype:Piece,
        property:{
            castlingAvailable:true,
            movable:function(){
                var s = this;
                if(s.cache.movable) return s.cache.movable;
                var result = [];
                var moves = [
                    [-1,  1],
                    [-1,  0],
                    [-1, -1],
                    [ 0,  1],
                    [ 0, -1],
                    [ 1,  1],
                    [ 1,  0],
                    [ 1, -1]
                ];
                for(var i=0; i<moves.length; i++){
                    var move = moves[i];
                    var point = s.point.clone().move(move[0], move[1]);
                    if(point.isValid()){
                        result.push(point);
                    }
                }
                s.cache.movable = result;
                return result;
            }
        }
    });
    for(var key in p){
        if(p.hasOwnProperty(key)){
            p[key].prototype.type = key.toLowerCase();
        }
    }
    return p;
})();