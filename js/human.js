$(function(){
    var playBox = $('#play-box').playBox({});
    playBox.playBox('start', {
        data:CH.test.data,
        vs:'human'
    });

});