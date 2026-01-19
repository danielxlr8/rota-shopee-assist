import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SignatureAnimationProps {
  onComplete: () => void;
}

export const SignatureAnimation = ({ onComplete }: SignatureAnimationProps) => {
  const [showDev, setShowDev] = useState(false);

  useEffect(() => {
    // Após 2.5 segundos (tempo da assinatura ser desenhada), mostra "Dev"
    const devTimer = setTimeout(() => {
      setShowDev(true);
    }, 2500);

    // Após 4 segundos total, completa a animação e chama onComplete
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 4000);

    return () => {
      clearTimeout(devTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0f0f0f 100%)',
        }}
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Efeito de partículas de fundo */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: Math.random() * 3 + 1 + 'px',
                height: Math.random() * 3 + 1 + 'px',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: `hsl(${Math.random() * 360}, 100%, 70%)`,
              }}
              animate={{
                opacity: [0, 0.8, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Container da assinatura */}
        <div className="relative flex flex-col items-center">
          {/* SVG da assinatura "Daniel Pires" sendo desenhada */}
          <svg
            width="500"
            height="150"
            viewBox="0 0 500 150"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-2xl"
          >
            {/* Definição do gradiente RGB animado */}
            <defs>
              <linearGradient id="signatureGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ff0000">
                  <animate
                    attributeName="stop-color"
                    values="#ff0000; #ff8800; #ffff00; #00ff00; #00ffff; #0000ff; #8800ff; #ff0000"
                    dur="4s"
                    repeatCount="indefinite"
                  />
                </stop>
                <stop offset="25%" stopColor="#ffff00">
                  <animate
                    attributeName="stop-color"
                    values="#ffff00; #00ff00; #00ffff; #0000ff; #8800ff; #ff0000; #ff8800; #ffff00"
                    dur="4s"
                    repeatCount="indefinite"
                  />
                </stop>
                <stop offset="50%" stopColor="#00ff00">
                  <animate
                    attributeName="stop-color"
                    values="#00ff00; #00ffff; #0000ff; #8800ff; #ff0000; #ff8800; #ffff00; #00ff00"
                    dur="4s"
                    repeatCount="indefinite"
                  />
                </stop>
                <stop offset="75%" stopColor="#00ffff">
                  <animate
                    attributeName="stop-color"
                    values="#00ffff; #0000ff; #8800ff; #ff0000; #ff8800; #ffff00; #00ff00; #00ffff"
                    dur="4s"
                    repeatCount="indefinite"
                  />
                </stop>
                <stop offset="100%" stopColor="#0000ff">
                  <animate
                    attributeName="stop-color"
                    values="#0000ff; #8800ff; #ff0000; #ff8800; #ffff00; #00ff00; #00ffff; #0000ff"
                    dur="4s"
                    repeatCount="indefinite"
                  />
                </stop>
              </linearGradient>
              
              {/* Filtro de brilho */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Path da assinatura cursiva "Daniel Pires" - mais elaborada e fluida */}
            <motion.path
              d="M 40 75 Q 50 50, 65 70 Q 75 85, 85 65 Q 95 50, 105 70 L 115 85 Q 125 95, 135 80 Q 145 65, 155 80 L 165 90 
                 M 185 75 Q 195 60, 205 75 Q 215 90, 225 70 L 235 85 Q 245 100, 255 80 
                 M 280 75 Q 290 55, 300 70 L 310 85 Q 320 100, 330 85 L 340 75 Q 350 60, 360 75 L 370 85 Q 380 95, 390 80 Q 400 65, 410 80 L 420 90 Q 430 100, 440 85 L 450 75"
              stroke="url(#signatureGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              filter="url(#glow)"
              initial={{
                pathLength: 0,
                opacity: 0,
              }}
              animate={{
                pathLength: 1,
                opacity: 1,
              }}
              transition={{
                pathLength: {
                  duration: 2,
                  ease: "easeInOut",
                },
                opacity: {
                  duration: 0.3,
                },
              }}
              style={{
                filter: 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.9))',
              }}
            />
          </svg>

          {/* Texto "Dev" aparecendo depois */}
          <AnimatePresence>
            {showDev && (
              <motion.div
                className="mt-8"
                initial={{ 
                  opacity: 0, 
                  y: 30,
                  scale: 0.5,
                }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  scale: 1,
                }}
                transition={{
                  duration: 0.6,
                  ease: "easeOut",
                }}
              >
                <div className="relative">
                  {/* Efeito de brilho RGB no texto com animação */}
                  <motion.div
                    className="absolute inset-0 blur-2xl"
                    animate={{
                      opacity: [0.3, 0.8, 0.3],
                      scale: [0.8, 1.2, 0.8],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{
                      background: 'linear-gradient(90deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
                      backgroundSize: '400% 400%',
                    }}
                  />
                  
                  {/* Texto "Dev" com efeito cromático */}
                  <motion.h2
                    className="relative text-7xl md:text-8xl font-bold tracking-widest"
                    style={{
                      fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif",
                      color: '#ffffff',
                      textShadow: `
                        0 0 20px rgba(255, 0, 0, 0.8),
                        3px 0 20px rgba(0, 255, 0, 0.8),
                        -3px 0 20px rgba(0, 0, 255, 0.8),
                        0 0 40px rgba(255, 255, 255, 0.5)
                      `,
                    }}
                    animate={{
                      textShadow: [
                        `0 0 20px rgba(255, 0, 0, 0.8), 3px 0 20px rgba(0, 255, 0, 0.8), -3px 0 20px rgba(0, 0, 255, 0.8)`,
                        `3px 0 20px rgba(255, 0, 0, 0.8), 0 0 20px rgba(0, 255, 0, 0.8), -3px 0 20px rgba(0, 0, 255, 0.8)`,
                        `-3px 0 20px rgba(255, 0, 0, 0.8), 3px 0 20px rgba(0, 255, 0, 0.8), 0 0 20px rgba(0, 0, 255, 0.8)`,
                        `0 0 20px rgba(255, 0, 0, 0.8), 3px 0 20px rgba(0, 255, 0, 0.8), -3px 0 20px rgba(0, 0, 255, 0.8)`,
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    Dev
                  </motion.h2>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Indicador de progresso animado */}
        <motion.div
          className="absolute bottom-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex gap-3">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #ff0000, #00ff00, #0000ff)',
                }}
                animate={{
                  scale: [1, 1.8, 1],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
