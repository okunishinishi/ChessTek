CH.render = (function($){
    $.fn.extend({
        piece:function(parts){
            var piece = $(this);
            piece.addClass('piece');
            var inner = $('<div/>').addClass('piece-inner');
            var icon = $('<div/>').addClass('icon').appendTo(inner);
            $.each(parts, function(i, part){
                if(typeof part === 'string'){
                    part = $('<div/>').addClass(part)
                }
                part.addClass('parts');
                icon.append(part);
            });
            piece.wrapInner(inner);
            return piece;
        },
        pawn:function(){
            var parts = ['head', 'neck', 'body', 'foot'];
            var piece = $(this).piece(parts);
            return piece;
        },
        bishop:function(){
            var parts = ['hat', 'head', 'cut', 'neck', 'body', 'foot'];
            var piece = $(this).piece(parts);
            return piece;
        },
        knight:function(){
            var parts = ['nose', 'ear', 'head', 'neck', 'neck-2', 'body', 'foot'];
            var piece = $(this).piece(parts);
            return piece;
        },
        rook:function(){
            var hat = (function(){
                var hat = $('<div/>').addClass('hat');
                for(var i=0; i<3; i++){
                    $('<div/>').addClass('hat-block-' + i)
                        .addClass('parts')
                        .appendTo(hat);
                }
                return hat;
            })();
            var parts = [hat, 'head', 'body', 'foot'];
            var piece = $(this).piece(parts);
            return piece;
        },
        queen:function(){
            var crown = (function(){
                var crown = $('<div/>').addClass('crown');
                for(var i = 0; i<5; i++){
                    var needle = $('<div/>').addClass('needle')
                        .addClass('needle-' + i).appendTo(crown);
                    $.each(['left', 'right'], function(i, dir){
                        $('<div/>').addClass('needle-inner')
                            .addClass(dir)
                            .appendTo(needle);
                    });
                }
                return crown;
            })();
            var parts = [crown, 'body', 'foot'];
            var piece = $(this).piece(parts);

            return piece;
        },
        king:function(){
            var cross = (function(){
                var cross = $('<div/>').addClass('cross');
                $.each(['vertical', 'horizontal'], function(i, dir){
                    $('<div/>').addClass('parts').addClass('cross-bar-' + dir)
                        .appendTo(cross);
                });
                return cross;
            })();
            var parts = [cross, 'head', 'body', 'foot'];
            var piece = $(this).piece(parts);

            return piece;
        },
        execute:function(type, color){
            var piece = $(this).empty();
            piece.attr({
                'data-type':type,
                'data-color':color.toString()
            });
            // return piece.fn[type].call(piece);
            switch(type){
                case 'pawn':
                    return piece.pawn();
                case 'bishop':
                    return piece.bishop();
                case 'knight':
                    return piece.knight();
                case 'rook':
                    return piece.rook();
                case 'queen':
                    return piece.queen();
                case 'king':
                    return piece.king();
            }
            return piece;
        }
    });
    return $;
})($.sub());