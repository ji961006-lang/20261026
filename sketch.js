let img;
let board = []; // 3x3 網格裝載狀況
let pieces = []; // 所有的拼圖物件
const COLS = 3;
const ROWS = 3;
let pieceWidth, pieceHeight;

// 遊戲狀態
let score = 100;
let wrongAnswersCount = 0;
let activeQuestionPiece = null; // 當前正在回答題目的拼圖
let isQuizActive = false;
let gameFinished = false;

// 9 題英文問答題目資料 (可自行更換)
const questionsData = [
  { q: "1. What is the past tense of 'Go'?", options: ["Gone", "Went", "Goes"], ans: 1 },
  { q: "2. Which one is a Fruit?", options: ["Apple", "Carrot", "Potato"], ans: 0 },
  { q: "3. Choose the correct spelling:", options: ["Beautifull", "Beautiful", "Beautifu"], ans: 1 },
  { q: "4. Opposite of 'Hot' is:", options: ["Warm", "Cold", "Ice"], ans: 1 },
  { q: "5. Fill in: She ____ a book yesterday.", options: ["read", "reads", "reading"], ans: 0 },
  { q: "6. Which animal can fly?", options: ["Dog", "Penguin", "Eagle"], ans: 2 },
  { q: "7. Plural form of 'Child':", options: ["Childs", "Children", "Childrens"], ans: 1 },
  { q: "8. What color is the sky on a clear day?", options: ["Blue", "Green", "Red"], ans: 0 },
  { q: "9. Synonym of 'Happy':", options: ["Sad", "Glad", "Angry"], ans: 1 }
];

// UI DOM 元素
let questionText, optionButtons = [];

function preload() {
  // 將圖片路徑指向你的本地圖片（或將你的圖片命名為 puzzle.jpg 放在 assets 資料夾內）
  img = loadImage('assets/puzzle.jpg');
}

function setup() {
  let canvas = createCanvas(900, 600);
  canvas.parent('game-container');

  pieceWidth = 300 / COLS;   // 拼圖區寬度為 300
  pieceHeight = 300 / ROWS;  // 拼圖區高度為 300

  initGame();
  setupQuizUI();
}

function initGame() {
  score = 100;
  wrongAnswersCount = 0;
  gameFinished = false;
  isQuizActive = false;
  pieces = [];
  
  // 初始化 3x3 網格記錄
  board = Array(COLS).fill().map(() => Array(ROWS).fill(null));

  // 切割圖片建立 9 個碎片
  let index = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      // 從原圖裁切子圖
      let imgCrop = img.get(
        c * (img.width / COLS),
        r * (img.height / ROWS),
        img.width / COLS,
        img.height / ROWS
      );

      // 隨機生成左側拼圖區的位置
      let spawnX = random(50, 350 - pieceWidth);
      let spawnY = random(150, 550 - pieceHeight);

      pieces.push(new Piece(index, c, r, imgCrop, spawnX, spawnY));
      index++;
    }
  }
}

function setupQuizUI() {
  // 建立問答 UI 介面
  questionText = createP('');
  questionText.position(520, 200);
  questionText.style('font-size', '18px');
  questionText.style('font-weight', 'bold');
  questionText.style('width', '320px');
  questionText.hide();

  for (let i = 0; i < 3; i++) {
    let btn = createButton('');
    btn.position(520, 270 + i * 45);
    btn.size(300, 35);
    btn.style('font-size', '16px');
    btn.style('cursor', 'pointer');
    btn.style('border-radius', '6px');
    btn.style('border', '1px solid #ccc');
    btn.style('background-color', '#e7f0fe');
    btn.mousePressed(() => checkAnswer(i));
    btn.hide();
    optionButtons.push(btn);
  }
}

function draw() {
  background(245);

  // 劃分介面：左邊是拼圖與拖曳區，右邊是問答與資訊區
  stroke(200);
  strokeWeight(2);
  line(450, 0, 450, height);

  // 繪製目標拼圖盤 (放置於 50, 150)
  drawBoard();

  // 繪製所有拼圖碎片 (未被拖曳的先畫，拖曳中的最後畫)
  let draggingPiece = null;
  for (let p of pieces) {
    if (p.isDragging) {
      draggingPiece = p;
    } else {
      p.draw();
    }
  }
  if (draggingPiece) draggingPiece.draw();

  // 繪製 UI 與分數資訊
  drawUI();
}

