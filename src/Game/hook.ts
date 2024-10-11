import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { GameEngine } from "./game";

export const useGameHook = () => {
    const [score, setScore] = useState(0);
    const [enemyCount, setEnemyCount] = useState(0);

    const endFlag = useRef(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameRef = useRef<GameEngine>();
    const scaleRef = useRef(1);

    const onKillEvent = useCallback(() => {
        setScore((prev) => prev + 1);
        setEnemyCount((prev) => (prev == 0 ? 0 : prev - 1));
    }, [gameRef.current]);

    const onSpawnEvent = useCallback(() => {
        setEnemyCount((prev) => prev + 1);
    }, [gameRef.current]);

    const onEndEvent = useCallback(() => {
        endFlag.current = true;
        setEnemyCount(0);
    }, [gameRef.current]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        //サイズ調整する
        let scale = Math.min(
            Math.floor(window.innerWidth / 200),
            Math.floor(window.innerHeight / 150)
        );
        scale--;
        if (scale <= 0) scale = 1;
        canvas.width = 200 * scale;
        canvas.height = 150 * scale;
        scaleRef.current = scale;

        //描画コンテキストを取得
        const ctx = canvas.getContext("2d");
        if (!ctx || !canvasRef.current) return;
        gameRef.current = new GameEngine(canvasRef.current, scale);
        gameRef.current.on("kill", onKillEvent);
        gameRef.current.on("spawn", onSpawnEvent);
        gameRef.current.on("end", onEndEvent);
    }, [canvasRef.current]);

    return {
        score,
        enemyCount,
        endFlag,
        canvasRef,
        gameRef,
        scaleRef,
    };
};
