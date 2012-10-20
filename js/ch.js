CH = (function(){
    var CH = {};
    CH.define = function(def){
        var func = def.init || function(){};
        if(def.prototype) func.prototype = new def.prototype();
        for(var key in def.property){
            if(def.property.hasOwnProperty(key)){
                func.prototype[key] = def.property[key];
            }
        }
        return func;
    };

    CH.extend = function(obj, def){
        for(var key in def){
            if(!def.hasOwnProperty(key)) continue;
            obj.prototype[key] = def[key];
        }
    };

    CH.extend(Array, {
        getRandom:function(){
            var s = this;
            var index = Math.round(Math.random() * (s.length - 1));
            return s[index];
        },
        contains:function(elm){
            var s = this;
            for(var i=0; i< s.length; i++){
                if(s[i] === elm) return true;
                if(elm.equals && elm.equals(s[i])) return true;
            }
            return false;
        },
        isEmpty:function(){
            var s =this;
            return s.length === 0;
        },
        clone:function(){
            var s =this, clone = [];
            for(var i=0; i< s.length; i++){
                var entry = s[i];
                clone.push(entry.clone?entry.clone():entry);
            }
            return clone;
        }
    });



    CH.Point = CH.define({
        init:function(row, column){
            var s = this;
            s.row = row;
            s.column = column;
        },
        property:{
            move:function(r, c){
                var s = this;
                s.row += r;
                s.column += c;
                return s;
            },
            isValid:function(){
                var s = this;
                return 0 <= s.row && s.row < 8
                    && 0 <= s.column && s.column < 8;
            },
            equals:function(point){
                var s =this;
                return s.row === point.row
                    && s.column === point.column;
            },
            approach:function(point){
                var s = this;
                if(s.row > point.row) s.row--;
                if(s.row < point.row) s.row++;
                if(s.column > point.column) s.column--;
                if(s.column < point.column) s.column++;
            },
            clone:function(){
                var s = this;
                return new CH.Point(s.row, s.column);
            },
            toString:function(){
                var s = this;
                return '{' + s.row + ',' + s.column + '}';
            }
        }
    });
    CH.LINE = CH.define({
        init:function(from, to){
            var s = this;
            s.from = from;
            s.to = to;
            s.cache = {};
        },
        property:{
            contains:function(point){
                var s = this;
                var row = s.from.row, column = s.from.column;
                while(row < s.to.row && column < s.to.column){
                    if(point.equals(new CH.Point(row, column))){
                        return true;
                    }
                    if(row < s.to.row) row++;
                    if(row < s.to.column) column++;
                }
                return false;
            },
            getPoints:function(){
                var s = this;
                if(s.cache.points) return s.cache.points;
                var point = s.from.clone();
                var points = [point.clone()];
                while(!point.equals(s.to)){
                    point.approach(s.to);
                    points.push(point.clone());
                }
                s.cache.points = points;
                return points;
            },
            toString:function(){
                var s = this;
                return '{from:' + s.from.toString() + ', to:' + s.to.toString() + '}';
            }
        }
    });

    return CH;
})();