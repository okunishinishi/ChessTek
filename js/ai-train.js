var debugLevel = 5;
CH.game.Game.prototype.getResult = function(winner){
   var s = this;
    return {
        winner:winner,
        phase:s.phase,
        white:s.troop[CH.enum.Color.WHITE].pieces.length,
        black:s.troop[CH.enum.Color.BLACK].pieces.length
    }
};
CH.train = {
    AITrain:CH.define({
        init:function(strategyAdjust, callback){
            var s = this;
            var data = CH.test.getData();
            s.callback = callback;
            var game = new CH.game.Game(data);
            game.checkmate = function(winner){
                var result = game.getResult(winner.toString());
                result.success = (winner === CH.enum.Color.BLACK);
                callback.call(this, 'checkmate', result);
            };
            game.draw = function(){
                var result = game.getResult();
                callback.call(this, 'draw', result);
            };
            s.white = s.createAI(game, CH.enum.Color.WHITE);

            var prefer = $.extend({}, CH.ai.getDefaultPreference());
            for(var key in prefer.strategyWeight){
                if(!prefer.strategyWeight.hasOwnProperty(key))continue;
                if(!strategyAdjust.hasOwnProperty(key)) continue;
                prefer.strategyWeight[key] += strategyAdjust[key];
            }
            s.black = s.createAI(game, CH.enum.Color.BLACK, prefer);


        },
        property:{
            start:function(){
                var s = this;
                s.white.think();
            },
            createAI:function(game, color, prefer){
                var ai = new CH.ai.AI(game, color, prefer);
                var move = ai.move;
                ai.move = function(piece, point){
                    if(debugLevel > 10) console.log('game.phase', game.phase, piece.type, point.toString(), game.ownerTroop.pieces.length, game.enemyTroop.pieces.length);
                    if(game.phase > 500){
                        var result = game.getResult();
                        s.callback.call(this, 'to long', result);

                    }
                    return move.apply(this, arguments);
                };
                return ai;
            }
        }
    }),
    Adjustment:CH.define({
        init:function(accumulation){
            var s = this;
            s.accumulation = $.extend({}, accumulation);
        },
        property:{
            makeTrial:function(key, amount){
                var s = this;
                s.trial = $.extend({}, s.accumulation);
                s.trial[key] = (s.trial[key] || 0) + amount;
                return s.trial;
            },
            commitTrail:function(){
                var s = this;
                s.accumulation = s.trial;
                s.discardTrail();
            },
            discardTrail:function(){
                var s = this;
                s.trial = null;
            }
        },
        toString:function(){
//            var s = this;
        }
    })
};

(function($){
    var plugin = {
        mappedString:function(obj){
            var html = "{";
            $.each(obj, function(key, data){
                html += "<span class='" + key + "'>";
                html += "<span class='key'>" + key + '</span>';
                html += ':';
                html += "<span class='value'>" + data + '</span>';
                html += "</span>";
                html += ',  ';
            });
            html = html.replace(/,$/, '');
            html += '}';
            return $(this).html(html);
        },
        recordListItem:function(success, data){
            var item = $(this);
            item.addClass(success).addClass('record-list-item');
            $('<span/>').mappedString(data).appendTo(item);
            return item;
        },
        adjustListItem:function(flg, data){
            var item = $(this);
            item.addClass(flg).addClass('adjust-list-item');
            data.result = flg?'success':'failed';
            $('<span/>').mappedString(data).appendTo(item);
            return item;
        }

    };
    $.fn.extend(plugin);

})(jQuery);

var strategyKeys = (function(preference){
    var result = [];
    $.each(preference, function(key){
        result.push(key);
    });
    return result;
})(CH.ai.getDefaultPreference().strategyWeight);

function toStorage(key, obj){
    var string = JSON.stringify(obj);
    localStorage.setItem(key, string);
}
function fromStorage(key){
    var string = localStorage.getItem(key);
    try{
        return JSON.parse(string);
    } catch (e){
    }
    return string;
}

