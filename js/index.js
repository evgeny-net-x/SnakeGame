class Cell {
	constructor(x=0, y=0, size=0) {
		this.positionX = x;
		this.positionY = y;
		this.isEnabled = false;
		this.timer = 0;
		this.maxImageNumber = 13;
		this.timeToDisableInMs = 15 * 1000;

		this.element = this.createCellElement(x, y, size);
	}

	createCellElement(x=0, y=0, size=0) {
		if (Cell.rootCellElement === undefined) {
			let cellElement = document.createElement('div');
			cellElement.className = 'game-cell';

			Cell.rootCellElement = cellElement;
		}

		let cell = Cell.rootCellElement.cloneNode(false);
		cell.style.left = x + 'px';
		cell.style.top = y + 'px';
		cell.style.width = size + 'px';
		cell.style.height = size + 'px';

		return cell;
	}

	enable() {
		if (this.isEnabled === true)
			this.disable();

		this.isEnabled = true;
		this.timer = this.timeToDisableInMs;

		let num = Math.round(Math.random() * (this.maxImageNumber-1)) + 1;
		this.imageNumber = num;
		this.element.className += this.element.className + ' ' + 'game-snake-tail game-snake-tail-' + num;
	}

	disable() {
		this.isEnabled = false;
		this.timer = 0;
		this.element.className = 'game-cell';
	}

	update(delta) {
		if (this.isEnabled === false)
			return;

		this.timer -= delta;
		if (this.timer <= 0)
			this.disable();
	}
}

class Entity {
	constructor(x=0, y=0, dirX=0, dirY=0, size=0, speed=0, className, historySize=0) {
		let element = document.createElement('div');
		element.className = className;
		element.style.left = x + 'px';
		element.style.top = y + 'px';
		element.style.width = size + 'px';
		element.style.height = size + 'px';
		this.element = element;

		this.isAlive = true;
		this.size = size;
		this.speed = speed;
		this.positionX = x;
		this.positionY = y;
		this.directionX = dirX;
		this.directionY = dirY;
		this.rotation = 0;
		this.shouldRotateTo = 0;
		this.lastRotatedCell = undefined;

		this.history = [];
		for (let i = 0; i < historySize; i++)
			this.history.push(undefined);
	}

	reset(x=0, y=0, dirX=0, dirY=0) {
		this.isAlive = true;
		this.positionX = x;
		this.positionY = y;
		this.directionX = dirX;
		this.directionY = dirY;
		this.rotation = 0;
		this.shouldRotateTo = 0;
		this.lastRotatedCell = undefined;

		this.element.style.left = x + 'px';
		this.element.style.top = y + 'px';
		this.element.style.display = 'block';
	}

	move(x, y) {
		if (Math.abs(x + y) != 1)
			return;

		if (x != 0 && this.directionX != 0)
			return;
		else if (x != 0)
			this.rotate(x * this.directionY);

		if (y != 0 && this.directionY != 0)
			return;
		else if (y != 0)
			this.rotate(-1 * y * this.directionX);
	}

	rotate(leftRight) {
		this.shouldRotateTo = leftRight;
	}

	tryRotate(map) {
		if (this.shouldRotateTo == 0)
			return;

		let offsetX = (this.positionX+map.cellSize/2) % map.cellSize;
		let offsetY = (this.positionY+map.cellSize/2) % map.cellSize;

		let i = Math.round(this.positionX / map.cellSize);
		let j = Math.round(this.positionY / map.cellSize);
		let cell = map[i][j];
		if (this.lastRotatedCell == cell) // Last rotation was on the same cell => double rotation bag
			return;

		if (Math.abs(offsetX - map.cellSize/2) > 2 || Math.abs(offsetY - map.cellSize/2) > 2)
			return;

		// Placed around the center of cell => normalize position and rotate
		this.positionX -= (offsetX - map.cellSize/2);
		this.positionY -= (offsetY - map.cellSize/2);
		this.rotation += this.shouldRotateTo*90;

		if (this.directionX != 0) { // Moves on X
			this.directionY = -1 * this.directionX * this.shouldRotateTo;
			this.directionX = 0;
		} else if (this.directionY != 0) {  // Moves on Y
			this.directionX = this.directionY * this.shouldRotateTo;
			this.directionY = 0;
		}

		this.shouldRotateTo = 0;
		this.lastRotatedCell = cell;
	}

