import { Enemy } from "./enemy";

const enemySize = 3;
const hitSize = 5;
const startEnemyCount = 100; //100*50ms = 5s
const defaultFrameTime = 50; //ms
const shotRate = 1000 / 9.75; //ms 9.75発/秒
type GameEvent = "start" | "end" | "kill" | "spawn";

export class GameEngine {
    //描画用パラメータ
    private viewCanvas: HTMLCanvasElement;
    private viewCtx: CanvasRenderingContext2D;
    private bufferCanvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private scale: number;

    //更新用パラメータ
    private frameTime: number;
    private timerId: number | null = null;
    private endRender: boolean = true;
    private blockDraw: boolean = false;

    //ゲーム用パラメータ
    private enemys: Enemy[] = [];
    private beforeEnemyCount: number = startEnemyCount;
    private level: number = 1;
    private scope: { x: number; y: number } = { x: 0, y: 0 };
    private score: number = 0;

    //素材
    readonly shotSound = new Audio("/assets/nc230658.ogg");

    //その他
    eventFunc: {
        [key in GameEvent]?: () => void;
    } = {};
    evenlistener: {
        [key in string]: (e: MouseEvent) => void;
    } = {};

    constructor(
        canvas: HTMLCanvasElement,
        scale: number,
        { frameTime = defaultFrameTime } = {}
    ) {
        //とりあえず変数を全て格納
        this.viewCanvas = canvas;
        this.scale = scale;
        this.frameTime = frameTime;

        //バッファ用のキャンバスを作成
        this.bufferCanvas = document.createElement("canvas");
        this.bufferCanvas.width = canvas.width;
        this.bufferCanvas.height = canvas.height;

        //本物のキャンバスのコンテキストを取得
        const viewCtx = canvas.getContext("2d");
        if (!viewCtx) throw new Error("canvas 2d context is not available");
        this.viewCtx = viewCtx;
        //バッファ用のキャンバスのコンテキストを取得
        const ctx = this.bufferCanvas.getContext("2d");
        if (!ctx) throw new Error("canvas 2d context is not available");
        this.ctx = ctx;
        //バッファのみスケールを変更、描画キャンバスはコピーするだけ
        ctx.scale(scale, scale);
        titleScreen(ctx).then(() => {
            this.refresh();
        });

        //初期化
        this.initialize();
    }

    initialize() {
        const canvas = this.viewCanvas;
        const scale = this.scale;

        //最初の敵を生成
        this.enemys.push(
            new Enemy(
                canvas.width / scale - enemySize,
                canvas.height / scale - enemySize
            )
        );

        //クリック判定
        let shotTimer = 0;
        const onMouseDown = () => {
            this.shot();
            if (shotTimer) return;
            shotTimer = setInterval(() => {
                this.shot();
            }, shotRate);
        };
        const onMouseUp = () => {
            clearInterval(shotTimer);
            shotTimer = 0;
        };
        canvas.addEventListener("mousedown", onMouseDown);
        canvas.addEventListener("mouseup", onMouseUp);

        const onMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e;
            const rect = canvas.getBoundingClientRect();
            const x = (clientX - rect.left) / scale;
            const y = (clientY - rect.top) / scale;
            this.scope = { x, y };
        };
        canvas.addEventListener("mousemove", onMouseMove);

        //後で削除するために保存しておく
        this.evenlistener.mousemove = onMouseMove;
        this.evenlistener.mousedown = onMouseDown;
        this.evenlistener.mouseup = onMouseUp;

