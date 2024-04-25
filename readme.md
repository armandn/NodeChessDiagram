# Chess Diagram Generator
Generate chess diagrams in Node.

## Installation

```
npm install
npm run start
```
Open your browser and enter this sample URL:
```
http://localhost:3000/diagram?fen=2r3k1/p4p2/3Rp2p/1p2P1pK/8/1P4P1/P3Q2P/1q6&inline=1&size=400
```

## Parameters

Send parameters as a query string:
* `fen`    = FEN string for the diagram
* `size`   = size of the diagram (100 to 1000 pixels)
* `rev`    = set `1` to true if you want the board to be reversed (black pieces at the bottom)
* `inline` = set to `1` to display the image, default will download it

## Where it's used

A bit more complex code is being used by [SparkChess](https://www.sparkchess.com), an online chess app, to generate and download chess diagrams.

## Tutorial

You can find more details about the code [in this article](https://www.media-division.com/chess-diagram-generator-in-nodejs/).

## PHP Alternative

I also created a [PHP version](https://github.com/armandn/PHPChessDiagram) of this code.