	update(delta, map) {
		if (!this.isAlive)
			return;

		this.tryRotate(map);
		
		const px = this.speed * (delta/1000);
		this.positionX += this.directionX * px;
		this.positionY -= this.directionY * px;

		if (!(0 <= this.positionX+this.size*0.1 && this.positionX+this.size*0.9 <= map.widthCount*map.cellSize &&
			  0 <= this.positionY+this.size*0.1 && this.positionY+this.size*0.9 <= map.heightCount*map.cellSize)) {
			this.isAlive = false;
		}
	}

	saveState() {
		this.history.shift();
		this.history.push({
			x: this.positionX,
			y: this.positionY,
			dirX: this.directionX,
			dirY: this.directionY,
			rotation: this.rotation
		});
	}

	recoveryState(state) {
		this.positionX = state.x;
		this.positionY = state.y;
		this.directionX = state.dirX;
		this.directionY = state.dirY;
		this.rotation = state.rotation;
	}

	render() {
		if (!this.isAlive) {
			this.element.style.display = 'none';
			return;
		}

		let scaleX = 1;
		let scaleY = 1;

		// TODO: поворачивать только на -90 или 90 градусов. Остальное делать scale
		if (Math.abs(this.directionX) == 1 && Math.abs(this.rotation)%360 == 180)
			scaleY = -1;
		else if (this.directionX == -1 && Math.abs(this.rotation)%360 == 0)
			scaleX = -1;

		this.element.style.transform = 'rotate(' + this.rotation + 'deg) scale(' + scaleX  + ',' + scaleY + ')';
	
		this.element.style.left = this.positionX + 'px';
		this.element.style.top = this.positionY + 'px';
	}
}

class Snake {
	constructor(x=0, y=0, size=0, speed=0, historySize=0) {
		this.init(x, y, size, speed, historySize);
	}

	init(x=0, y=0, size=0, speed=0, historySize=0) {
		this.isAlive = true;

		this.entities = [];
		this.entities.push(new Entity(x, y, 1, 0, size, speed, 'game-snake-head', historySize));
	}

	move(x, y) {
		this.entities[0].move(x, y);
	}

	reset(x=0, y=0) {
		for (let i = 1; i < this.entities.length; i++)
			this.entities[i].element.remove();

		this.entities = [this.entities[0]];
		this.entities[0].reset(x, y, 1, 0);
		this.isAlive = true;
	}

	appendChild(className) {
		className = 'game-snake-tail ' + className;
		let size = this.entities[0].size;
		let speed = this.entities[0].speed;
		let historySize = this.entities[0].history.length;

		let entity = new Entity(0, 0, 0, 0, size, speed, className, historySize);
		this.entities.push(entity);
		this.entities[0].element.parentElement.appendChild(entity.element);
	}

	checkCollisionWithTail() {
		for (let i = 1; i < this.entities.length; i++) {
			let tail = this.entities[i];

			let headX = this.entities[0].positionX;
			let headY = this.entities[0].positionY;

			let lengthX = headX - tail.positionX;
			let lengthY = headY - tail.positionY;
			let length = Math.sqrt(lengthX*lengthX + lengthY*lengthY);

			if (length < tail.size*0.44) {
				this.isAlive = false;
				break;
			}
		}
	}

	update(delta, map) {
		if (!this.isAlive)
			return;

		this.entities[0].update(delta, map);
		this.entities[0].saveState();

		for (let i = 1; i < this.entities.length; i++) {
			if (this.entities[i-1].history[0] === undefined)
				continue;

			this.entities[i].recoveryState(this.entities[i-1].history[0]);
			this.entities[i].saveState();
		}

		this.checkCollisionWithTail()

		if (!this.entities[0].isAlive)
			this.isAlive = false;
	}

	render() {
		for (let i = 0; i < this.entities.length; i++)
			this.entities[i].render();
	}
}

class Game {
	constructor() {
		this.init();
	}

	init() {
		let cellSize = 30;
		let playerSpeed = 100;

		this.window = document.getElementById('game-window');
		this.FPS = 10;
		this.score = 0;
		this.highscore = localStorage.getItem('highscore') || 0;
		this.bonus = undefined;

		this.setHandlers();
		this.initMap(cellSize);
		this.resizeWindowByMapSizes();
		
		let historySize = cellSize/(playerSpeed/this.FPS);
		this.player = new Snake(5*this.map.cellSize, 4*this.map.cellSize, this.map.cellSize, playerSpeed, historySize);
		this.window.appendChild(this.player.entities[0].element);
	}

