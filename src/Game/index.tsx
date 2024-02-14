import { GameEngine } from "./game";
import style from "./style.module.scss";
import { useGameHook } from "./hook";

export const Game = () => {
    const { endFlag, gameRef, canvasRef, scaleRef, score, enemyCount } =
        useGameHook();

    return (
        <>
            <div className={style.function}>
                <button
                    className={style.button}
                    onClick={() => {
                        if (endFlag.current) {
                            gameRef.current?.destroy();
                            gameRef.current = canvasRef.current
                                ? new GameEngine(
                                      canvasRef.current,
                                      scaleRef.current
                                  )
                                : undefined;
                        }
                        gameRef.current?.start();
                        endFlag.current = false;
                    }}
                >
                    Start
                </button>
                <div className={style.scorePanel}>
                    <span>Score: {score}</span>
                    <span>Enemy: {enemyCount}</span>
                </div>
                <button
                    className={style.button}
                    onClick={() => {
                        gameRef.current?.destroy();
                        endFlag.current = true;
                    }}
                >
                    End
                </button>
            </div>
            <div className={style.gamePanel}>
                <canvas ref={canvasRef}></canvas>
            </div>
        </>
    );
};
