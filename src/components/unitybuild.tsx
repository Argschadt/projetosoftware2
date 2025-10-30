"use client";
import { useLayoutEffect, useRef, useState } from "react";

declare global {
  interface Window {
    createUnityInstance?: (
      canvas: HTMLCanvasElement,
      config: Record<string, unknown>,
      onProgress?: (progress: number) => void
    ) => Promise<{ Quit: () => Promise<void> }>;
  }
}

interface UnityBuildProps {
  buildPath: string; // Ex: "/unity/Build"
  width?: number;
  height?: number;
}

export default function UnityBuild({
  buildPath,
  width = 1280,
  height = 820,
}: UnityBuildProps) {
  const unityRef = useRef<HTMLCanvasElement>(null);
  const unityInstanceRef = useRef<{ Quit: () => Promise<void> } | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    if (!unityRef.current || unityInstanceRef.current) return;

    const canvas = unityRef.current;
    canvas.id = "unity-canvas"; // garante id válido
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const loaderUrl = `${buildPath}/testesMapBuild.loader.js`;
    const config = {
      dataUrl: `${buildPath}/testesMapBuild.data`,
      frameworkUrl: `${buildPath}/testesMapBuild.framework.js`,
      codeUrl: `${buildPath}/testesMapBuild.wasm`,
      streamingAssetsUrl: "StreamingAssets",
      companyName: "MyCompany",
      productName: "MyUnityApp",
      productVersion: "1.0",
      devicePixelRatio: 1,
      matchWebGLToCanvasSize: false, // evita redimensionamento automático
      canvasId: "unity-canvas", // garante compatibilidade
    };

    const script = document.createElement("script");
    script.src = loaderUrl;
    script.async = true;

    script.onload = () => {
      if (window.createUnityInstance) {
        window
          .createUnityInstance(canvas, config, (progress: number) => {
            setLoadingProgress(Math.round(progress * 100));
          })
          .then((instance: { Quit: () => Promise<void> }) => {
            unityInstanceRef.current = instance;
          })
          .catch((err: { message?: string }) => setError(err.message || 'Erro desconhecido'));
      }
    };

    document.body.appendChild(script);

    return () => {
      if (unityInstanceRef.current) {
        unityInstanceRef.current.Quit().catch(() => {});
        unityInstanceRef.current = null;
      }
      document.body.removeChild(script);
    };
  }, [buildPath, width, height]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-screen bg-black text-white">
      {error ? (
        <p className="text-red-500">Erro ao carregar Unity: {error}</p>
      ) : loadingProgress < 100 ? (
        <p>Carregando Unity... {loadingProgress}%</p>
      ) : null}

      <canvas ref={unityRef} className="bg-black" />
    </div>
  );
}
