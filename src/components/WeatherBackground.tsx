import React, { useMemo } from "react";
import Lottie from "lottie-react";
import { cn } from "../lib/utils";

// Tipos para configuração de clima
type WeatherCondition =
  | "sun"
  | "cloud"
  | "cloud-sun"
  | "rain"
  | "thunderstorm"
  | "Clear"
  | "Clouds"
  | "Rain"
  | "Drizzle"
  | "Thunderstorm"
  | "Snow"
  | "Mist"
  | "Fog"
  | "Haze";

interface AnimationLayer {
  src: string;
  zIndex: number;
  style?: React.CSSProperties;
  opacity?: number;
  /** Se true, usa "meet" para mostrar animação completa, se false usa "slice" para preencher */
  preserveFull?: boolean;
  /** Número de vezes para repetir esta camada (multiplicar elementos) */
  repeat?: number;
  /** Offsets para cada repetição [{ top, left, scale }] */
  repeatOffsets?: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
    scale?: number;
  }[];
}

interface WeatherConfig {
  folder: string;
  files: AnimationLayer[];
  /** Cor de fundo do card para maior imersão */
  backgroundColor?: string;
}

// Configuração de mapeamento de clima para arquivos Lottie
// Estrutura: Folder Name + Array de Arquivos
const WEATHER_CONFIG: Record<string, WeatherConfig> = {
  // Dia ensolarado - Sol + Pássaros + Animações da pasta Dia Ensolarado
  sun: {
    folder: "Clima Tempo/Dia Ensolarado",
    backgroundColor:
      "linear-gradient(180deg, #FEF3C7 0%, #FCD34D 30%, #FBBF24 60%, #F59E0B 100%)",
    files: [
      // Summer breeze - Animação principal ocupando todo o card
      {
        src: "Summer breeze.json",
        zIndex: 1,
        opacity: 0.9,
        style: {
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
        },
      },
      // Happy SUN - Posicionado no canto superior direito, cobrindo o sol ao fundo
      {
        src: "Happy SUN.json",
        zIndex: 2,
        opacity: 1,
        style: {
          position: "absolute",
          top: "-15%",
          right: "-7%",
          width: "25%",
          height: "auto",
        },
      },
    ],
  },
  Clear: {
    folder: "Clima Tempo/Dia Ensolarado",
    backgroundColor:
      "linear-gradient(180deg, #FEF3C7 0%, #FCD34D 30%, #FBBF24 60%, #F59E0B 100%)",
    files: [
      // Summer breeze - Animação principal ocupando todo o card
      {
        src: "Summer breeze.json",
        zIndex: 1,
        opacity: 0.9,
        style: {
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
        },
      },
      // Happy SUN - Posicionado no canto superior direito, cobrindo o sol ao fundo
      {
        src: "Happy SUN.json",
        zIndex: 2,
        opacity: 1,
        style: {
          position: "absolute",
          top: "-3%",
          right: "-5%",
          width: "25%",
          height: "auto",
        },
      },
    ],
  },

  // Dia nublado - Múltiplas nuvens pequenas voando + Vento
  cloud: {
    folder: "Clima Tempo/Dia Nublado",
    backgroundColor:
      "linear-gradient(180deg, #9CA3AF 0%, #6B7280 30%, #4B5563 60%, #374151 100%)", // Cinza nublado imersivo
    files: [
      // Múltiplas nuvens pequenas voando (sem névoa de fundo)
      {
        src: "Weather-mist.json",
        zIndex: 1,
        opacity: 0.6,
        repeat: 10,
        repeatOffsets: [
          { top: "8%", left: "5%", scale: 0.2 },
          { top: "15%", left: "25%", scale: 0.18 },
          { top: "25%", left: "12%", scale: 0.22 },
          { top: "10%", left: "45%", scale: 0.19 },
          { top: "35%", left: "35%", scale: 0.21 },
          { top: "20%", left: "65%", scale: 0.17 },
          { top: "45%", left: "18%", scale: 0.2 },
          { top: "50%", left: "75%", scale: 0.18 },
          { top: "30%", left: "55%", scale: 0.19 },
          { top: "60%", left: "42%", scale: 0.21 },
        ],
        style: {
          position: "absolute",
          width: "12%",
          height: "auto",
        },
      },
      // Animação de vento
      {
        src: "Weather Wind.json",
        zIndex: 2,
        opacity: 0.65,
        repeat: 2,
        repeatOffsets: [
          { top: "20%", left: "-10%", scale: 1 },
          { top: "55%", left: "40%", scale: 0.9 },
        ],
        style: {
          position: "absolute",
          width: "60%",
          height: "auto",
        },
      },
    ],
  },
  Clouds: {
    folder: "Clima Tempo/Dia Nublado",
    backgroundColor:
      "linear-gradient(180deg, #9CA3AF 0%, #6B7280 30%, #4B5563 60%, #374151 100%)", // Cinza nublado imersivo
    files: [
      // Múltiplas nuvens pequenas voando (sem névoa de fundo)
      {
        src: "Weather-mist.json",
        zIndex: 1,
        opacity: 0.6,
        repeat: 10,
        repeatOffsets: [
          { top: "8%", left: "5%", scale: 0.2 },
          { top: "15%", left: "25%", scale: 0.18 },
          { top: "25%", left: "12%", scale: 0.22 },
          { top: "10%", left: "45%", scale: 0.19 },
          { top: "35%", left: "35%", scale: 0.21 },
          { top: "20%", left: "65%", scale: 0.17 },
          { top: "45%", left: "18%", scale: 0.2 },
          { top: "50%", left: "75%", scale: 0.18 },
          { top: "30%", left: "55%", scale: 0.19 },
          { top: "60%", left: "42%", scale: 0.21 },
        ],
        style: {
          position: "absolute",
          width: "12%",
          height: "auto",
        },
      },
      // Animação de vento
      {
        src: "Weather Wind.json",
        zIndex: 2,
        opacity: 0.65,
        repeat: 2,
        repeatOffsets: [
          { top: "60%", left: "-10%", scale: 1 },
          { top: "55%", left: "40%", scale: 0.9 },
        ],
        style: {
          position: "absolute",
          width: "60%",
          height: "auto",
        },
      },
    ],
  },
  Mist: {
    folder: "Clima Tempo/Dia Nublado",
    files: [
      {
        src: "Weather-mist.json",
        zIndex: 1,
        opacity: 0.85,
        style: {
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
        },
      },
    ],
    backgroundColor:
      "linear-gradient(180deg, #9CA3AF 0%, #6B7280 50%, #4B5563 100%)",
  },
  Fog: {
    folder: "Clima Tempo/Dia Nublado",
    files: [
      {
        src: "Weather-mist.json",
        zIndex: 1,
        opacity: 0.9,
        style: {
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
        },
      },
    ],
    backgroundColor:
      "linear-gradient(180deg, #D1D5DB 0%, #9CA3AF 50%, #6B7280 100%)",
  },
  Haze: {
    folder: "Clima Tempo/Dia Nublado",
    files: [
      {
        src: "Weather-mist.json",
        zIndex: 1,
        opacity: 0.7,
        style: {
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
        },
      },
    ],
    backgroundColor:
      "linear-gradient(180deg, #E5E7EB 0%, #D1D5DB 50%, #9CA3AF 100%)",
  },

  // Parcialmente nublado - Sol centralizado + Pássaros voando sobre o sol + Nuvens
  "cloud-sun": {
    folder: "Clima Tempo/Dia Sol",
    backgroundColor:
      "linear-gradient(180deg, #1E40AF 0%, #1E3A8A 30%, #1E293B 60%, #0F172A 100%)", // Azul escuro para parcialmente nublado
    files: [
      {
        src: "Sunrise - Breathe in Breathe out.json",
        zIndex: 1,
        opacity: 0.85,
        style: {
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "70%",
          height: "auto",
        },
      },
      {
        src: "Birds.json",
        zIndex: 2, // Pássaros sobre o sol
        opacity: 0.75,
        style: {
          position: "absolute",
          top: "15%",
          left: "5%",
          width: "40%",
          height: "auto",
        },
      },
      {
        src: "Birds.json",
        zIndex: 2, // Segunda camada de pássaros
        opacity: 0.7,
        style: {
          position: "absolute",
          top: "25%",
          left: "55%",
          width: "35%",
          height: "auto",
        },
      },
    ],
  },

  // Dia de chuva - preenche todo o card com zoom reduzido
  rain: {
    folder: "Clima Tempo/Dia de Chuva",
    files: [
      {
        src: "Rainy Night.json",
        zIndex: 1,
        opacity: 1,
        preserveFull: false,
        style: {
          position: "absolute",
          top: "45%",
          left: "45%",
          transform: "translate(-50%, -50%)",
          width: "110%", // Um pouco maior para reduzir zoom
          height: "110%", // Um pouco maior para reduzir zoom
        },
      },
    ],
  },
  Rain: {
    folder: "Clima Tempo/Dia de Chuva",
    files: [
      {
        src: "Rainy Night.json",
        zIndex: 1,
        opacity: 1,
        preserveFull: false,
        style: {
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "115%",
          height: "115%",
        },
      },
    ],
  },
  Drizzle: {
    folder: "Clima Tempo/Dia de Chuva",
    files: [
      {
        src: "Rainy Night.json",
        zIndex: 1,
        opacity: 0.9,
        preserveFull: false,
        style: {
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "115%",
          height: "115%",
        },
      },
    ],
  },

  // Tempestade - Linha de nuvens no topo + Chuva
  thunderstorm: {
    folder: "Clima Tempo/Dia de Tempestade",
    backgroundColor:
      "linear-gradient(180deg, #4C1D95 0%, #5B21B6 20%, #6B21A8 40%, #374151 70%, #1F2937 100%)", // Roxo escuro para cinza tempestuoso
    files: [
      // Linha de mini nuvens de raio no topo - da esquerda para direita, encostadas na borda
      {
        src: "Thunder Night.json",
        zIndex: 2,
        opacity: 0.9,
        repeat: 20,
        repeatOffsets: [
          { top: "-2%", left: "-2%", scale: 0.4 },
          { top: "-1%", left: "6%", scale: 0.42 },
          { top: "-2%", left: "14%", scale: 0.4 },
          { top: "-1%", left: "22%", scale: 0.41 },
          { top: "-2%", left: "30%", scale: 0.4 },
          { top: "-1%", left: "38%", scale: 0.42 },
          { top: "-2%", left: "46%", scale: 0.4 },
          { top: "-1%", left: "54%", scale: 0.41 },
          { top: "-2%", left: "62%", scale: 0.4 },
          { top: "-1%", left: "70%", scale: 0.42 },
          { top: "-2%", left: "78%", scale: 0.4 },
          { top: "-1%", left: "86%", scale: 0.41 },
          { top: "-2%", left: "94%", scale: 0.4 },
          { top: "0%", left: "2%", scale: 0.38 },
          { top: "0%", left: "18%", scale: 0.39 },
          { top: "0%", left: "34%", scale: 0.38 },
          { top: "0%", left: "50%", scale: 0.39 },
          { top: "0%", left: "66%", scale: 0.38 },
          { top: "0%", left: "82%", scale: 0.39 },
          { top: "0%", left: "98%", scale: 0.38 },
        ],
        style: {
          position: "absolute",
          width: "25%",
          height: "auto",
          mixBlendMode: "screen" as const, // Remove fundo branco
        },
      },
      // Animação de chuva forte cobrindo todo o card
      {
        src: "Rain.json",
        zIndex: 3,
        opacity: 0.9,
        style: {
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
        },
      },
    ],
  },
  Thunderstorm: {
    folder: "Clima Tempo/Dia de Tempestade",
    backgroundColor:
      "linear-gradient(180deg, #4C1D95 0%, #5B21B6 20%, #6B21A8 40%, #374151 70%, #1F2937 100%)", // Roxo escuro para cinza tempestuoso
    files: [
      // Linha de mini nuvens de raio no topo - da esquerda para direita, encostadas na borda
      {
        src: "Thunder Night.json",
        zIndex: 2,
        opacity: 0.9,
        repeat: 30,
        repeatOffsets: [
          { top: "-2%", left: "-2%", scale: 0.4 },
          { top: "-1%", left: "6%", scale: 0.42 },
          { top: "-2%", left: "14%", scale: 0.4 },
          { top: "-1%", left: "22%", scale: 0.41 },
          { top: "-2%", left: "30%", scale: 0.4 },
          { top: "-1%", left: "38%", scale: 0.42 },
          { top: "-2%", left: "46%", scale: 0.4 },
          { top: "-1%", left: "54%", scale: 0.41 },
          { top: "-2%", left: "62%", scale: 0.4 },
          { top: "-1%", left: "70%", scale: 0.42 },
          { top: "-2%", left: "78%", scale: 0.4 },
          { top: "-1%", left: "86%", scale: 0.41 },
          { top: "-2%", left: "94%", scale: 0.4 },
          { top: "0%", left: "2%", scale: 0.38 },
          { top: "0%", left: "18%", scale: 0.39 },
          { top: "0%", left: "34%", scale: 0.38 },
          { top: "0%", left: "50%", scale: 0.39 },
          { top: "0%", left: "66%", scale: 0.38 },
          { top: "0%", left: "82%", scale: 0.39 },
          { top: "0%", left: "98%", scale: 0.38 },
        ],
        style: {
          position: "absolute",
          width: "25%",
          height: "auto",
          mixBlendMode: "screen" as const, // Remove fundo branco
        },
      },
      // Animação de chuva forte cobrindo todo o card
      {
        src: "Rain.json",
        zIndex: 3,
        opacity: 0.9,
        style: {
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
        },
      },
    ],
  },

  // Neve (usa névoa)
  Snow: {
    folder: "Clima Tempo/Dia Nublado",
    files: [
      {
        src: "Weather-mist.json",
        zIndex: 1,
        opacity: 0.8,
        style: {
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
        },
      },
    ],
  },
};

