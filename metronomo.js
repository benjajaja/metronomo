const MARGIN = 20;
let loop;
let bpm = parseInt(getQueryParam('bpm'), 10) || 80;
let samples;
let currentStep = 0
let hasStarted = false;
let hasLoaded = false;
let background = null;
const images = {};

function canvasSize() {
  return (windowWidth > windowHeight
    ? windowHeight
    : windowWidth);
}
function windowResized() {
  let size = canvasSize()
  resizeCanvas(size, size);
  background = makeBackground();
}
function setup() {
  let size = canvasSize()
  createCanvas(size, size);
  ellipseMode(CENTER);
  background = makeBackground();
  samples = [
    {
      url: './assets/guitarra_cuerdas_tapadas.[ogg|wav]',
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
      hasLoaded = true;
    }
  };
  next(0)();
}

function preload() {
  images.turtle = loadImage('assets/turtle.png');
  images.rabbit = loadImage('assets/rabbit.png');
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

function makeBackground() {
  const size = (windowWidth > windowHeight
    ? windowHeight / 2
    : windowWidth / 2) - (MARGIN * 2);
  const width = size * 2;
  const height = size * 2;
  if (background) {
    background.remove();
  }
  const pg = createGraphics(windowWidth, windowHeight);
  pg.background("#c4e9f2");

  const imageSize = size / 4;
  pg.image(images.turtle, MARGIN * 2, height - imageSize + MARGIN * 2, imageSize, imageSize)
  pg.image(images.rabbit, width - imageSize + MARGIN * 2, height - imageSize + MARGIN * 2, imageSize, imageSize)

  pg.translate(size + MARGIN * 2, size + MARGIN * 2);

  pg.strokeWeight(2);
	pg.stroke(1);
	pg.fill("#d6fcea");
  pg.ellipse(0, 0, size * 2);
  for (let i = 0; i < 12; i++) {
		if (isBeat(i)) {
      continue;
    }
    let d = .5;
    pg.fill("#cccccc");

    let angle = (i - 12 / 4) / 12 * TWO_PI;
    var x = cos(angle) * size;
		var y = sin(angle) * size;
    var diameter = d * (size / 10);
    pg.ellipse(x, y, diameter, diameter);
  }

  let textSize_ = size / 10;
  pg.textSize(textSize_);
  pg.textAlign(CENTER);
  pg.textFont('Georgia');
  pg.fill("#000000");
  pg.text(bpm + 'bpm', 0, textSize_ + 2);
  return pg;
}

function draw() {
  let size = (windowWidth > windowHeight
    ? windowHeight / 2
    : windowWidth / 2) - (MARGIN * 2);
  image(background, 0, 0);

  translate(size + MARGIN * 2, size + MARGIN * 2);
  for (let i = 0; i < 12; i++) {
		if (!isBeat(i)) continue;

    let d;
    let isLastBeat = false;

    d = 1;
    let progress = Tone.Transport.progress * 12 - i
    if (progress > 0 && progress < 2) {
      isLastBeat = true
      d += 1 - progress / 2;
    }

    let angle = (i - 12 / 4) / 12 * TWO_PI;
    var x = cos(angle) * size;
		var y = sin(angle) * size;
    fill(isLastBeat ? "#cc0000" : "#00cc00")
    var diameter = Math.min(MARGIN * 4, d * (size / 10));
    ellipse(x, y, diameter);
  }

  if (!hasLoaded) {
    return;
  }

  const playHeadAngle = (Tone.Transport.progress - 0.25) * TWO_PI;
  stroke("#000000");
  fill("#000000");
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
  if (!hasLoaded) {
    return;
  } else if (!hasStarted) {
    hasStarted = true;

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
    return;
  }

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
  if (!hasLoaded) {
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
  background = makeBackground();
  if (history.pushState) {
    var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?bpm=' + bpm;
    window.history.replaceState({path:newurl},'',newurl);
  }
}

function getQueryParam(name) {
  return (window.location.search.substr(1).split('&').map(eq => eq.split('=')).find(eq => eq[0] === name) || [])[1];
}

