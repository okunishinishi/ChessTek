$(function(){
    var playBox = $('#play-box').playBox();
    playBox.playBox('start', {data:CH.test && CH.test.getData()});
    $('.square .piece', playBox).hide();

    var startCover = $('#start-cover');
    startCover.click(function(){
        $('a', startCover).remove();
        startCover.addClass('active');
        var timer = setInterval(function(){
            var hiddenPiece = $('.square .piece:hidden', playBox);
            hiddenPiece.eq(0).show();
            hiddenPiece.filter(':last').show();
            if($('.square .piece:hidden', playBox).size() === 0){
                clearTimeout(timer);
                setTimeout(function(){
                    startCover.remove();
                    var i=0;
                    var highlightTimer = setInterval(function(){
                        playBox.toggleClass('highlight');
                        if(i++>4){
                            playBox.removeClass('highlight');
                            clearTimeout(highlightTimer);
                        }
                    }, 190);
                }, 300);
            }
        }, 5);
    });


    $('.board', playBox).append(startCover);


});