        this.eventFunc.start?.();
    }

    changeCtx(ctx: CanvasRenderingContext2D) {
        this.viewCtx = ctx;
    }

    start() {
        this.timerId = setInterval(async () => {
            if (!this.endRender) return; //前の描画が終わっていない場合はスキップ
            this.endRender = false;
            await this.draw();
            this.endRender = true;
        }, this.frameTime);
    }

    stop() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    }

    async end() {
        this.stop();
        await sleep(this.frameTime * 3); //最後の描画が終わるまで待つ
        gameoverScreen(this.ctx, this.score);
        this.refresh();
        this.blockDraw = true;
        this.eventFunc.end?.();
    }

    refresh() {
        if (this.blockDraw) return;
        this.viewCtx.drawImage(this.bufferCanvas, 0, 0);
    }

    shot() {
        if (this.timerId === null) return;
        this.shotSound.currentTime = 0;
        this.shotSound.play();
        for (const enemy of this.enemys) {
            const { x: ex, y: ey } = enemy.getPos(); //敵は右下に描画される
            const { x: sx, y: sy } = this.scope; //スコープは中心に描画される
            const dx = ex + enemySize / 2 - sx;
            const dy = ey + enemySize / 2 - sy;
            if (dx * dx + dy * dy < hitSize * hitSize) {
                this.enemys = this.enemys.filter((e) => e !== enemy);
                if (this.level < 40) {
                    //序盤は一気に増やす
                    this.level += 8;
                } else if (this.level > startEnemyCount - 10) {
                    //一定数を超えたら増やさない
                    this.level = startEnemyCount - 10;
                } else {
                    //それ以外は少しずつ増やす
                    this.level += 4;
                }
                this.eventFunc.kill?.();
                this.score += 1;
                break;
            }
        }
    }

    spawnEnemy() {
        //敵を生成
        if (this.beforeEnemyCount < this.level) {
            //一定数カウントが減ったら敵を生成
            this.enemys.push(
                new Enemy(
                    this.bufferCanvas.width / this.scale - enemySize,
                    this.bufferCanvas.height / this.scale - enemySize
                )
            );
            this.beforeEnemyCount = startEnemyCount; //カウントをリセット
            this.eventFunc.spawn?.();
        } else {
            //普段はカウントを減らす
            this.beforeEnemyCount -= 1;
        }

        if (this.enemys.length > 30) {
            this.end();
        }
    }

    async draw() {
        this.spawnEnemy();
        //バッファをクリア
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(
            0,
            0,
            this.bufferCanvas.width,
            this.bufferCanvas.height
        );
        //敵を描画
        for (const enemy of this.enemys) {
            enemy.next();
            const { x, y } = enemy.getPos();
            this.ctx.fillStyle = "red";
            this.ctx.fillRect(x, y, enemySize, enemySize);
        }
        //スコープを描画
        scopeRender(this.ctx, this.scope);
        //バッファを移す
        this.refresh();
    }

    on(event: GameEvent, func: () => void) {
        this.eventFunc[event] = func;
    }

    destroy() {
        this.end().then(() => {
            this.bufferCanvas.remove();
        });
        this.viewCanvas.removeEventListener(
            "mousedown",
            this.evenlistener.mousedown
        );
        this.viewCanvas.removeEventListener(
            "mouseup",
            this.evenlistener.mouseup
        );
        this.viewCanvas.removeEventListener(
            "mousemove",
            this.evenlistener.mousemove
        );
        this.enemys = [];
        this.eventFunc = {};
        this.shotSound.remove();
    }

    getEnemyCount() {
        return this.enemys.length;
    }
}

const scopeRender = (
    ctx: CanvasRenderingContext2D,
    { x, y }: { x: number; y: number }
) => {
    ctx.strokeStyle = "green";
    ctx.beginPath();

    //円を描く
    ctx.ellipse(x, y, hitSize, hitSize, 0, 0, Math.PI * 2);

    //十字の線を引く
    ctx.moveTo(x - hitSize, y);
    ctx.lineTo(x + hitSize, y);
    ctx.moveTo(x, y - hitSize);
    ctx.lineTo(x, y + hitSize);
    ctx.closePath();

    ctx.stroke();
};

const titleScreen = (ctx: CanvasRenderingContext2D) => {
    return new Promise<void>((resolve, reject) => {
        ctx.save();
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, 200, 150);
        ctx.fillStyle = "black";
        ctx.textBaseline = "top";
        ctx.font = "12px sans-serif";
        ctx.fillText("フルオートは弱いよ（笑）", 10, 15);
        const timer = setTimeout(() => {
            reject();
        }, 1000);
        const img = document.createElement("img");
        img.onload = () => {
            ctx.drawImage(img, 65, 40, 100, 100);
            clearTimeout(timer);
            resolve();
        };
        img.src = "/icon.svg";
        ctx.restore(); //画像貼るだけなので先にrestoreする
    });
};

const gameoverScreen = async (ctx: CanvasRenderingContext2D, score: number) => {
    ctx.save();
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 200, 150);
    ctx.fillStyle = "black";
    ctx.textBaseline = "top";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ゲームオーバー", 100, 60);
    ctx.font = "8px sans-serif";
    ctx.fillText(`スコア: ${score ?? 0}`, 100, 80);
    ctx.restore();
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