// Arquivos compartilhados disponíveis na raiz (podem ser usados em qualquer clima)
const SHARED_ANIMATIONS = {
  wind: "/Clima Tempo/Weather Wind.json",
  windyColored: "/Clima Tempo/Windy new color.json",
};

interface WeatherBackgroundProps {
  weatherMain: WeatherCondition | string;
  theme?: "light" | "dark";
  className?: string;
  /** Adiciona camadas extras de animação */
  extraLayers?: AnimationLayer[];
  /** Se deve incluir vento como camada extra (usando arquivo compartilhado) */
  includeWind?: boolean;
}

interface LottieLayerProps {
  src: string;
  style?: React.CSSProperties;
  opacity?: number;
  zIndex: number;
  preserveFull?: boolean;
}

const LottieLayer: React.FC<LottieLayerProps> = ({
  src,
  style,
  opacity = 1,
  zIndex,
  preserveFull = false,
}) => {
  const [animationData, setAnimationData] = React.useState<object | null>(null);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    const loadAnimation = async () => {
      try {
        const response = await fetch(src);
        if (!response.ok) throw new Error(`Failed to load: ${src}`);
        const data = await response.json();
        setAnimationData(data);
        setError(false);
      } catch (err) {
        console.error(`Erro ao carregar animação Lottie: ${src}`, err);
        setError(true);
      }
    };

    loadAnimation();
  }, [src]);

  if (error || !animationData) {
    return null;
  }

  return (
    <div
      style={{
        ...style,
        opacity,
        zIndex,
        pointerEvents: "none",
      }}
    >
      <Lottie
        animationData={animationData}
        loop
        autoplay
        style={{ width: "100%", height: "100%" }}
        rendererSettings={{
          // "xMinYMid meet" - alinha à esquerda, centraliza verticalmente, mostra completo
          // "xMidYMid slice" - centraliza e preenche cortando se necessário
          preserveAspectRatio: preserveFull
            ? "xMinYMid meet"
            : "xMinYMid slice",
        }}
      />
    </div>
  );
};

