CH.enum = (function(){
    var e = {};
    var Obj = CH.define({
        init:function(str){
            var s = this;
            s.str = str;
        },
        property:{
            opposite:null,
            toString:function(){
                var s = this;
                return s.str;
            },
            invert:function(){
                var s = this;
                return s.opposite;
            }
        }
    });

    e.Color  = {
       WHITE:new Obj('white'),
       BLACK:new Obj('black')
    };
    e.Color.WHITE.opposite = e.Color.BLACK;
    e.Color.BLACK.opposite = e.Color.WHITE;

    e.Dir = {
        TOP:new Obj('top'),
        RIGHT:new Obj('right'),
        BOTTOM:new Obj('bottom'),
        LEFT:new Obj('left')
    };
    e.Dir.TOP.opposite = e.Dir.BOTTOM;
    e.Dir.BOTTOM.opposite = e.Dir.TOP;
    e.Dir.RIGHT.opposite = e.Dir.LEFT;
    e.Dir.LEFT.opposite = e.Dir.RIGHT;

    return e;
})();