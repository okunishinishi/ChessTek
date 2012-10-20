CH.game = (function(){
    var Color = CH.enum.Color;

    var Choice = CH.define({
        init:function(piece, point){
            var s = this;
            s.piece = piece;
            s.point = point;
            s.weight = 0;
        },
        property:{
            toString:function(){
                var s = this;
                return s.piece.type.substr(0,1).toUpperCase()
                    + s.point.row + s.point.column;
            }
        }
    });


    var Cache = CH.define({
        init:function(){
            var s = this;
            s.movable = {};
            s.disallowed = {};
            s.castlingAvailableRooks = null;
            s.enable();
        },
        property:{
            enable:function(){
                var s = this;
                s.enabled = true;
            },
            disable:function(){
                var s = this;
                s.enabled = false;
            },
            getMovable:function(pieceId){
                var s = this;
                if(!s.enabled) return null;
                return s.movable[pieceId];
            },
            addMovable:function(pieceId, movable){
                var s = this;
                if(!s.enabled) return;
                s.movable[pieceId] = movable;
            },
            getDisallowed:function(pieceId){
                var s = this;
                if(!s.enabled) return null;
                return s.disallowed[pieceId];
            },
            addDisallowed:function(pieceId, movable){
                var s = this;
                if(!s.enabled) return;
                s.disallowed[pieceId] = movable;
            },
            clear:function(){
                var s = this;
                s.movable = {};
                s.disallowed = {};
                s.castlingAvailableRooks = null;
            }
        }
    });
    var Game = CH.define({
        init:function(record){
            var s = this;
            s.troop = {};
            s.phase = 0;

            if(record){
                var pieces = record.getPhase(s.phase).pieces;
                s.troop[Color.WHITE] = new CH.troop.WhiteTroop(pieces.white);
                s.troop[Color.BLACK] = new CH.troop.BlackTroop(pieces.black);
            } else {
                s.troop[Color.WHITE] = new CH.troop.WhiteTroop();
                s.troop[Color.BLACK] = new CH.troop.BlackTroop();
            }


            s.askPromotion = {};
            s.askCastling = {};
            s.askCastling[Color.WHITE] = function(){return true};
            s.askCastling[Color.BLACK] = function(){return true};
            s.cache = new Cache();
            s.record = new CH.record.ChoiceRecord();

            s.ownerTroop = s.troop[s.owner];
            s.enemyTroop = s.troop[s.owner.invert()];

        },
        property:{
            owner:Color.WHITE,
            turn:function(){
                var s = this;
                s.swapOwner();
                s.phase ++;
                s.cache.clear();

            },
            assertGameover:function(){
                var s = this;
                if(s.isOver) return;
                s.checked = !s.isKingSafe();
                if(s.checked){
                    if(s.isCheckmate()){
                        s.isOver = true;
                        s.checkmate && s.checkmate.call(s, s.owner.invert());
                        return;
                    }
                } else {
                    if(s.isStalemate()){
                        s.isOver = true;
                        s.draw && s.draw.call(s);
                        return;
                    }
                }
                if(s.shouldGiveUp()){
                    s.isOver = true;
                    s.checkmate && s.checkmate.call(s, s.owner.invert());
                    return;
                }
                if(!s.hasSufficientPieces()){
                    s.isOver = true;
                    s.draw && s.draw.call(s);
                    return;
                }

                if(!s.findMovablePieces(true).length){
                    s.isOver = true;
                    s.draw && s.draw.call(s);
                    return;
                }
            },
            movePiece:function(piece, point){
                var s = this;
                if(s.isOver) return;

                if(piece instanceof CH.piece.Pawn){
                    piece.doubleMoved = !piece.moved && (Math.abs(point.row - piece.point.row) === 2);

                    var enPassable = s.findEnPassablePoints(piece);
                    if(enPassable){
                        for(var l=0; l<enPassable.length; l++){
                            if(enPassable[l].column === point.column){
                                var enPassantTarget = s.findEnemyPiece(enPassable[l]);
                                s.enemyTroop.destroyPiece(enPassantTarget);
                                s.onEnPassant && s.onEnPassant.call(this, point);
                                break;
                            }
                        }
                    }
                }

                var attacked = s.findEnemyPiece(point);
                if(attacked){
                    s.enemyTroop.destroyPiece(attacked);
                }

                var castlingAvailable = piece.castlingAvailable && s.isCastlingAvailableForPiece(piece);
                if(castlingAvailable){
                    var rooks = s.findCastlingAvailableRooks();
                    for(var i=0;i<rooks.length;i++){
                        var rook = rooks[i];
                        var castlingPoint = rook.castlingPoint[piece.type];
                        if(castlingPoint.equals(point)){
                            var askCastling = s.askCastling[s.owner.toString()];
                            var king = s.findOwnerKing();
                            var move = {
                                king:new Choice(king, rook.castlingPoint.king),
                                rook:new Choice(rook, rook.castlingPoint.rook)
                            };
                            var isCastling = askCastling && askCastling.call(this, move);

                            if(isCastling === null || isCastling === undefined){
                                return;
                            }
                            if(isCastling === true){
                                for(var key in move){
                                    if(move.hasOwnProperty(key)){
                                        var choice = move[key];
                                        s.ownerTroop.movePiece(choice.piece, choice.point);
                                        piece.moved = true;
                                    }
                                }
                            }
                        }
                    }
                }

                s.ownerTroop.movePiece(piece, point);
                piece.moved = true;

                s.record.add(new Choice(piece, point));

                var promoteAvailable = piece.promotable && piece.promotable();
                if(promoteAvailable){
                    var askPromotion = s.askPromotion[s.owner.toString()];
                    if(askPromotion) {
                        var type = askPromotion.call(this, piece);
                        if(type) {
                            s.promotePiece(piece, type);
                        } else {
                            //wait for promote type selection
                            return;
                        }
                    }
                }
                s.turn();
                s.assertGameover();

            },
            swapOwner:function(){
                var s = this;
                s.enemyTroop = s.troop[s.owner];
                s.owner = s.owner.invert();
                s.ownerTroop = s.troop[s.owner];
            },
            isCastlingAvailableForPiece:function(piece){
                if(piece.moved) return false;
                var s = this;
                var rooks = s.findCastlingAvailableRooks();
                if(piece instanceof CH.piece.King){
                    return rooks.length > 0;
                }
                if(piece instanceof CH.piece.Rook){
                    for(var i=0; i<rooks.length; i++){
                        if(piece === rooks[i]) return true;
                    }
                }
                return false;
            },
            findCastlingAvailableRooks:function(){
                var s = this;
                var cache = s.cache.castlingAvailableRooks;
                if(cache) return cache;

                var result = [];
                var king = s.findOwnerKing();
                if(king.moved) return result;
                var rooks = s.ownerTroop.findPieceByType('rook');
                for(var i=0; i<rooks.length; i++){
                    var rook = rooks[i];
                    if(rook.moved) continue;
                    var point = rook.point.clone();
                    while(true){
                        point.column += (point.column < king.point.column)?1:-1;
                        if(point.column === king.point.column){
                            if(!rook.castlingPoint){
                                if(rook.point.column < king.point.column){
                                    rook.castlingPoint = {
                                        king:king.point.clone().move(0, -2),
                                        rook:king.point.clone().move(0, -1)
                                    }
                                } else {
                                    rook.castlingPoint = {
                                        king:king.point.clone().move(0, 2),
                                        rook:king.point.clone().move(0, 1)
                                    }
                                }
                            }
                            var origin = king.point;
                            s.ownerTroop.movePiece(king, rook.castlingPoint.king);
                            if(s.isKingSafe()){
                                result.push(rook);
                            }
                            s.ownerTroop.movePiece(king, origin);
                            break;
                        }
                        if(s.findOwnerPiece(point)) break;
                        if(s.findEnemyPiece(point)) break;
                    }
                }
                s.cache.castlingAvailableRooks = result;
                return result;
            },
            isKingSafe:function(){
                var s = this, result = true;
                s.swapOwner();
                s.cache.disable();
                var pieces = s.findMovablePieces();
                for(var i=0; i<pieces.length; i++){
                    var isCheck = s.findCheckablePoints(pieces[i]).length > 0;
                    if(isCheck){
                        result = false;
                        break;
                    }
                }
                s.cache.enable();
                s.swapOwner();
                return result;
            },
            isCheckmate:function(){
                var s = this;
                var pieces = s.findMovablePieces();
                for(var i=0; i<pieces.length; i++){
                    var piece = pieces[i];
                    var movables = s.findMovablePoints(piece);
                    var disallowed = s.findDisallowedPoints(piece);
                    if(movables.length > disallowed.length) return false;
                }
                return true;
            },
            shouldGiveUp:function(){
                var s = this;
                return s.ownerTroop.pieces.length === 1
                    && s.enemyTroop.pieces.length > 3;

            },
            isStalemate:function(){
                var s = this;
                var movablePieces = s.findMovablePieces();
                return movablePieces.length === 0;
            },
            hasSufficientPieces:function(){
                var s = this;
                var owner = s.ownerTroop,
                    enemy = s.enemyTroop;
                var length = owner.pieces.length + enemy.pieces.length;
                if(length > 4){
                    return true;
                }
                if(!owner.pieces.length) return false;
                if(!enemy.pieces.length) return false;

                if(length === 4){
                    var bishop = {
                        owner:owner.findPieceByType('bishop'),
                        enemy:enemy.findPieceByType('bishop')
                    };
                    if(bishop.owner.length === 1
                        && bishop.enemy.length === 1){
                        var point1 = bishop.owner[0].point,
                            point2 = bishop.enemy[0].point;
                        var onSameColor =
                            (point1.row + point1.column) % 2
                             === (point2.row + point2.column) % 2;
                        if(onSameColor) return false;
                    }
                    return true;
                } else {
                    var pieces = [].concat(owner.pieces).concat(enemy.pieces);
                    for(var i=0; i<pieces.length; i++){
                        var piece = pieces[i];
                        switch (piece.type){
                            case 'king':
                                continue;
                            case 'knight':
                            case 'bishop':
                                return false;
                            default :
                                return true;
                        }
                    }
                    return true;
                }

            },
            isMovablePiece:function(piece, strict){
                var s = this;
                var movables = s.findMovablePoints(piece);
                if(strict){
                    var disallowed = s.findDisallowedPoints(piece);
                    return (movables.length > disallowed.length);
                }
                return movables.length > 0;
            },
            findMovablePieces:function(strict){
                var s = this, result = [];
                var pieces = s.ownerTroop.pieces;
                for(var i=0;i < pieces.length; i++){
                    var piece = pieces[i];
                    if(s.isMovablePiece(piece, strict)){
                        result.push(piece);
                    }
                }
                return result;
            },
            findOwnerPiece:function(point){
                var s = this;
                return s.ownerTroop.findPiece(point);
            },
            findEnemyPiece:function(point){
                var s = this;
                return s.enemyTroop.findPiece(point);
            },
            findOwnerKing:function(){
                var s = this;
                return s.ownerTroop.findPieceByType('king')[0];
            },
            isOccupiedPoint:function(point){
                var s = this;
                return s.findOwnerPiece(point) || s.findEnemyPiece(point);
            },
            findAttackablePoints:function(piece){
                var s = this, result = [];
                var isPawn = (piece instanceof CH.piece.Pawn);
                var points = isPawn?piece.attackable():s.findMovablePoints(piece);
                for(var i=0; i<points.length;i++){
                    var point = points[i];
                    var isAttackable = point.enPassantAttack || s.findEnemyPiece(point);
                    if(isAttackable){
                        result.push(point.enPassantAttack || point);
                    }
                }
                return result;
            },
            findCheckablePoints:function(piece){
                var s = this, result = [];
                var points = s.findAttackablePoints(piece);
                for(var i=0; i<points.length; i++){
                    var point = points[i];
                    var enemy = s.findEnemyPiece(point);
                    if(enemy instanceof CH.piece.King){
                        result.push(point);
                    }
                }
                return result;
            },
            findDisallowedPoints:function(piece){
                var s = this, result = [];
                var cache = s.cache.getDisallowed(piece.pieceId);
                if(cache) return cache;

                var points = s.findMovablePoints(piece);
                var owner = s.ownerTroop;
                var origin = piece.point;
                for(var i=0; i<points.length; i++){
                    owner.movePiece(piece, points[i]);
                    var enemy = s.findEnemyPiece(piece.point);
                    if(enemy) s.enemyTroop.disablePiece(enemy);
                    if(!s.isKingSafe()){
                        result.push(piece.point);
                    }
                    if(enemy) s.enemyTroop.enablePiece(enemy);
                }
                owner.movePiece(piece, origin);

                s.cache.addDisallowed(piece.pieceId, result);
                return result;
            },
            findMovablePoints:function(piece){
                if(!piece.point) return [];
                var s = this;
                var cache = s.cache.getMovable(piece.pieceId);
                if(cache) return cache;
                var result = [];

                if(piece instanceof CH.piece.Pawn){
                    var movablePoint = piece.movable();
                    if(!s.isOccupiedPoint(movablePoint)){
                        result.push(movablePoint);
                        if(!piece.moved){
                            movablePoint = piece.movable('double');
                            if(!s.isOccupiedPoint(movablePoint)){
                                result.push(movablePoint);
                            }
                        }
                    }
                    var attackable = piece.attackable();
                    for(var k=0; k<attackable.length; k++){
                        if(s.findEnemyPiece(attackable[k])){
                            result.push(attackable[k]);
                        }
                    }
                    var enPassable = s.findEnPassablePoints(piece);
                    if(enPassable && enPassable.length){
                        for(var l=0; l<enPassable.length; l++){
                            var enemy = s.findEnemyPiece(enPassable[l]);
                            if(enemy){
                                var enPassantMove = new CH.Point(piece.movable().row, enPassable[l].column);
                                enPassantMove.enPassantAttack = enPassable[l];
                                result.push(enPassantMove);
                            }
                        }
                    }
                } else {
                    var movables = piece.movable();
                    for(var i=0; i<movables.length; i++){
                        var movable = movables[i];
                        if(movable instanceof CH.LINE){
                            var points = movable.getPoints();
                            for(var j=0; j< points.length; j++){
                                var point = points[j];
                                if(s.findOwnerPiece(point)) break;
                                result.push(point);
                                if(s.findEnemyPiece(point)) break;
                            }
                        } else {
                            if(!s.findOwnerPiece(movable)) result.push(movable);
                        }
                    }
                }
                s.cache.addMovable(piece.pieceId, result);
                return result;
            },
            findEnPassablePoints:function(piece){
                if(!piece.atEnPassantPosition()) return null;
                var s = this, result = [];
                var enPassable = piece.enPassable();
                for(var i=0; i<enPassable.length; i++){
                    var enemy = s.findEnemyPiece(enPassable[i]);
                    var isEnPassable = enemy && (enemy instanceof CH.piece.Pawn) && enemy.doubleMoved;
                    if(isEnPassable){
                        result.push(enPassable[i]);
                    }
                }
                return result;
            },
            promotePiece:function(piece, type){
                var s = this;
                var pieces = s.ownerTroop.pieces;
                for(var i=0; i<pieces.length; i++){
                    if(pieces[i] === piece){
                       switch (type){
                           case 'knight':
                               pieces[i] = new CH.piece.Knight(piece.point);
                               break;
                           case 'queen':
                               pieces[i] = new CH.piece.Queen(piece.point);
                               break;
                       }
                       pieces[i].type =type;
                       pieces[i].color = piece.color;
                       s.ownerTroop.movePiece(pieces[i], piece.point);
                       return pieces[i];
                    }
                }
            }
        }
    });
    return {
        Cache:Cache,
        Choice:Choice,
        Game:Game
    };
})();