	setHandlers() {
		document.getElementById('game-button-left').onclick  = () => {this.player.move(-1, 0);}
		document.getElementById('game-button-up').onclick    = () => {this.player.move(0, 1);}
		document.getElementById('game-button-right').onclick = () => {this.player.move(1, 0);}
		document.getElementById('game-button-down').onclick  = () => {this.player.move(0, -1);}

		document.onkeydown = (e) => {
			e = e || window.event;

			if (e.keyCode == '37') // Left
				this.player.move(-1, 0);
			else if (e.keyCode == '38') // Up
				this.player.move(0, 1);
			else if (e.keyCode == '39') // Right
				this.player.move(1, 0);
			else if (e.keyCode == '40') // Down
				this.player.move(0, -1);
		}
	}

	initMap(cellSize) {
		this.window.textContent = '';

		let bounds = this.window.getBoundingClientRect();
		let widthCount = Math.floor(bounds.width / cellSize);
		let heightCount = Math.floor(bounds.height / cellSize);

		this.map = new Array(widthCount);
		for (let i = 0; i < widthCount; i++) {
			this.map[i] = new Array(heightCount);

			for (let j = 0; j < heightCount; j++) {
				let cell = new Cell(i*cellSize, j*cellSize, cellSize);
				this.map[i][j] = cell;
				this.window.appendChild(cell.element);
			}
		}

		this.map.widthCount = widthCount;
		this.map.heightCount = heightCount;
		this.map.cellSize = cellSize;
	}

	checkAndPickBonus() {
		// for (let i = 0; i < this.map.widthCount; i++) {
		// 	for (let j = 0; j < this.map.heightCount; j++) {
				let cell = this.bonus; //this.map[i][j];

				if (!cell.isEnabled)
					return; //continue;

				let headX = this.player.entities[0].positionX;
				let headY = this.player.entities[0].positionY;

				let lengthX = headX - cell.positionX;
				let lengthY = headY - cell.positionY;
				let length = Math.sqrt(lengthX*lengthX + lengthY*lengthY);

				if (length < this.map.cellSize*0.3) {
					this.player.appendChild('game-snake-tail-' + cell.imageNumber);
					cell.disable();
					this.bonus = undefined;
					this.score += 5;
					this.playerSpeed += 10;
				}
		// 	}
		// }
	}

	resizeWindowByMapSizes() {
		this.window.style.width = this.map.widthCount*this.map.cellSize - 2 + 'px'; // -2 to remove right side border of window
		this.window.style.height = this.map.heightCount*this.map.cellSize - 2 + 'px'; // -2 to remove bottom side border of window
	}

	update(delta) {
		if (!this.player.isAlive) {
			if (this.highscore < this.score) {
				this.highscore = this.score;
				localStorage.setItem('highscore', this.highscore);
			}

			this.score = 0;
			this.player.reset(Math.floor(this.map.cellSize*this.map.widthCount/2), Math.floor(this.map.cellSize*this.map.heightCount/2));
		}


		while (this.bonus === undefined) {
			let i = Math.floor(Math.random() * this.map.widthCount);
			let j = Math.floor(Math.random() * this.map.heightCount);
			let found = false;

			for (let k = 0; k < this.player.entities.length; k++) {
				if (i != Math.floor(this.player.entities[k].positionX/this.player.entities[k].size) &&
					j != Math.floor(this.player.entities[k].positionY/this.player.entities[k].size)) {
					found = true;
					break;
				}
			}

			if (!found)
				continue;

			this.bonus = this.map[i][j];
			this.bonus.enable();
		}


		this.player.update(delta, this.map);
		this.checkAndPickBonus();

		document.getElementById('game-score-value').textContent = this.score;
		document.getElementById('game-highscore-value').textContent = this.highscore;
		document.getElementById('game-ms-value').textContent = Math.round(100 * 1000/this.FPS) / 100;
	}

	render() {
		this.player.render();
	}

	start() {
		let delta = 1000 / this.FPS;

		let tmp = setInterval(() => {
			this.update(delta);
			this.render();
		}, delta);
	}
}

document.addEventListener("DOMContentLoaded", () => {
	let game = new Game()
	game.start();
});