function drawBoard() {
  let startX = 80;
  let startY = 180;
  fill(230);
  stroke(180);
  strokeWeight(2);
  rect(startX, startY, 300, 300);

  // 畫出 3x3 虛線網格
  for (let i = 0; i <= COLS; i++) {
    line(startX + i * pieceWidth, startY, startX + i * pieceWidth, startY + 300);
    line(startX, startY + i * pieceHeight, startX + 300, startY + i * pieceHeight);
  }

  fill(100);
  noStroke();
  textAlign(CENTER);
  textSize(18);
  text("將拼圖拖移至此處", startX + 150, startY - 15);
}

function drawUI() {
  fill(30);
  noStroke();
  textAlign(LEFT);
  textSize(24);
  text("英文拼圖問答 Challenge", 480, 50);

  textSize(18);
  text(`目前得分: ${score} 分`, 480, 100);
  text(`答錯次數: ${wrongAnswersCount} 次 (每次扣 11 分)`, 480, 130);

  if (gameFinished) {
    fill(0, 150, 0);
    textSize(28);
    textAlign(CENTER);
    text("🎉 恭喜完成拼圖！", 670, 250);
    textSize(22);
    fill(50);
    text(`最終得分: ${score} 分`, 670, 300);
  }
}

// 滑鼠互動控制
function mousePressed() {
  if (isQuizActive || gameFinished) return;

  // 從最上層開始檢查點擊哪張拼圖
  for (let i = pieces.length - 1; i >= 0; i--) {
    if (pieces[i].isMouseOver() && !pieces[i].isLocked) {
      pieces[i].isDragging = true;
      pieces[i].offsetX = mouseX - pieces[i].x;
      pieces[i].offsetY = mouseY - pieces[i].y;
      break;
    }
  }
}

function mouseDragged() {
  for (let p of pieces) {
    if (p.isDragging) {
      p.x = mouseX - p.offsetX;
      p.y = mouseY - p.offsetY;
    }
  }
}

function mouseReleased() {
  for (let p of pieces) {
    if (p.isDragging) {
      p.isDragging = false;
      checkSnap(p);
    }
  }
}

// 檢查是否吸附到正確位置
function checkSnap(p) {
  let boardX = 80;
  let boardY = 180;

  // 計算應該對應的格座標
  let targetX = boardX + p.correctCol * pieceWidth;
  let targetY = boardY + p.correctRow * pieceHeight;

  // 如果拖放到正確位置附近 (距離小於 30px)
  if (dist(p.x, p.y, targetX, targetY) < 30) {
    p.x = targetX;
    p.y = targetY;
    p.isLocked = true; // 鎖定拼圖
    
    // 跳出題目
    triggerQuiz(p);
  }
}

// 觸發問題
function triggerQuiz(piece) {
  isQuizActive = true;
  activeQuestionPiece = piece;

  let qData = questionsData[piece.id];
  questionText.html(qData.q);
  questionText.show();

  for (let i = 0; i < 3; i++) {
    optionButtons[i].html(qData.options[i]);
    optionButtons[i].show();
  }
}

// 檢查答題結果
function checkAnswer(selectedIndex) {
  let qData = questionsData[activeQuestionPiece.id];

  if (selectedIndex === qData.ans) {
    alert("答對了！✨");
  } else {
    alert("答錯了！扣 11 分 ❌");
    wrongAnswersCount++;
    score = max(0, score - 11); // 扣 11 分，最低 0 分
  }

  // 隱藏題目 UI
  questionText.hide();
  for (let btn of optionButtons) {
    btn.hide();
  }

  isQuizActive = false;
  activeQuestionPiece = null;

  // 檢查是否所有 9 張拼圖都完成
  checkGameComplete();
}

function checkGameComplete() {
  let allLocked = pieces.every(p => p.isLocked);
  if (allLocked) {
    gameFinished = true;
  }
}

// 拼圖類別 (Piece Class)
class Piece {
  constructor(id, col, row, imgCrop, spawnX, spawnY) {
    this.id = id;
    this.correctCol = col;
    this.correctRow = row;
    this.img = imgCrop;
    this.x = spawnX;
    this.y = spawnY;
    this.isDragging = false;
    this.isLocked = false;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  draw() {
    stroke(255);
    strokeWeight(1);
    image(this.img, this.x, this.y, pieceWidth, pieceHeight);
    
    // 如果已經鎖定，畫綠色邊框
    if (this.isLocked) {
      noFill();
      stroke(0, 255, 0);
      strokeWeight(2);
      rect(this.x, this.y, pieceWidth, pieceHeight);
    }
  }

  isMouseOver() {
    return mouseX > this.x && mouseX < this.x + pieceWidth &&
           mouseY > this.y && mouseY < this.y + pieceHeight;
  }
}