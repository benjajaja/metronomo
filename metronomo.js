const MARGIN = 20;
let loop;
let bpm = parseInt(getQueryParam('bpm'), 10) || 80;
let samples;
let currentStep = 0
let hasStarted = false;
const images = {};

function canvasSize() {
  return (windowWidth > windowHeight
    ? windowHeight
    : windowWidth);
}
function windowResized() {
  let size = canvasSize()
  resizeCanvas(size, size);
}
function setup() {
  let size = canvasSize()
  createCanvas(size, size);
  ellipseMode(CENTER);

}

function preload() {
  images.turtle = loadImage('assets/turtle.png');
  images.rabbit = loadImage('assets/rabbit.png');
  samples = [
    {
      url: './assets/guitarra_cuerdas_tapadas.wav',
      beats: [0, 3, 6, 8, 10],
      sampler: null,
    },
    {
      url: './assets/cajon_kick.[ogg|wav]',
      beats: [1, 2, 4, 5, 7, 9, 11],
      sampler: null,
    },
  ];
  const next = index => () => {
    if (index < samples.length) {
      samples[index].sampler = new Tone.Sampler({
        'A2': samples[index].url,
      }, next(index + 1)).toMaster();
    } else {
      waitForClick();
    }
  };
  next(0)();
}

function waitForClick() {
  const firstClickHandler = event => {
    hasStarted = true;
    document.getElementById('defaultCanvas0').removeEventListener('click', firstClickHandler, true);

    loop = new Tone.Sequence(
      (time, step) => {
        currentStep = step; // visual
        samples.forEach(sample => {
          if (sample.beats.indexOf(step) !== -1) {
            sample.sampler.triggerAttackRelease("A2", "2n", time);
          }
        })
      },
      Array.from(Array(12).keys()),
      "12n"
    );
    if (loop.context.resume) {
      loop.context.resume();
    }
    Tone.Transport.start();
    Tone.Transport.set("bpm", bpm / 2);
    loop.start();
    Tone.Transport.loop = true;
    Tone.Transport.loopEnd = "1m";
  };
  document.getElementById('defaultCanvas0').addEventListener('click', firstClickHandler, true);
}

function handleBeat(time, step) {
  currentStep = step
	let note = step >= 3 && step < 10
		? "B#2"
		: "A2";
	if (isBeat(step)) {
		kick.triggerAttackRelease("A2", "8n", time);
	} else {
//		clap.triggerAttackRelease(note, "8n", time);
	}
}
function isBeat(i) {
	return i === 3 || i === 6 || i === 8 || i === 10 || i === 0;
}
function draw() {
  let size = (windowWidth > windowHeight
    ? windowHeight / 2
    : windowWidth / 2) - (MARGIN * 2);
  let width = size * 2;
  let height = size * 2;

  background("#ffe9b7");


  const imageSize = size / 4;
  image(images.turtle, MARGIN * 2, height - imageSize + MARGIN * 2, imageSize, imageSize)
  image(images.rabbit, width - imageSize + MARGIN * 2, height - imageSize + MARGIN * 2, imageSize, imageSize)

  translate(size + MARGIN * 2, size + MARGIN * 2);

  strokeWeight(2);
	stroke(1);
	fill("#ddffd1");
  ellipse(0, 0, size * 2);
  for (let i = 0; i < 24; i++) {
    let d;
    let isLastBeat = false;
		if (i % 2 !== 0) {
			d = 0.1;
		} else if (isBeat(i / 2)) {
			d = 1;
      let progress = Tone.Transport.progress * 24 - i
      if (progress > 0 && progress < 4) {
        isLastBeat = true
        d += 1 - progress / 4;
      }
		} else {
			d = 0.5;
		}


    let angle = (i - 24 / 4) / 24 * TWO_PI;
    var x = cos(angle) * size;
		var y = sin(angle) * size;
    if (isLastBeat) {
      fill("#ff0000");
    } else {
      fill(i % 2 == 0 ? "#000000" : "#ffffff");
    }
    ellipse(x, y, d * (size / 10), d * (size / 10));
  }

  let textSize_ = size / 10;
  textSize(textSize_);
  textAlign(CENTER);
  textFont('Georgia');
  fill("#000000");
  text(bpm + 'bpm', 0, textSize_ + 2);

  const playHeadAngle = (Tone.Transport.progress - 0.25) * TWO_PI;
  stroke("#000000");
  ellipse(0, 0, size / 30);
  var playHeadLineLength = size - 20;
  var x = cos(playHeadAngle) * playHeadLineLength;
  var y = sin(playHeadAngle) * playHeadLineLength;
  line(0, 0, x, y);

  playHeadLineLength = size;
  x = cos(playHeadAngle) * playHeadLineLength;
  y = sin(playHeadAngle) * playHeadLineLength;
  noFill();
  ellipse(x, y, 40, 40);

}

function touchStarted() {
  let size = canvasSize()
  if (mouseY > size - size / 4) {
    if (mouseX < size / 4) {
      setBpm(bpm - 10);
      return false;
    } else if (mouseX > size - size / 4) {
      setBpm(bpm + 10);
      return false;
    }
  }
  if (!hasStarted) {
    return
  }
  if (Tone.Transport.state === 'started') {
    Tone.Transport.stop();
    currentStep = 0;
  } else {
    Tone.Transport.start();
  }
  return false;
}

function setBpm(bpm_) {
  bpm = bpm_;
  Tone.Transport.set("bpm", bpm / 2);
  console.log('bpm', bpm);
  if (history.pushState) {
    var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?bpm=' + bpm;
    window.history.replaceState({path:newurl},'',newurl);
  }
}

function getQueryParam(name) {
  return (window.location.search.substr(1).split('&').map(eq => eq.split('=')).find(eq => eq[0] === name) || [])[1];
}
