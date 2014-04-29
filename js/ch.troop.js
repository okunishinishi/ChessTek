CH.troop = (function(){

    var PointMap = CH.define({
        init:function(rows, columns){
            var s = this;
            for(var row=0;row < rows;row++){
                s[row] = {};
                for(var column = 0; column<columns; column++){
                    s[row][column] = null;
                }
            }
        },
        property:{
            addPiece:function(point, piece){
                var s = this;
                if(s[point.row])s[point.row][point.column] = piece;
            },
            getPiece:function(point){
                var s = this;
                return s[point.row] && s[point.row][point.column];
            },
            removePiece:function(point){
                var s = this;
                if(s[point.row])s[point.row][point.column] = null;
            }
        }
    });
    var Troop = CH.define({
        init:function(color){
            var s = this;
            s.color = color;
            s.pieces = [];
            s.pointMap = new PointMap(8,8);
        },
        property:{
            movePiece:function(piece, point){
                var s = this;
                s.pointMap.removePiece(piece.point);
                s.pointMap.addPiece(point, piece);
                piece.moveTo(point);
            },
            disablePiece:function(piece){
                var s = this;
                s.pointMap.removePiece(piece.point);
                piece.disable();
            },
            enablePiece:function(piece){
                var s = this;
                piece.enable();
                s.pointMap.addPiece(piece.point, piece);
            },
            findPiece:function(point){
                var s = this;
                return s.pointMap.getPiece(point);
            },
            findPieceByType:function(type){
                var result = [];
                var s = this;
                for(var i=0; i< s.pieces.length; i++){
                    var piece = s.pieces[i];
                    if(piece.type === type){
                        result.push(piece);
                    }
                }
                return result;
            },
            destroyPiece:function(piece){
                if(!piece) return;
                var s = this;
                for(var i=0; i<s.pieces.length; i++){
                    if(piece === s.pieces[i]){
                        s.pointMap.removePiece(piece.point);
                        if(piece.destroy) piece.destroy.call(piece);
                        s.pieces.splice(i, 1);

                        return;
                    }
                }
            },
            clone:function(){
                var s = this;
                var troop = new Troop(s.color);
                for(var i=0; i< s.pieces.length; i++){
                    var piece = s.pieces[i];
                    var clone = piece.clone();
                    troop.pieces.push(clone);
                    troop.pointMap.addPiece(clone.point, clone);
                }
                return troop;
            },
            loadPieces:function(pieces){
                var s = this;
                if(!s.pointMap) s.pointMap = new PointMap(8, 8  );
                for(var i=0; i<pieces.length; i++){
                    var piece = pieces[i];
                    piece.color = s.color;
                    piece.dir = s.dir;
                    s.pointMap.addPiece(piece.point, piece);
                }
                s.pieces = pieces;
            }
        }
    });

    var t = {};
    t.Troop = Troop;
    t.BlackTroop = CH.define({
        prototype:Troop,
        init:function(pieces){
            var s = this;
            s.pointMap = new PointMap(8,8);
            if(pieces){
                s.loadPieces(pieces);
            } else {
                s.loadDefaultPieces();
            }
        },
        property:{
            color:CH.enum.Color.BLACK,
            dir:CH.enum.Dir.BOTTOM,
            loadDefaultPieces:function(){
                var s = this;
                var p = CH.piece;
                var pieces = [
                    new p.Rook(0, 0),
                    new p.Knight(0, 1),
                    new p.Bishop(0, 2),
                    new p.Queen(0, 3),
                    new p.King(0, 4),
                    new p.Bishop(0, 5),
                    new p.Knight(0, 6),
                    new p.Rook(0, 7)
                ];
                for(var column = 0; column < 8; column++){
                    var pawn = new p.Pawn(1, column);
                    pieces.push(pawn);
                }
                s.loadPieces(pieces);
            }
        }
    });

    t.WhiteTroop = CH.define({
        prototype:Troop,
        init:function(pieces){
            var s = this;
            s.pointMap = new PointMap(8,8);
            if(pieces){
                s.loadPieces(pieces);
            } else {
                s.loadDefaultPieces();
            }
        },
        property:{
            color:CH.enum.Color.WHITE,
            dir:CH.enum.Dir.TOP,
            loadDefaultPieces:function(){
                var s = this;
                var p = CH.piece;
                var pieces = [
                    new p.Rook(7, 0),
                    new p.Knight(7, 1),
                    new p.Bishop(7, 2),
                    new p.Queen(7, 3),
                    new p.King(7, 4),
                    new p.Bishop(7, 5),
                    new p.Knight(7, 6),
                    new p.Rook(7, 7)
                ];
                for(var column = 0; column < 8; column++){
                    var pawn = new p.Pawn(6, column);
                    pieces.push(pawn);
                }
                s.loadPieces(pieces);
            }
        }
    });
    return t;
})();