export const WeatherBackground: React.FC<WeatherBackgroundProps> = ({
  weatherMain,
  className,
  extraLayers = [],
  includeWind = false,
}) => {
  // Obtém a configuração baseada no tipo de clima
  const config = useMemo(() => {
    // Tenta encontrar configuração exata primeiro
    if (WEATHER_CONFIG[weatherMain]) {
      return WEATHER_CONFIG[weatherMain];
    }

    // Fallback para nublado se não encontrar
    return WEATHER_CONFIG.cloud;
  }, [weatherMain]);

  // Constrói as camadas de animação (com suporte a repetição)
  const layers = useMemo(() => {
    const allLayers: (AnimationLayer & {
      fullPath: string;
      uniqueKey: string;
    })[] = [];

    // Adiciona camadas da configuração (Folder Name + Array de Arquivos)
    config.files.forEach((file, fileIndex) => {
      const basePath = `/${config.folder}/${file.src}`;

      if (file.repeat && file.repeatOffsets && file.repeatOffsets.length > 0) {
        // Multiplica o elemento conforme especificado
        file.repeatOffsets.forEach((offset, repeatIndex) => {
          const scale = offset.scale || 1;
          const computedStyle: React.CSSProperties = {
            ...file.style,
            ...(offset.top && { top: offset.top }),
            ...(offset.left && { left: offset.left }),
            ...(offset.right && { right: offset.right }),
            ...(offset.bottom && { bottom: offset.bottom }),
            transform: scale !== 1 ? `scale(${scale})` : file.style?.transform,
            transformOrigin: "top left",
          };

          allLayers.push({
            ...file,
            style: computedStyle,
            fullPath: basePath,
            uniqueKey: `${basePath}-${fileIndex}-${repeatIndex}`,
          });
        });
      } else {
        // Elemento único
        allLayers.push({
          ...file,
          fullPath: basePath,
          uniqueKey: `${basePath}-${fileIndex}`,
        });
      }
    });

    // Adiciona vento se solicitado (usando arquivo compartilhado)
    if (includeWind) {
      allLayers.push({
        src: "wind",
        fullPath: SHARED_ANIMATIONS.wind,
        uniqueKey: "shared-wind",
        zIndex: 10,
        opacity: 0.4,
        style: {
          position: "absolute",
          top: "20%",
          left: "-20%",
          width: "70%",
          height: "auto",
        },
      });
    }

    // Adiciona camadas extras
    extraLayers.forEach((layer, index) => {
      allLayers.push({
        ...layer,
        fullPath: layer.src.startsWith("/") ? layer.src : `/${layer.src}`,
        uniqueKey: `extra-${index}`,
      });
    });

    return allLayers;
  }, [config, extraLayers, includeWind]);

  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none",
        className
      )}
      style={{
        zIndex: 0,
        // Aplica backgroundColor diretamente no container
        background: config.backgroundColor || "transparent",
      }}
    >
      {/* Camadas de animação Lottie */}
      {layers.map((layer) => (
        <LottieLayer
          key={layer.uniqueKey}
          src={layer.fullPath}
          style={layer.style as React.CSSProperties}
          opacity={layer.opacity}
          zIndex={layer.zIndex}
          preserveFull={layer.preserveFull}
        />
      ))}
    </div>
  );
};

// Função helper para obter backgroundColor de um clima
export const getWeatherBackgroundColor = (
  weatherMain: WeatherCondition | string
): string | undefined => {
  return WEATHER_CONFIG[weatherMain]?.backgroundColor;
};

// Exporta as configurações para uso externo se necessário
export { WEATHER_CONFIG, SHARED_ANIMATIONS };
export type { WeatherCondition, WeatherConfig, AnimationLayer };
