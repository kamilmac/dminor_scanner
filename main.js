console.log('hello world')


// Grab elements, create settings, etc.
// var video = document.getElementById('video');

// // Get access to the camera!
// if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
//   // Not adding `{ audio: true }` since we only want video now
//   navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
//     //video.src = window.URL.createObjectURL(stream);
//     video.srcObject = stream;
//     video.play();
//   });
// }

// https://inspirit.github.io/jsfeat/sample_canny_edge.html
// https://kylemcdonald.github.io/cv-examples/EdgeDetection/
// https://gist.github.com/fritz-c/edf804755f788d6ac7422b3e315529b2
// https://docs.opencv.org/3.3.1/d3/de6/tutorial_js_houghlines.html
// https://en.wikipedia.org/wiki/Hough_transform

var capture;
var buffer;
var result;
var lines;
var w = 320,
    h = 240;

let fmin = 500;
let fmax = 2000;

let midiOut = null;

function setup() {
    capture = createCapture(VIDEO);
    let cnv = createCanvas(w, h);
    capture.size(w, h);
    capture.hide();
    buffer = new jsfeat.matrix_t(w, h, jsfeat.U8_t);
    stroke('red');
    strokeWeight(2);
    // osc = new p5.Oscillator('sine');
    cnv.mousePressed(
      () => {
        console.log('INIT MIDI')
        WebMidi.enable(function (err) {

          if (err) {
            console.log("WebMidi could not be enabled.", err);
          } else {
            console.log("WebMidi enabled!");
            console.log(WebMidi.outputs);
            window.midiOut = WebMidi.getOutputByName("IAC Driver IAC");
            setTimeout(() => {
              midiOut.playNote("D2", 1, { duration: 400 });
            }, 300);
          }

        });
      }
    );
}

let canPlay = true;

function playnote(note) {
  if(window.midiOut && canPlay) {
    window.midiOut.playNote(note, 1, { duration: 500 });
    canPlay = false
    setTimeout(() => {
      canPlay = true
    }, 50);
  }
}

// const NOTES = [
//   207,
//   233,
//   277,
//   311,
//   369,
//   415,
//   466,
//   554,
//   622,
//   739,
//   830,
//   932,
//   1108,
//   1244,
//   1479,
//   1661,
//   1864,
//   2217,
//   2489,
//   2959,
//   3322,
//   3729,
//   4434,
//   4978,
// ]

const NOTES = [
  'D3',
  'E3',
  'F3',
  'G3',
  'A3',
  'A#3',
  'C4',
  'D4',
  'E4',
  'F4',
  'G4',
  'A4',
  'A#4',
  'C5',
  'D5',
  'E5',
  'F5',
  'G5',
  'A5',
  'A#5',
  'C6',
  'D6',
  'E6',
  'F6',
  'G6',
  'A6',
  'A#6',
  'C6',
  'D7',
]

let lineProgress = 0;
let currentNote = 0;
function draw() {
    //image(capture, 0, 0, w, h);
    capture.loadPixels();
    if (capture.pixels.length > 0) { // don't forget this!
        var speed = Number(select('#blurSize').elt.value) / 10;
        var position = Number(select('#position').elt.value);
        var freeze = document.getElementById("freeze");
        var poly = document.getElementById("poly");
        if (!freeze.checked) {
          var blurSize = 30;
          var lowThreshold = 15;
          var highThreshold = 25;

          blurSize = map(blurSize, 0, 100, 1, 12);
          lowThreshold = map(lowThreshold, 0, 100, 0, 255);
          highThreshold = map(highThreshold, 0, 100, 0, 255);

          jsfeat.imgproc.grayscale(capture.pixels, w, h, buffer);
          jsfeat.imgproc.gaussian_blur(buffer, buffer, 10, 0);
          jsfeat.imgproc.canny(buffer, buffer, lowThreshold, highThreshold);
          var n = buffer.rows * buffer.cols;

          result = jsfeatToP5(buffer, result);
        }
        image(result, 0, 0, w, h);

        /*
          0 0 0 0
          1 0 0 0   ()
          0 0 0 0
          0 0 0 0
        */
        const pixels = [];
        for (let i=0;i<result.pixels.length;i++) {
          if (i%4 === 0) {
            pixels.push(result.pixels[i])
          }
        }

        let linePixels = [];

        for (let i=0;i<h;i++) {
          let p = pixels[lineProgress + i*w]
          if (p) {
            linePixels.push(h - i)
          }
        }

        let lineVal = 0;
        let multiLine = [];
        let tres = 20;
        if (linePixels.length) {
          for (let i=0;i<linePixels.length;i++) {
            if (Math.abs(linePixels[i-1] - linePixels[i]) > tres) {
              multiLine.push(NOTES[Math.floor(map(linePixels[i], 0, h, 0, NOTES.length-1))])
            }
            lineVal = lineVal + linePixels[i];
          }
          lineVal = lineVal/linePixels.length
          lineVal = NOTES[Math.floor(map(lineVal, 0, h, 0, NOTES.length-1))]
        }
        if (!poly.checked && lineVal != 0 && currentNote !== lineVal) {
          if (!poly.checked) {
            currentNote = lineVal;
            playnote(currentNote)
          }
        }
        if (poly.checked) {
          for (let i =0;i < multiLine.length;i++) {
            playnote(currentNote)
          }
        }
        // osc.freq(lineVal, 0.1);
        // osc.amp(10, 0.1);


        // blendMode(MULTIPLY)

        line(lineProgress, h, lineProgress, 0);
        if (speed) {
          lineProgress = lineProgress + speed;
        } else {
          lineProgress = position
        }
        console.log(speed)
        if (lineProgress > w) {
          lineProgress = 0;
        }

      	// /*
      	// lines = probabilisticHoughTransform(buffer.data,
        //                                     640, 480,
        //                                     1, PI/180,
        //                                     50,0,0,50);
        // for (let myLine of lines) {
        //   var x0 = myLine[0].x;
        //   var y0 = myLine[0].y;
        //   var x1 = myLine[1].x;
        //   var y1 = myLine[1].y;

        //   line(x0,y0,x1,y1);
        //   //console.log(myLine);
        // }
        // */
    }
}


// convert grayscale jsfeat image to p5 rgba image
// usage: dst = jsfeatToP5(src, dst)
function jsfeatToP5(src, dst) {
    if (!dst || dst.width != src.cols || dst.height != src.rows) {
        dst = createImage(src.cols, src.rows);
    }
    var n = src.data.length;
    dst.loadPixels();
    var srcData = src.data;
    var dstData = dst.pixels;
    for (var i = 0, j = 0; i < n; i++) {
        var cur = srcData[i];
        dstData[j++] = cur;
        dstData[j++] = cur;
        dstData[j++] = cur;
        dstData[j++] = 255;
    }
    dst.updatePixels();
    return dst;
}