$(function(){
    function toString(obj){
        var html = "{";
        $.each(obj, function(key, data){
            html += "<span class='key'>" + key + '</span>';
            html += ':';
            html += "<span class='value' data-value='" + data + "'>" + data + '</span>';
            html += ', ';
        });
        html = html.replace(/,$/, '');
        html += '}';
        return html;
    }




    function execute(accumulation, finish){
        var adjustment = new CH.train.Adjustment(accumulation);
        var tryKey = strategyKeys.getRandom(), tryAmount = 10;
        if((Math.random() > Math.random())) tryAmount *= -1;
        var trial = adjustment.makeTrial(tryKey, tryAmount);
        new CH.train.AITrain(trial, function(result, data){
            if(debugLevel > 2) console.log(result, 'winner:'   , data.winner);

            data.adjust = toString(trial);


            $('<li/>').recordListItem(data.success, data)
                .appendTo(recordList);
            $('<li/>').adjustListItem(data.success, {
                tried:(tryKey + ' ' + tryAmount)
            }).appendTo(adjustList);
            if(data.success){
                adjustment.commitTrail();
            } else {
                adjustment.discardTrail();
            }
            toStorage('prefer', adjustment.accumulation);
            if(debugLevel > 6) console.log('prefer', fromStorage('prefer'));


            finish.call(this, adjustment.accumulation);
        }).start();
    }

    var resultList = $('#result-list'), recordList = $('#record-list'), adjustList = $('#adjust-list');
    var html = fromStorage('html'), htmlLength = 10000;
    if(html){
        resultList.html(html['resultList'].substr(- htmlLength));
        recordList.html(html['recordList'].substr(- htmlLength));
        adjustList.html(html['adjustList'].substr(- htmlLength));
    }


    var timer = setTimeout(function(){
        location.reload()
    }, 300000);

    var start = function(status){
        $('#message').text('simulating...');
        var accumulation = fromStorage('accumulation');
        console.log('accumulation', accumulation);
        execute(accumulation, function(accumulation){
            $('#message').text('');
            $('<span/>').mappedString(accumulation).appendTo(resultList).wrap('<li/>');
            status.count = status.count + 1;
            toStorage(('result-' + status.count), accumulation);
            var html = {
                resultList:resultList.html(),
                recordList:recordList.html(),
                adjustList:adjustList.html()
            };
            toStorage('html', html);
            toStorage('accumulation', accumulation);
            if(status.count < status.max){
                toStorage('status', status);
                location.reload();
            } else{
                toStorage('status', null);
                $(this).removeClass('disabled');
                clearTimeout(timer);
            }

        });
    };
    $('#start-btn').click(function(){
        var btn = $(this);
        if(btn.is('.disabled')) return;
        btn.addClass('disabled');
        var status = {
            max:parseInt($('#battle-count').val()) || 1,
            count:0
        };
        toStorage('status',  status);
        toStorage('accumulation', new CH.train.Adjustment().accumulation);
        start(status);
    });

    var status = fromStorage('status');
    if(status){
        $('#start-btn').hide();
        $('#battle-count').hide();
        start(status);
    } else {

    }
    $('#show-storage-btn').click(function(){
        var a = $(this);
        $('#storage-list').remove();
        var ul = $('<ul/>').insertAfter(a)
            .attr('id', 'storage-list')
            .wrap('<fieldset/>')
            .before('<legend>in storage</legend>');


        var sum = {};
        for(var i=1; i<10000; i++){
            var data = fromStorage('result-' + i);
            if(!data) break;

            for(var key in data){
                if(data.hasOwnProperty(key)){
                    if(sum[key]){
                        sum[key] = sum[key] + data[key];
                    } else {
                        sum[key] = data[key];
                    }
                }
            }

        }
        var span = $('<span/>').mappedString(sum).appendTo(ul);
        span.html(span.html().replace(/\{/, '{<span class=line>'));
        span.html(span.html().replace(/,/g, ',</span><span class=line>'));
        span.html(span.html().replace(/\}/, '</span>}'));
        span.wrap('<li/>');
    });
});
