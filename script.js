let pieces = [];
let pieceWidth = 100;
let pieceHeight = 100;
let currentPiece = null;
let isDragging = false;
let canvas;
let ctx;
let puzzleImage;
let dropZones = [];
let clickSound = new Audio('sound.wav');


window.onload = function() {
    let previewImageElement = document.getElementById('previewImage');
    let previewImage = new Image();
    previewImage.src = previewImageElement.src;

    previewImage.onload = function() {
        let canvas = document.getElementById('puzzleCanvas');
        let ctx = canvas.getContext('2d');
        ctx.drawImage(previewImage, 0, 0, canvas.width, canvas.height);
    };
};

function drawPuzzle() {
    canvas.width = puzzleImage.width * 1;
    canvas.height = puzzleImage.height * 1;
    ctx.drawImage(puzzleImage, 0, 0, puzzleImage.width, puzzleImage.height, 0, 0, canvas.width / 4, canvas.height / 4);

    let x = 0;
    let y = 0;

    for (let i = 0; i < puzzleImage.width; i += pieceWidth) {
        for (let j = 0; j < puzzleImage.height; j += pieceHeight) {
            let piece = { x: x, y: y, sx: i, sy: j, isDragging: false, connectedTo: [] };
            pieces.push(piece);
            ctx.drawImage(puzzleImage, i, j, pieceWidth, pieceHeight, x, y, pieceWidth, pieceHeight);
            x += pieceWidth;
        }
        for (let i = 0; i < puzzleImage.width; i += pieceWidth) {
            for (let j = 0; j < puzzleImage.height; j += pieceHeight) {
                let dropZone = { x: i, y: j, sx: i, sy: j, width: pieceWidth, height: pieceHeight };
                dropZones.push(dropZone);
            }
        }
        y += pieceHeight;
        x = 0;
    }
}



function redrawPieces() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < dropZones.length; i++) {
        let dropZone = dropZones[i];
        ctx.strokeRect(dropZone.x, dropZone.y, dropZone.width, dropZone.height);
    }
    for (let i = 0; i < pieces.length; i++) {
        let piece = pieces[i];
        ctx.globalAlpha = piece.isDragging ? 0.6 : 1;
        ctx.drawImage(puzzleImage, piece.sx, piece.sy, pieceWidth, pieceHeight, piece.x, piece.y, pieceWidth, pieceHeight);
        for (let j = 0; j < piece.connectedTo.length; j++) {
            let connectedPiece = piece.connectedTo[j];
            ctx.drawImage(puzzleImage, connectedPiece.sx, connectedPiece.sy, pieceWidth, pieceHeight, connectedPiece.x, connectedPiece.y, pieceWidth, pieceHeight);
        }
    }
}

document.addEventListener("DOMContentLoaded", function () {
    canvas = document.getElementById("puzzleCanvas");
    ctx = canvas.getContext("2d");

    puzzleImage = new Image();
    puzzleImage.src = "./image.jpg";
    puzzleImage.onload = drawPuzzle;

    canvas.addEventListener("mousedown", function (e) {
        let rect = canvas.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
    
        for (let i = 0; i < pieces.length; i++) {
            if (
                x > pieces[i].x &&
                x < pieces[i].x + pieceWidth &&
                y > pieces[i].y &&
                y < pieces[i].y + pieceHeight
            ) {
                currentPiece = pieces[i];
                isDragging = true;
                currentPiece.isDragging = true;
                clickSound.play();
    
                break;
            }
        }


    });

    function getNearestDropZone(piece) {
        let nearestDropZone = null;
        let nearestDistance = Infinity;
    
        for (let i = 0; i < dropZones.length; i++) {
            let dropZone = dropZones[i];
    
            if (
                piece.x >= 0 &&
                piece.x + pieceWidth <= canvas.width &&
                piece.y >= 0 &&
                piece.y + pieceHeight <= canvas.height
            ) {
                let dx = dropZone.x - piece.x;
                let dy = dropZone.y - piece.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
    
                if (distance < nearestDistance) {
                    nearestDropZone = dropZone;
                    nearestDistance = distance;
                }
            }
        }
    
        return nearestDropZone;
    }

    canvas.addEventListener("mousemove", function (e) {
        if (isDragging) {
            let rect = canvas.getBoundingClientRect();
            let dx = e.clientX - rect.left - currentPiece.x;
            let dy = e.clientY - rect.top - currentPiece.y;
            currentPiece.x += dx;
            currentPiece.y += dy;
            moveConnectedPieces(currentPiece, dx, dy);
        }
    });

    function moveConnectedPieces(piece, dx, dy) {
        for (let i = 0; i < piece.connectedTo.length; i++) {
            let connectedPiece = piece.connectedTo[i];
            connectedPiece.x += dx;
            connectedPiece.y += dy;
            moveConnectedPieces(connectedPiece, dx, dy);
        }
    }

    canvas.addEventListener("mouseup", function () {
        if (isDragging) {
            currentPiece.isDragging = false;
            let nearestDropZone = getNearestDropZone(currentPiece);
            if (nearestDropZone) {
                let isOccupied = pieces.some(piece => piece.x === nearestDropZone.x && piece.y === nearestDropZone.y);
                if (!isOccupied) {
                    currentPiece.x = nearestDropZone.x;
                    currentPiece.y = nearestDropZone.y;
                }
            }
    
            isDragging = false;
            currentPiece = null;
        }
    });

    function animate() {
        redrawPieces();
        requestAnimationFrame(animate);
    }

    animate();

    document.getElementById('changeImage').addEventListener('click', function() {
        let input = document.getElementById('imageUpload');
        let file = input.files[0];
    
        if (file) {
            let reader = new FileReader();
    
            reader.onload = function(e) {
                let img = new Image();
    
                img.onload = function() {

                    let tempCanvas = document.createElement('canvas');
                    let tempCtx = tempCanvas.getContext('2d');
                    tempCanvas.width = puzzleImage.width;
                    tempCanvas.height = puzzleImage.height;
                    tempCtx.drawImage(img, 0, 0, img.width, img.height, 0, 0, tempCanvas.width, tempCanvas.height);
                    let resizedImage = new Image();
                    resizedImage.src = tempCanvas.toDataURL();
    
                    resizedImage.onload = function() {
                        puzzleImage = resizedImage;
                        document.getElementById('previewImage').src = resizedImage.src;
                        pieces = [];
                        dropZones = [];
                        drawPuzzle();
                    };
                };
    
                img.src = e.target.result;
            };
    
            reader.readAsDataURL(file);
        }
    });

    
});


