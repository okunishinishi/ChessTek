CH.record = (function(){
    var Phase = CH.define({
        init:function(whitePieces, blackPieces){
            var s  = this;
            s.pieces = {};
            s.pieces[CH.enum.Color.WHITE] = whitePieces;
            s.pieces[CH.enum.Color.BLACK] = blackPieces;

        },
        property:{

        }
    });
    var Record = CH.define({
        init:function(data){
            var s = this;
            s.phase = [];
            for(var i=0; i<data.length; i++){
                if(data[i] instanceof Phase){
                    s.phase[i] = data[i];
                } else {

                }
            }
        },
        property:{
            getPhase:function(index){
                var s = this;
                return s.phase[index];
            }
        }
    });
    var ChoiceRecord = CH.define({
        init:function(){
            var s = this;
            s.choices = [];
        },
        property:{
            add:function(choice){
                var s = this;
                if(choice.toString) choice = choice.toString();
                s.choices.push(choice);
            },
            clone:function(){
                var s = this, clone = new ChoiceRecord();
                clone.choices = s.choices.clone();
                return clone;
            }
        }

    });
    return {
        Phase:Phase,
        Record:Record,
        ChoiceRecord:ChoiceRecord
    }
})();