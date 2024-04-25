import express         from 'express';
import {fileURLToPath} from 'url';
import path            from 'path';
import {createCanvas, GlobalFonts} from '@napi-rs/canvas';

const app = express();
app.listen(3000);
app.use('/diagram', (req, res)=>{

    const fen    = req.query.fen,
          rev    = req.query.rev    == '1',
          inline = req.query.inline == '1',
          sz     = req.query.size ?? 800;
          
    if (!fen)
        return res.status(400).send('Invalid FEN');

    const size = parseInt(sz);
    if (isNaN(size) || (size < 0) || (size > 2000))
        return res.status(400).send('Size should be a positive integer');

	const buffer = draw(fen, rev, size);
 
    res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': buffer.length,
        'Content-disposition': inline ? 'inline' : `attachment; filename="${Date.now()}.png"`
    });
    res.end(buffer);
});

/**
 * Create the canvas, draw the board and pieces, then convert to PNG.
 * @param {string}  fen  FEN string 
 * @param {boolean} rev  if true, draw the board reversed 
 * @param {number}  size board size in pixels 
 * @return {buffer} buffer containing the PNG
 */
function draw(fen, rev, size) {
	const fPath1 = path.join('public', 'casefont.ttf'),
          fPath2 = path.join('public', 'roboto.ttf'),
          canvas = createCanvas(size, size),
          sqSize = size/8,
          ctx    = canvas.getContext('2d');

    GlobalFonts.registerFromPath(fPath1, 'Chess');
    GlobalFonts.registerFromPath(fPath2, 'Board');
    drawBoard(ctx, rev, sqSize);
    drawPieces(ctx, fen, rev, sqSize);

    return canvas.toBuffer('image/png');
}

/**
 * Expand a FEN string into a 64-char array.
 * FEN strings look like this: `2r3k1/p4p2/3Rp2p/1p2P1pK/8/1P4P1/P3Q2P/1q6 b - - 0 1`
 * Note that we're only interested in the first group (before the first space).
 * The rest 
 * @param  {string} fen FEN string
 * @return {string[]} board representation as a 64-element array
 */
function parseFEN(fen) {
    // create a 64-element array and fill it with spaces
    const board = [...new Array(64)].map(_n=>' ');

	let row = 0,
	    col = 0;

	for (const chr of fen.split(' ')[0]) {
        // last row?
		if (row > 7)
			break;

        // skip to next row?
		if (chr == '/' || col > 7) {
			row++;
			col = 0;
			continue;
		}

        // skip column?
		if ('12345678'.includes(chr)) {
			col += parseInt(chr);
		}
		else
        // valid piece symbol?
		if ('kqrnbpKQRNBP'.includes(chr)) {
			board[row*8+col] = chr;
			col++;
		}
	}

	return board;
}

/**
 * Draw the board.
 * @param {CanvasRenderingContext2D} ctx canvas context
 * @param {boolean}                  rev true for a reversed board (black down)
 * @param {number}                   sqSize square size
 */
function drawBoard(ctx, rev, sqSize) {
	const letters    = 'abcdefgh',
	      darkColor  = '#b5876b',
	      liteColor  = '#f0dec7',
	      fontSize   = Math.floor(sqSize/4);

	for (let i=0; i<64; i++) {
		const [row, col] = sqToCoords(i, rev);

		ctx.fillStyle = ((row + col) % 2 === 1) ? darkColor : liteColor;
		ctx.fillRect(col*sqSize, row*sqSize, sqSize, sqSize);

		ctx.font         = `${fontSize}px Board`;
		ctx.textBaseline = 'top';
		ctx.fillStyle    = '#000';

		if (col == 0)
			ctx.fillText((rev?row+1:8-row).toString(), col*sqSize+2, row*sqSize+2);

		if (row == 7)
			ctx.fillText(letters[rev?7-col:col], (col+1)*sqSize-fontSize/1.4, (row+1)*sqSize-fontSize*1.4);
	}
}

/**
 * Draw the pieces on the board.
 * @param {CanvasRenderingContext2D} ctx    canvas context
 * @param {string}                   fen    FEN string
 * @param {boolean}                  rev    reverse board?
 * @param {number}                   sqSize square size
 */
function drawPieces(ctx, fen, rev, sqSize) {
	const board    = parseFEN(fen),
	      fontSize = sqSize - 4;

	ctx.font         = `${fontSize}px/${sqSize}px Chess`;
	ctx.textBaseline = 'top';

	for (let i=0; i<64; i++) {
		const p = board[i];

		if (p == ' ')
			continue;

		const isWhite = p == p.toUpperCase();

		ctx.fillStyle   =  isWhite ? '#fff' : '#000';
		ctx.strokeStyle = !isWhite ? '#fff' : '#000';
		ctx.lineWidth   = 2;

		const [row, col] = sqToCoords(i, rev),
		      s = pieceToChar(p),
			  x = col * sqSize + 2,
			  y = row * sqSize + sqSize/6;

		ctx.strokeText(s, x, y);
		ctx.fillText(s, x, y);
	}
}

/**
 * Get the font character corresponding to the piece symbol.
 * @param {string} symbol (p, n, q, ...) 
 * @return {string} character
 */
function pieceToChar(p) {
    switch(p.toLowerCase()) {
        case 'p': return 'o';
        case 'n': return 'm';
        case 'b': return 'v';
        case 'r': return 't';
        case 'q': return 'w';
        case 'k': return 'l';
        default: return ' ';
    }
}

/**
 * Convert a square number to row/column.
 * @param {number}  i   square number
 * @param {boolean} rev reverse?
 * @return [number, number] row and column
 */
function sqToCoords(i, rev) {
	let col = i % 8,
	    row = (i - col) / 8;

	if (rev) {
		col = 7 - col;
		row = 7 - row;
	}

	return [row, col]
}