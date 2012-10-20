;(function($){
    var userAgent = navigator.userAgent;
    var browser = {
        isOpera:userAgent.match(/Opera/),
        isIE:userAgent.match(/Explorer/) || userAgent.match(/MSIE/)
    };

    var Dir = CH.enum.Dir,
        settings = {
            playerColor:CH.enum.Color.WHITE
        };
    var plugin = (function($){
        $.fn.extend({
            contains:function(x, y){
                var elm = $(this), offset = elm.offset();
                return offset.left <= x
                    && x <= offset.left + elm.width()
                    && offset.top <= y
                    && y <= offset.top + elm.height();

            },
            addClasses:function(className){
                var elm = $(this);
                if(!className) return elm;
                if(className instanceof  Array){
                    for(var i=0; i < className.length; i++){
                        elm.addClass(className[i]);
                    }
                } else {
                    elm.addClass(className);
                }
                return elm;
            },
            removeClasses:function(className){
                var elm = $(this);
                if(!className) return elm;
                if(className instanceof  Array){
                    for(var i=0; i < className.length; i++){
                        elm.removeClass(className[i]);
                    }
                } else {
                    elm.removeClass(className);
                }
                return elm;
            },
            center:function(){
                var elm = $(this), offset = elm.offset();
                return {
                    x:offset.left + elm.width() / 2,
                    y:offset.top + elm.height() / 2
                }
            }
        });

        return {
            piece:function(command, options){
                if(typeof command != 'string'){
                    options = command;
                    command = 'init';
                }
                var piece = $(this);
                switch(command){
                    case 'init':
                        piece = CH.render(piece)
                            .execute(options.type, options.color)
                            .get(0);
                        piece = $(piece);
                        return piece;
                    case 'move':
                        var base = piece.data('base') || piece.center();
                        var x = options.x, y = options.y;
                        if(options.square){
                            var center = options.square.center();
                            x = center.x - 3;
                            y = center.y - 2;
                        }
                        var css = {
                            left:x - base.x,
                            top:y - base.y
                        };
                        if(options.duration){
                            piece
                                .addClass('on-move')
                                .animate(css, options.duration, null, function(){
                                    piece.removeClass('on-move');
                                    options.callback.apply(this, arguments);
                                });
                        } else {
                            piece.css(css);
                        }
                        return piece;

                    case 'select':
                        piece
                            .addClass('selected')
                            .data('base', piece.center());
                        return piece;
                    case 'deselect':
                        piece
                            .removeAttr('style')
                            .removeClass('selected')
                            .data('base', null);
                        return piece;
                    case 'cancel':
                        piece.animate({
                            left:2,
                            top:2
                        }, 200, null, function(){
                            piece.removeAttr('style');
                            options.callback.apply(this, arguments);
                        });
                        return piece;
                    case 'die':
                        piece.addClass('dead');
                        return piece;
                    case 'promotePiece':
                        var count = 0;
                        var data = options && options.data;
                        var timer = setInterval(function(){
                            if(count === 3){
                                piece = CH.render(piece)
                                    .execute(data.type, data.color.toString()).get(0);
                                piece = $(piece).data('piece', data);
                            }
                            if(++count > 7){
                                clearInterval(timer);
                                options.callback.call(this);
                            }
                            piece.toggleClass('blight');
                        }, 100);

                        return piece;
                }

                return piece;
            },
            square:function(command, options){
                if(typeof command != 'string'){
                    options = command;
                    command = 'init';
                }
                var square = $(this);
                switch(command){
                    case 'init':
                        square.addClass('square')
                            .attr('data-color', options.color)
                            .data('point', options.point);
                        return square;
                    case 'message':
                        var message = $('> .message', square);
                        if(message.size() === 0){
                            message = $('<div/>').addClass('message').appendTo(square).hide();
                        }
                        message.show().text(options.text);
                        setTimeout(function(){
                            message.hide();
                        }, 1200);
                        return square;
                }

                return square;
            },
            tomb:function(command, options){
                if(typeof command != 'string'){
                    options = command;
                    command = 'init';
                }
                var tomb = $(this);
                switch(command){
                    case 'init':
                        tomb.addClass('tomb')
                            .attr({
                                'data-color':options.color
                            })
                            .hide();
                        $.each(CH.piece, function(key){
                            var type = key.toLowerCase();
                            var item = $('<div/>').appendTo(tomb)
                                .addClass('tomb-item')
                                .attr('data-type', type)
                                .hide();
                            $('<div/>')
                                .piece({
                                    type:type,
                                    color:options.color
                                })
                                .piece('die')
                                .appendTo(item);
                            $('<span/>').addClass('count')
                                .text(0).appendTo(item);
                        });
                        return tomb;
                    case 'add':
                        var offset = tomb.show().offset();
                        var piece = options.piece;
                        piece.piece('move', {
                            x:offset.left - piece.width(),
                            y:offset.top - piece.height(),
                            duration:140,
                            callback:function(){
                                piece.remove();
                                var type = piece.attr('data-type');
                                var item = $('.tomb-item[data-type=' + type + ']', tomb);
                                var count = $('.count', item);
                                count.text(parseInt(count.text()) + 1);
                                if(count.text()){
                                    item.show();
                                } else {
                                    item.hide();
                                }
                            }
                        });
                        return tomb;
                }
                return tomb;
            },
            promotionChoice:function(command, options){
                if(typeof command != 'string'){
                    options = command;
                    command = 'init';
                }
                var choice = $(this);
                switch (command){
                    case 'init':
                        var color = options.color;
                        choice.addClass('promotion-choice')
                            .attr('data-color', color);
                        $('<h3/>').addClass('title')
                            .text('promotion')
                            .appendTo(choice)
                            .disableSelection();
                        var inner = $('<div/>').addClass('promotion-choice-inner')
                            .appendTo(choice);
                        $.each(['queen', 'knight'], function(i, type){
                            $('<div/>').appendTo(inner)
                                .piece({type:type, color:color})
                                .click(function(){
                                    var callback = choice.data('callback');
                                    if(callback) callback.call(this, type);
                                    choice.promotionChoice('hide');
                                });
                            if(i===0){
                                $('<span/>').addClass('or')
                                    .appendTo(inner)
                                    .text('or')
                            }
                        });
                        choice.draggable({
                            containment:'parent',
                            handle:'.title'
                        }).hide();

                        return choice;
                    case 'show':
                        choice.data('callback', options.callback);
                        choice.show();
                        return choice;
                    case 'hide':
                        choice.hide();
                        return choice;

                }
                return choice;
            },
            board:function(command, options){
                if(typeof command != 'string'){
                    options = command;
                    command = 'init';
                }
                var board = $(this);
                switch(command){
                    case 'init':
                        board
                            .addClass('board')
                            .attr('data-owner', 'user')
                            .data('king', {black:null, white:null})

                        var table = $('<table/>').appendTo(board);
                        for(var row=0; row<8; row++){
                            var tr = $('<tr/>').appendTo(table);
                            for(var column=0; column<8; column++){
                                var color = (row + column) % 2 == 0 ? 'light':'dark';
                                var td = $('<td/>').appendTo(tr);
                                $('<div/>')
                                    .appendTo(td)
                                    .square({
                                        color:color,
                                        point:new CH.Point(row, column)
                                    })
                                    .click(function(){
                                        var square = $(this);
                                        if(square.is('.movable')){
                                            if(square.is('.disallowed')){

                                                return;
                                            }
                                            board.board('move', {square:square})
                                                .attr('data-owner', 'none');
                                        } else {
                                            board.board('cancel');
                                        }
                                    })
                                    .hover(function(){
                                        var square = $(this);
                                        var isMovable = square.is('.movable');
                                        if(isMovable){
                                            if(square.is('.disallowed')){
                                                board.board('highlightKing', {danger:true});
                                            }
                                        }
                                        var selected = board.data('selected');
                                        if(selected){
                                            if(!(browser.isOpera || browser.isIE)){
                                                var pieceMove = isMovable || selected.parent('.square').is(square);
                                                if(pieceMove){
                                                    var center = square.center();
                                                    selected.piece('move', {square:square});
                                                }
                                            }
                                        }
                                    }, function(){
                                        var square = $(this);
                                        if(square.is('.movable.disallowed')){
                                            board.board('highlightKing', {danger:false});
                                        }
                                    });
                            }
                        }
                        for(var key in Dir){
                            if(!Dir.hasOwnProperty(key)) continue;
                            $('<div/>').addClass('frame-bar')
                                .attr('data-dir', Dir[key])
                                .appendTo(board);
                        }
                        $('<div/>').addClass('clear').appendTo(board);

                        return board;
                    case 'load':
                        var game = options && options.game;
                        board.data('game', game);
                        $.each(game.troop, function(color, troop){
                            $.each(troop.pieces, function(i, piece){
                                piece.elm = $('<div/>')
                                    .piece({type:piece.type, color:color})
                                    .data('piece', piece)
                                    .hover(function(){
                                        var piece = $(this).data('piece');
                                        board.board('pieceHoverIn', {piece:piece});
                                    }, function(){
                                        var piece = $(this).data('piece');
                                        board.board('pieceHoverOut', {piece:piece});
                                    })
                                    .click(function(e){
                                        board.board('pieceClick', {piece:this});
                                        e.preventDefault();
                                        e.stopPropagation();
                                    });
                                var square = board.board('find', piece.point);
                                square.append(piece.elm);
                                piece.destroy = function(){
                                    board.board('destroy', {
                                        piece:this
                                    });
                                };
                                if(piece instanceof CH.piece.King){
                                    board.data('king')[color] = piece.elm;
                                }
                            });
                            $('<div/>').appendTo(board)
                                    .tomb({color:color});
                            $('<div/>').appendTo(board)
                                .promotionChoice({color:color});
                        });
                        var player = settings.playerColor.toString();
                        game.askPromotion[player] = function(piece){
                            board.addClass('covered');
                            $('.promotion-choice[data-color=' + player + ']', board)
                                .promotionChoice('show', {
                                    callback:function(type){
                                        board.board('promote', {
                                            piece:piece,
                                            type:type
                                        });
                                        board.removeClass('covered');
                                    }
                                });

                            return null;
                        };
                        game.askCastling[player] = function(move){
                            board.board('castling', {
                                move:move
                            });
                            return null;
                        };
                        game.onEnPassant = function(point){
                            var square = board.board('find', point);
                            square.square('message',{
                                text:'en passant'
                            });
                        };
                        return board;
                    case 'promote':
                        game = board.data('game');
                        piece = options.piece;
                        var type = options.type;
                        var newPiece = game.promotePiece(piece, type);
                        piece.elm.piece('promotePiece', {
                            data:newPiece,
                            callback:function(){
                                game.turn();
                                game.assertGameover();
                            }
                        });

                        newPiece.elm = piece.elm;
                        newPiece.destroy = function(){
                            board.board('destroy', {
                                piece:this
                            });
                        };
                        return board;
                    case 'castling':
                        var move = options.move;
                        for(var key in move){
                            if(!move.hasOwnProperty(key)) continue;
                            var point = move[key].point, piece = move[key].piece;
                            game = board.data('game');
                            game.ownerTroop.movePiece(piece, point);
                            piece.moved =true;
                            var square = board.board('find', point);
                            if(piece.elm.is('.selected')){

                            } else {
                                square.square('message',{
                                    text:'castling'
                                });
                                piece.elm.piece('move', {
                                    square:square,
                                    duration:100,
                                    callback:function(){
                                        square.append(piece.elm);
                                        board.board('deselect', {piece:piece.elm});
                                        game = board.data('game');
                                        game.turn();
                                        game.assertGameover();
                                    }
                                });
                            }
                        }
                        return board;
                    case 'unload':
                        $('.piece,.tomb,.promotion-choice', board).remove();
                        board.data('game', null);
                        return board;
                    case 'find':
                        var points = options.points;
                        if(points != undefined){
                            var result = $();
                            $('tr > td > .square', board).each(function(){
                                var square = $(this);
                                for(var i=0; i<points.length; i++){
                                    var point = points[i];
                                    if(square.data('point').equals(point)){
                                        result = result.add(square);
                                    }
                                }
                                return result;
                            });

                            return result;
                        }
                        if(options.row != undefined || options.column != undefined){
                            return $('tr:eq(' + options.row + ') td:eq(' + options.column + ')', board).children('.square');
                        }
                        return $();
                    case 'highlightKing':
                        var ownerColor = board.data('game').owner.toString();
                        var king = board.data('king')[ownerColor];
                        $.each(['danger', 'pinch'], function(i, key){
                            var style = 'in-' + key;
                            if(options[key]){
                                king.addClass(style)
                                    .addClass('highlight');
                            } else {
                                king.removeClass(style)
                                    .removeClass('highlight');
                            }
                        });
                        return board;

                    case 'select':
                        piece = options.piece.piece('select');
                        board
                            .addClass('on-select')
                            .data('selected', piece);
                        return board;
                    case 'deselect':
                        options.piece.piece('deselect');
                        board
                            .removeClass('on-select')
                            .data('selected', null)
                            .board('style', {
                                remove:['movable', 'attackable', 'check']
                            });
                        return board;
                    case 'cancel':
                        selected = board.data('selected');
                        if(!selected) return;
                        selected.piece('cancel', {
                            callback:function(){
                                board.board('deselect', {
                                    piece:selected
                                });
                            }
                        });
                        return board;
                    case 'style':
                        points = options.points;
                        if(points){
                            square = board.board('find', {points:points});
                        } else {
                            square = $('.square', board);
                        }
                        square
                            .addClasses(options.add)
                            .removeClasses(options.remove);
                        return board;
                    case 'move':
                        game = board.data('game');
                        square = options.square;
                        var selected = options.piece || board.data('selected');
                        if(!selected) return;
                        var center = square.center();
                        selected.piece('move', {
                            square:square,
                            duration:options.duration || 100,
                            callback:function(){
                                board.board('style', {
                                    remove:['movable', 'attackable', 'checkable', 'disallowed', 'castlingAvailable']
                                });

                                square.append(selected);
                                var piece = selected.data('piece'),
                                    point = square.data('point');
                                game.movePiece(piece, point);
                                board.board('deselect', {piece:selected});
                                if(options.callback)options.callback();
                            }
                        });
                        return board;
                    case 'destroy':
                        piece = options.piece;
                        var tomb = $('.tomb[data-color=' + piece.color + ']', board);
                        tomb.tomb('add', {piece:piece.elm});
                        return board;
                    case 'pieceHoverIn':
                        game = board.data('game');
                        piece = options.piece;
                        if(game.owner !== piece.color) return board;
                        var stylePoints = {
                            movable:game.findMovablePoints(piece),
                            attackable:game.findAttackablePoints(piece),
                            checkable:game.findCheckablePoints(piece),
                            disallowed:game.findDisallowedPoints(piece)
                        };
                        var isCastlingAvailable = game.isCastlingAvailableForPiece(piece);
                        if(isCastlingAvailable){
                            var castlingRooks = game.findCastlingAvailableRooks();
                            if(castlingRooks.length){
                                stylePoints.castlingAvailable = [];
                                for(var i=0;i<castlingRooks.length;i++){
                                    var rook = castlingRooks[i];
                                    var movable = rook.castlingPoint[piece.type];
                                    stylePoints.castlingAvailable.push(movable);
                                    stylePoints.movable.push(movable);
                                }
                            }
                        }

                        for(var style in stylePoints){
                            if(!stylePoints.hasOwnProperty(style)) continue;
                            board.board('style', {
                                add:style,
                                points:stylePoints[style]
                            });
                        }

                        if(game.isMovablePiece(piece)){
                            piece.elm.addClass('selectable');
                        }
                        return board;
                    case 'pieceHoverOut':
                        options.piece.elm.removeClass('selectable');
                        if(!board.is('.on-select')){
                            board.board('style', {
                                remove:['movable', 'attackable', 'checkable', 'disallowed', 'castlingAvailable']
                            });
                        }
                        return board;
                    case 'pieceClick':
                        game = board.data('game');
                        piece = $(options.piece);
                        if(piece.is('.selected')){
                            center = piece.center();
                            $('tr > td > .square', board).each(function(){
                                var  square = $(this);
                                if(square.contains(center.x, center.y)){
                                    square.trigger('click');
                                }
                            });
                            piece.removeClass('selectable');
                        } else {
                            var isMovable = game.isMovablePiece(piece.data('piece'))
                                    && game.owner === piece.data('piece').color;
                            if(isMovable){
                                board.board('select', {piece:piece});
                                board.board('highlightKing', {pinch:false});
                            }
                        }
                        return board;
                }

                return board;
            },
            gameoverPanel:function(command, options){
                if(typeof command != 'string'){
                    options = command;
                    command = 'init';
                }
                var panel = $(this);
                switch (command){
                    case 'init':
                        panel.addClass('gameover-panel')
                            .append('<h1/>')
                            .hide();
                        return panel;
                    case 'show':
                        panel.fadeIn();
                        var message;
                        if(options.draw){
                            message = 'draw';
                        } else {
                            message = 'you ' + (options.win? 'win':'lose');
                        }
                        $('h1', panel).text(message);
                        return panel;
                }
                return panel;
            },
            playBox:function(command, options){
                if(typeof command != 'string'){
                    options = command;
                    command = 'init';
                }
                var box = $(this);
                switch(command){
                    case 'init':
                        $('<div/>').appendTo(box).board();
                        return box;
                    case 'start':
                        var game = new CH.game.Game(options.data);
                        game.checkmate = function(winner){
                            box.playBox('gameover', {
                                winner:winner
                            });
                        };
                        game.draw = function(){
                            box.playBox('gameover');
                        };
                        box.data('game', game);
                        var board = $('.board', box).board('load', {
                            game:game
                        }).attr('data-message', 'you');
                        if(options.vs === 'human') return box;
                        var ai = new CH.ai.AI(game);
//                        ai.debug = true;//FIXME
                        var think = ai.think;
                        ai.think = function(){
                            board.attr('data-message', 'ai');
                            //delay ai think for user animation
                            setTimeout(function(){
                                think.call(ai);
                            }, 100);
                        };
                        ai.move = function(piece, point){
                            var square = board.board('find', point);
                            board.board('move', {
                                piece:piece.elm.piece('select'),
                                square:square,
                                duration:600,
                                callback:function(){
                                    setTimeout(function(){
                                        board.attr({
                                            'data-owner':'user',
                                            'data-message':'you'
                                        });
                                        board.board('highlightKing', {pinch:game.checked});
                                        game.cache.clear();
                                    }, 300);
                                }
                            }).removeAttr('data-message');
                        };
                        var color = ai.color.toString();
                        var askPromotion = game.askPromotion[color];
                        game.askPromotion[color] = function(piece){
                            var type = askPromotion.call(this, piece);
                            board.board('promote', {
                                piece:piece,
                                type:type
                            });
                            return null;
                        };
                        game.askCastling[color] = function(move){
                            board.board('castling', {
                                move:move
                            });
                            return null;
                        };

                        return box;
                    case 'gameover':
                        board = $('.board', box).addClass('covered transparent');

                        var gameoverPanel = $('.gameover-panel', board);
                        if(!gameoverPanel.size()){
                            gameoverPanel = $('<div/>').appendTo(board)
                                .gameoverPanel();
                        }
                        setTimeout(function(){
                            var winner = options && options.winner;
                            var win = winner && (winner === settings.playerColor);
                            gameoverPanel.gameoverPanel('show', {
                                win:win,
                                draw:!winner
                            });
                        }, 800);
                        return box;
                }


                return box;
            }
        }
    })($.sub());
    $.fn.extend(plugin);
})(jQuery);