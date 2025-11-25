import { useEffect } from "react";

interface Props {
  onFinish: () => void;
}

export default function SplashIntro({ onFinish }: Props) {
  useEffect(() => {
    const t = setTimeout(onFinish, 2500); // dura 2.5s
    return () => clearTimeout(t);
  }, [onFinish]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="relative">
        {/* “Glow” detrás del logo */}
        <div className="absolute inset-0 blur-3xl bg-emerald-500/40 scale-150 animate-pulse" />
        {/* Logo Vendix */}
        <img
          src="/images/logo/letras-logo2.png"
          alt="Vendix"
          className="relative z-10 w-56 h-auto animate-vendixIntro"
        />
      </div>
    </div>
  );
}
