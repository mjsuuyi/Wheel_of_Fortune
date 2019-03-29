<script>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Wheel of Fortune</title>
{ <style>
  #game {
  font-family: 'Helvetica', 'Arial', sans-serif;
      color: #444444;
      font-size: 9pt;
      background-color: #FAFAFA;
  }
  #wheel {
    top: 0;
    left: 0;
    width: 500px;
    -moz-border-radius: 250px;
    -webkit-border-radius: 250px;
    border-radius: 250px;
    -webkit-transition: -webkit-transform 0.5s linear;
    -moz-transition: -moz-transform 0.5s linear;
    -opera-transition: -opera-transform 0.5s linear;
    -ms-transition: transform 0.5s linear;
  }
  #tick {
    margin-left: 244px;
    font-family: Arial;
    font-size: 14pt;
  }

  #display {
    background-color: #43759f;
    padding: 1em 2em;
    text-align: center;
    border-radius: 40px;
    border: 4px double #fff;
  }

  #display div.word {
    display: inline-block;
  }
  #display div.word:not(:first-child) {
    padding: 0 30px;
  }

  #display div.wordLetter {
    display: block;
    width: 50px;
    height: 65px;
    margin: 2px;
    border: 2px solid #43759f;
    float: left;
    line-height: 65px;
    font-size: 40px;
  }

  #display div.wordLetter.letter {
    border-color: #eee;
  }

  #playArea {
    clear: both;
  }

  #playArea button {
    text-transform: uppercase;
    z-index: 1000;
    border: 4px double #fff;
    background-color: #43759f;
    padding: 6px 14px;
    color: white;
    font-family: inherit;
    font-size: 12pt;
  }

  #playArea #moneyArea {
    float: right;
    position: relative;
    padding: 10px;
    border: 2px black solid;
    width: 200px;
    margin: 5px;
    font-size: 14pt;
  }

  .clear {
    clear: both;
  }

       }
    </style>
</head>
<body>
			<h1>Spin the Wheel!</h1>
class OnListener {
  constructor() {
    this.events = {};
  }

  on(event, callback) {
    this.events[event] = callback.bind(this);
  }

  trigger(event, ...value) {
    if (Object.keys(this.events).includes('all')) {
      return this.events['all'](event, ...value);
    }

    for (let _event in this.events) {
      if (event.indexOf(_event) > -1 || _event.indexOf(event) > 1) {
        this.events[_event](event, ...value);
      }
    }
  }
}

class Wheel extends OnListener {
  constructor({
    element,
    button,
    values = []
  }) {
    super();

    this.element = element;
    this.values = values;
    this.modifier = Wheel.spinModifier();
    this.slowdownSpeed = 0.5;
    this.currentRotation = 0;
    this.spinTimeout = null;

    const clickFn = this.click.bind(this);

    element.addEventListener('click', clickFn, false);
    button.addEventListener('click', clickFn, false);
  }

  static spinModifier() {
    return Math.random() * 10 + 20;
  }

  stop() {
    clearTimeout(this.spinTimeout);
  }

  click() {
    this.trigger('spin:start');
    return this.spin().then((value) => {
      this.trigger('spin:end', value);

      return value;
    });
  }

  rotate(degrees) {
    this.element.style.transform = `rotate(-${degrees}deg)`;
    this.currentRotation = degrees;
    return this;
  }

  spin(amount = this.currentRotation, modifier = this.modifier) {
    this.stop();
    modifier -= this.slowdownSpeed;
    this.rotate(amount);

    return new Promise((res, rej) => {
      if (modifier > 0) {
        this.spinTimeout = setTimeout(() => {
          res(this.spin(amount + modifier, modifier));
        }, 1000 / 5)
      } else {
        const dataRotation = this.currentRotation;
        const divider = 360 / this.values.length;
        const offset = divider / 2; // half division
        const wheelValue = this.values[Math.floor(Math.ceil((dataRotation + offset) % 360) / divider)];

        this.modifier = Wheel.spinModifier();

        switch (wheelValue) {
          case 0:
            return res(0);
          case -1:
            return res("Free Spin");
          case -2:
            return res("Lose a turn");
          default:
            return res(wheelValue);
        }
      }
    })
}
}

class Board extends OnListener {
static randomize(arr) {
  //fisher yates from https://codereview.stackexchange.com/a/12200/3163
  let i = arr.length;
  if (i === 0) return [];
  while (--i) {
    const j = Math.floor(Math.random() * (i + 1));
    const tempi = arr[i];
    const tempj = arr[j];
    arr[i] = tempj;
    arr[j] = tempi;
  }

  return arr;
}

constructor({
  answers = [],
  element,
  button
}) {
  super();
  this.element = element;
    this.answers = Board.randomize(answers);
    this.currentBoard = -1;

    button.addEventListener('click', () => this.next(), false);
  }

