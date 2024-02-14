const randomInt = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
export class Enemy {
    private x: number;
    private y: number;
    private speed: number;
    private direction: number; //ラジアンね
    private width: number;
    private height: number;

    constructor(width: number, height: number, speed = 1) {
        this.width = width;
        this.height = height;
        this.x = randomInt(0, width);
        this.y = randomInt(0, height);
        this.speed = speed;
        this.direction = Math.random() * Math.PI * 2;
    }
    next() {
        this.x += Math.cos(this.direction) * this.speed;
        this.y += Math.sin(this.direction) * this.speed;
        if (this.x < 0 || this.x > this.width) {
            this.direction = Math.PI - this.direction;
        }
        if (this.y < 0 || this.y > this.height) {
            this.direction = -this.direction;
        }
    }
    getPos() {
        return { x: this.x, y: this.y };
    }
    setSpeed(speed: number) {
        this.speed = speed;
    }
}
