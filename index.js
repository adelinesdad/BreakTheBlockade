var blue = [[7,6], [11,4],[11,8],[15,6]];
var red = [[1,6], [11,6,1], [16,1], [16, 11]];
var castleSpaces = [[9,6],[10,5],[10,7],[11,6],[12,5],[12,7],[13,6]];
var turn;
var selectedElem;
var selectedPos;
var movesLeft;
var roundsRemaining;
var gameOver;

function elemAtPos(pos) {
    var id = "r" + pos[0] + "c" + pos[1];
    var elem = document.getElementById(id);
    return elem;
}

function getElemPos(elem) {
    var id = elem.id;
    var row = id.substring(1, id.indexOf('c'));
    var col = id.substring(id.indexOf('c') + 1);
    return [parseInt(row), parseInt(col)];
}

function updateGameInfo() {
    document.getElementById('game-info').classList.remove('blue', 'red');
    document.getElementById('game-info').classList.add(turn);
    document.getElementById('game-info-turn').innerHTML = turn;
    document.getElementById('game-info-moves-left').innerHTML = movesLeft;
    document.getElementById('game-info-rounds-remaining').innerHTML = roundsRemaining;
}

function startGame() {
    blue.forEach(pos => elemAtPos(pos).classList.add('blue'));
    red.forEach(pos => { 
        var elem = elemAtPos(pos);
        elem.classList.add('red'); 
        if (pos[2]) {
            elem.classList.add('king');
        }
    });
    turn = "red";
    selectedElem = undefined;
    selectedPos = undefined;
    movesLeft = 3;
    roundsRemaining = 10;
    gameOver = false;
    updateGameInfo();
}

function hasPiece(elem, color) {
    if ((!color || color === 'red') && elem.classList.contains('red')) {
        return true;
    }
    if ((!color || color === 'blue') && elem.classList.contains('blue')) {
        return true;
    }
    if (color === 'king' && elem.classList.contains('king')) {
        return true;
    }
    return false;
}

function getAdjacentPositions(pos, color) {
    var adjacentPositions = [
        [pos[0]-1,pos[1]-1],
        [pos[0]-1,pos[1]+1],
        [pos[0]+1,pos[1]-1],
        [pos[0]+1,pos[1]+1],
        [pos[0]-2,pos[1]],
        [pos[0]+2,pos[1]],
    ];

    return adjacentPositions.filter(adjacentPos => { 
        var elem = elemAtPos(adjacentPos);
        return elem && hasPiece(elem, color); 
    });
}

function canMoveFrom(pos) {
    if (turn === 'blue') {
        return true;
    }
    var elem = elemAtPos(pos);
    return !elem.classList.contains('immobile');
}

function selectElement(elem, pos) {
    if (!hasPiece(elem, turn)) {
        alert('invalid selection');
        return;
    }
    if (!canMoveFrom(pos)) {
        alert('you cannot move this piece');
        return;
    }
    selectedElem = elem; 
    selectedPos = pos;
    elem.classList.add('selected');
}

function unselectElement() {
    selectedElem.classList.remove('selected');
    selectedElem = undefined; 
    selectedPos = undefined;
}

function signalGameOver(message) {
    alert(message);
    gameOver = true;
}

function checkForImmobilityAndCapture(makeMobileOnly) {
    var mobileRed = 0;
    Array.prototype.forEach.call(document.getElementsByClassName('cell'), elem => {
        if (hasPiece(elem, "red")) {
            var redPos = getElemPos(elem);
            var capturingBlue = getAdjacentPositions(redPos, "blue").filter(bluePos => getAdjacentPositions(bluePos, "red").length < 2);
            if (capturingBlue.length > 1 && !hasPiece(elem, 'king')) {
                if (!makeMobileOnly) {
                    alert('piece at position [' + redPos[0] + ',' + redPos[1] + '] is captured.');
                    elem.classList.remove("red");
                }
            } else if (capturingBlue.length > 0) {
                if (!makeMobileOnly) {
                    elem.classList.add('immobile');
                }
            } else {
                mobileRed++;
                elem.classList.remove('immobile');
            }
        }
    });
    return mobileRed;
}

function endTurn() {
    setTimeout(() => {
        var mobileRed = checkForImmobilityAndCapture(false);
        if (mobileRed === 0) {
            signalGameOver('All red pieces are captured or are immobile. Blue wins!');
            return;
        }
        if (turn === "red") {
            roundsRemaining--;
            if (roundsRemaining === 0) {
                updateGameInfo();
                signalGameOver('No more rounds remaining. Blue wins!');
                return;
            }
            turn = "blue";
            movesLeft = 1;
        } else {
            turn = "red";
            movesLeft = 3;
        }
        updateGameInfo();
    }, 0);
}

function isCastleSpace(pos) {
    return castleSpaces.filter(castlePos => castlePos[0] === pos[0] && castlePos[1] === pos[1]).length > 0;
}

function moveSelectedTo(pos) {
    var moves = 0;
    var destElem = elemAtPos(pos);
    if (hasPiece(destElem) && (turn !== "red" || !hasPiece(destElem, 'king'))) {
        alert('invalid move');
        return;
    }
    var isking = hasPiece(selectedElem, 'king');
    if (isking && !isCastleSpace(pos)) {
        alert('cannot move king outside of castle area');
        return;
    }
    if (turn === "blue" && isCastleSpace(pos)) {
        alert('cannot move blue piece into castle area');
        return;
    }
    var rowDiff = pos[0] - selectedPos[0];
    var colDiff = pos[1] - selectedPos[1];
    if (colDiff === 0) {
        // vertical move
        moves = Math.abs(rowDiff) / 2;
    } else if (Math.abs(rowDiff) === Math.abs(colDiff)) {
        // diagonal move
        moves = Math.abs(rowDiff);
    }
    if (moves > 0 && moves <= movesLeft) {
        // check for a piece in the way
        for (var i=1;i<moves;i++) {
            var midPos = [selectedPos[0] + (rowDiff * i / moves), selectedPos[1] + (colDiff * i / moves)];
            var midElem = elemAtPos(midPos);
            if (midElem && hasPiece(midElem)) {
                alert('invalid move');
                return;
            }
        }

        // check for red win condition
        if (turn === "red" && hasPiece(destElem, 'king')) {
            signalGameOver('red wins!');
            return;
        }
        destElem.classList.add(turn);
        if (isking) {
            destElem.classList.add('king');
        }
        selectedElem.classList.remove(turn, "king");
        movesLeft -= moves;
        unselectElement();
        if (movesLeft === 0) {
            endTurn();
        }
        updateGameInfo();
        checkForImmobilityAndCapture(true);
    } else {
        alert('invalid move');
    }
}

function onClick(row, col) {
    if (gameOver) {
        return;
    }
    var pos = [row, col];
    var elem = elemAtPos(pos);
    if (selectedElem === undefined) {
        selectElement(elem, pos);
    } else if (elem === selectedElem) {
        unselectElement();
    } else {
        moveSelectedTo(pos);
    }
}