  clear() {
    const displayArea = this.element;

    while (displayArea.hasChildNodes()) { //remove old puzzle
      displayArea.removeChild(displayArea.firstChild);
    }
  }

  solve(solution) {
    return (this.answers[this.currentBoard].toUpperCase() === solution.toUpperCase());
  }

  getNextBoard() {
    try {
      const board = this.answers[++this.currentBoard].toUpperCase();
      const boardArray = board.split('');

      this.trigger('new:puzzle', board);

      return boardArray;
    } catch (e) {
      throw new Error('No more levels!');
    }
  }

  inputLetter(_letter) {
    let count = 0;

    this.letters.forEach((obj) => {
      const {
        letter,
        element
      } = obj;
      if (!obj.seen && _letter === letter) {
        element.textContent = letter;
        obj.seen = true;
        count += 1;
      }
    });

    return count;
  }

  next() {
    const boardArray = this.getNextBoard();
    const displayArea = this.element;
    this.clear();

    this.letters = [];

    let word = document.createElement('div');

    word.classList.add('word');

    const words = boardArray.reduce((words, currentLetter, index) => {
      const letter = document.createElement('div');
      letter.classList.add('wordLetter');
      letter.id = `letter_${index}`;

      if (currentLetter !== ' ') {
        letter.classList.add('letter');
        this.letters.push({
          letter: currentLetter,
          element: letter
        });

        word.appendChild(letter);
      } else {
        words.push(word);
        word = document.createElement('div');
        word.classList.add('word');
      }

      return words;
    }, []);

    // push the last one
    words.push(word);
    words.forEach((wordElement) => {
      displayArea.appendChild(wordElement);
    });
  }
}

class Game {
  constructor({
    wheel,
    board,
    vowelButton,
    solveButton,
    moneyElement
  }) {
    this.wheel = wheel;
    this.board = board;
    this.vowels = ['A', 'E', 'I', 'O', 'U'];
    this.totalScore = 0;
    this.moneyElement = moneyElement;

    vowelButton.addEventListener('click', () => {
      if (this.totalScore >= 100) {
        this.totalScore -= 100;
        this.guessLetter(0, true);
      } else {
        // @todo an else case
      }
    }, false);

    solveButton.addEventListener('click', () => {
      const solution = prompt('What is the solution?');
      if (board.solve(solution)) {
        solution.split('').forEach((letter) => {
          this.board.inputLetter(letter.toUpperCase())
        });
        setTimeout(() => alert('Puzzle solved!'), 10);
      } else {
        alert('Puzzle not solved!');
      }
    }, false);
  }

  start() {
    this.listen();
    this.board.next();
  }

  guessLetter(value, asVowel = false) {
    const letter = prompt(`Guess a ${asVowel ? 'vowel' : 'letter'}`);

    try {
      if (!(/^[a-zA-Z]$/.test(letter))) {
        throw new Error('Must input an actual letter A-Z');
      }

      const capitalLetter = letter.toUpperCase();
      const letterIsVowel = this.vowels.includes(capitalLetter);

      if (asVowel && !letterIsVowel) {
        throw new Error(`Must input a vowel: [${this.vowels.join(', ')}]`);
      } else if (!asVowel && letterIsVowel) {
        throw new Error(`Cannot input a vowel: [${this.vowels.join(', ')}]`);
      }

      const count = this.board.inputLetter(capitalLetter);

      console.log(`Found ${letter} ${count} times worth $${value * count}`);

      if (!asVowel) {
        this.totalScore += (value * count);
      }

      this.moneyElement.textContent = this.totalScore;
    } catch (error) {
      alert(error.message);
      this.guessLetter(...arguments);
    }
  }

  listen() {
    this.wheel.on('spin:end', (event, value) => {
      if (isNaN(value) || value === 0) {
        console.log('SPUN SOMETHING BAD', value);
      } else {
        console.log('CAN GUESS A LETTER', value);
        this.guessLetter(value);
      }
    });
    this.board.on('new:puzzle', (event, ...value) => {
      console.log(`${event} ${value}`);
      this.wheel.stop();
    });
  }
}

const wheel = new Wheel({
  element: document.getElementById('wheel'),
  values: [5000, 600, 500, 300, 500, 800, 550, 400, 300, 900, 500, 300, 900, 0, 600, 400, 300, -2, 800, 350, 450, 700, 300, 600],
  button: document.getElementById('spin'),
});

const board = new Board({
  element: document.getElementById('display'),
  answers: [
    "doctor who", "the dark knight rises", "wheel of fortune",
    "facebook", "twitter", "google plus", "sea world", "pastrami on rye",
    "i am sparta", "whose line is it anyway", "google chrome"
  ],
  button: document.getElementById('newpuzzle')
});

const game = new Game({
  wheel,
  board,
  vowelButton: document.getElementById('vowel'),
  solveButton: document.getElementById('solve'),
  moneyElement: document.getElementById('money')
});


game.start();

console.log(game);
</script>
