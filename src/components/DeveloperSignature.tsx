import { useEffect, useRef } from "react";

interface SignatureProps {
  theme?: "light" | "dark";
}

export const DeveloperSignature = ({ theme = "dark" }: SignatureProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 200 * dpr;
    canvas.height = 60 * dpr;
    canvas.style.width = "200px";
    canvas.style.height = "60px";
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, 200, 60);

    // Signature style - handwritten cursive
    ctx.font =
      "italic 24px 'Brush Script MT', cursive, 'Dancing Script', 'Pacifico'";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const text = "Desenvolvido por Daniel Pires";
    const x = 100;
    const y = 30;

    // Create RGB neon/saber effect
    // Red layer (shadow)
    ctx.shadowBlur = 8;
    ctx.shadowColor = "rgba(255, 0, 0, 0.8)";
    ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
    ctx.fillText(text, x - 1.5, y);

    // Green layer (shadow)
    ctx.shadowColor = "rgba(0, 255, 0, 0.8)";
    ctx.fillStyle = "rgba(0, 255, 0, 0.3)";
    ctx.fillText(text, x, y);

    // Blue layer (shadow)
    ctx.shadowColor = "rgba(0, 0, 255, 0.8)";
    ctx.fillStyle = "rgba(0, 0, 255, 0.3)";
    ctx.fillText(text, x + 1.5, y);

    // Main text (white with glow)
    ctx.shadowBlur = 10;
    ctx.shadowColor =
      theme === "dark" ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.6)";
    ctx.fillStyle = theme === "dark" ? "#ffffff" : "#000000";
    ctx.fillText(text, x, y);

    // Animate RGB shift
    let offset = 0;
    const animate = () => {
      ctx.clearRect(0, 0, 200, 60);

      const shift = Math.sin(offset) * 2;

      // Red
      ctx.shadowBlur = 8;
      ctx.shadowColor = "rgba(255, 0, 0, 0.8)";
      ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
      ctx.fillText(text, x - 1.5 + shift, y);

      // Green
      ctx.shadowColor = "rgba(0, 255, 0, 0.8)";
      ctx.fillStyle = "rgba(0, 255, 0, 0.3)";
      ctx.fillText(text, x, y);

      // Blue
      ctx.shadowColor = "rgba(0, 0, 255, 0.8)";
      ctx.fillStyle = "rgba(0, 0, 255, 0.3)";
      ctx.fillText(text, x + 1.5 - shift, y);

      // Main
      ctx.shadowBlur = 10;
      ctx.shadowColor =
        theme === "dark" ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.6)";
      ctx.fillStyle = theme === "dark" ? "#ffffff" : "#000000";
      ctx.fillText(text, x, y);

      offset += 0.05;
      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [theme]);

  return (
    <div
      className="w-full py-4 flex justify-center items-center"
      style={{
        background: "transparent",
        borderTop:
          theme === "dark"
            ? "1px solid rgba(255, 255, 255, 0.05)"
            : "1px solid rgba(0, 0, 0, 0.05)",
      }}
    >
      <canvas
        ref={canvasRef}
        className="opacity-70 hover:opacity-100 transition-opacity duration-300 cursor-default"
      />
    </div>
  );
};
