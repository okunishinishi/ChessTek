CH.test = {};

CH.test.getData = function(){


    return null;



    var p = CH.piece, r = CH.record;

    var insufficient = [
        new r.Phase([
            new p.King(7,2),
            new p.Knight(7,4)
        ],[
            new p.King(2,2)
        ]),
        new r.Phase([
            new p.King(7,2),
            new p.Bishop(7,4)
        ],[
            new p.King(2,2)
        ]),
        new r.Phase([
            new p.King(7,2),
            new p.Bishop(7,4)
        ],[
            new p.Bishop(3,4),
            new p.King(2,2)
        ])
    ];

    var promote = [
        new r.Phase([
            new p.King(7,2),
            new p.Pawn(2,3),
            new p.Pawn(2,4)
        ],[
//            new p.Queen(0,2),
            new p.King(2,2),
            new p.Pawn(5,5),
            new p.Pawn(5,6)
        ])
    ];



    var disallowed = [
        new r.Phase([
            new p.King(7,2)
        ],[
            new p.King(5,2)
        ]),
        new r.Phase([
            new p.King(7,7),
            new p.Rook(7,2)
        ],[
            new p.King(4,2),
            new p.Bishop(5,2)
        ]),
        new r.Phase([
            new p.King(7,2),
        ],[
            new p.King(5,2),
            new p.Pawn(6,2)
        ])
    ];

    var castling = [
        new r.Phase([
            new p.King(7,4),
            new p.Rook(7,0),
            new p.Rook(7,7)
        ],[
            new p.King(0,4),
            new p.Rook(0,0),
            new p.Rook(0,6)
        ]),
        new r.Phase([
            new p.King(1,2),
            new p.Rook(1,1)
        ],[
            new p.King(0,4),
            new p.Rook(0,0),
            new p.Rook(0,7)
        ])
    ]


    var enPassant = [
        new r.Phase([
            new p.Pawn(3,1),
            new p.Pawn(3,3),
            new p.Pawn(3,5),
            new p.Pawn(3,7),
            new p.King(7,5)
        ],[
            new p.Pawn(1,0),
            new p.Pawn(1,2),
            new p.Pawn(1,4),
            new p.Pawn(1,6)
        ])
    ]

    var checkMate = [
        new r.Phase([
            new p.Pawn(3,1),
            new p.Pawn(6,5),
            new p.King(7,5)
        ],[
            new p.Rook(1,0),
            new p.Queen(1,2),
            new p.Queen(1,4),
            new p.Queen(1,5),
            new p.Queen(1,6),
            new p.King(1,7)
        ])
    ]



    var tryPhase = new CH.record.Phase([
//        new p.Bishop(7, 2),
        new p.Queen(7, 4),
        new p.Rook(5, 3),
        new p.King(6, 3)
//        new p.Pawn(1, 7)
    ],[
//        new p.Bishop(0, 2),
        new p.King(1, 5)
//        new p.Rook(1, 2),
//        new p.Rook(1, 3),
//        new p.Rook(1, 4)
    ]);


    var phase;
    phase = tryPhase;

//    phase = insufficient[1];
//    phase = insufficient[2];


//
    phase = enPassant[0];

    phase = promote[0];


//    phase = disallowed[0];



    phase = insufficient[0];

    phase = castling[1];

    phase = checkMate[0];


    var giveUp = [
        new r.Phase([
            new p.Pawn(5,5),
            new p.King(7,5)
        ],[
            new p.King(1,5),
            new p.Rook(1,0),
            new p.Queen(1,2),
            new p.Bishop(1,4)
        ])
    ]

    phase = giveUp[0];

    return new CH.record.Record([phase]);
};