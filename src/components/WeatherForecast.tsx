import React, { useState, useEffect } from "react";
import { Cloud, CloudRain, Sun, CloudSun, CloudLightning, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "../lib/utils";
import { WeatherBackground, getWeatherBackgroundColor } from "./WeatherBackground";

interface WeatherData {
  date: string;
  day: string;
  high: number;
  low: number;
  icon: "sun" | "cloud" | "cloud-sun" | "rain" | "thunderstorm";
  description: string;
  hourly?: HourlyWeather[];
}

interface HourlyWeather {
  time: string;
  temp: number;
  icon: "sun" | "cloud" | "cloud-sun" | "rain" | "thunderstorm";
  description: string;
}

interface WeatherForecastProps {
  city: string;
  hub?: string;
  theme?: "light" | "dark";
  showDetailed?: boolean;
  onDayClick?: (day: WeatherData) => void;
  selectedDay?: string | null;
}

// Função para buscar dados de clima (mock por enquanto - pode ser substituída por API real)
const fetchWeatherData = async (_city: string): Promise<WeatherData[]> => {
  // Simulação de dados de clima para 8 dias (para ocupar melhor o espaço)
  const days = ["Qui", "Sex", "Sáb", "Dom", "Seg", "Ter", "Qua", "Qui"];
  const today = new Date();
  
  const generateHourlyData = (baseTemp: number): HourlyWeather[] => {
    const hours: HourlyWeather[] = [];
    for (let i = 0; i < 24; i++) {
      const hour = String(i).padStart(2, "0") + ":00";
      const temp = baseTemp + Math.floor(Math.random() * 5) - 2;
      const iconIndex = Math.floor(Math.random() * 5);
      const icons: HourlyWeather["icon"][] = ["sun", "cloud", "cloud-sun", "rain", "thunderstorm"];
      const descriptions = ["Ensolarado", "Nublado", "Parcialmente nublado", "Chuvoso", "Tempestade"];
      
      hours.push({
        time: hour,
        temp,
        icon: icons[iconIndex],
        description: descriptions[iconIndex],
      });
    }
    return hours;
  };

  return days.map((day, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    
    const icons: WeatherData["icon"][] = ["sun", "cloud", "cloud-sun", "rain", "thunderstorm"];
    const iconIndex = Math.floor(Math.random() * icons.length);
    const high = 28 + Math.floor(Math.random() * 6);
    const low = high - 10 - Math.floor(Math.random() * 3);
    
    return {
      date: format(date, "yyyy-MM-dd"),
      day,
      high,
      low,
      icon: icons[iconIndex],
      description: iconIndex === 0 ? "Ensolarado" : iconIndex === 1 ? "Nublado" : iconIndex === 2 ? "Parcialmente nublado" : iconIndex === 3 ? "Chuvoso" : "Tempestade",
      hourly: generateHourlyData(high),
    };
  });
};

const getWeatherIcon = (icon: WeatherData["icon"], size: number = 24) => {
  switch (icon) {
    case "sun":
      return <Sun size={size} className="text-yellow-400" />;
    case "cloud":
      return <Cloud size={size} className="text-gray-400" />;
    case "cloud-sun":
      return <CloudSun size={size} className="text-yellow-400" />;
    case "rain":
      return <CloudRain size={size} className="text-blue-400" />;
    case "thunderstorm":
      return <CloudLightning size={size} className="text-purple-400" />;
    default:
      return <Cloud size={size} className="text-gray-400" />;
  }
};

export const WeatherForecast: React.FC<WeatherForecastProps> = ({
  city,
  hub: _hub,
  theme = "dark",
  showDetailed = false,
  onDayClick,
  selectedDay,
}) => {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailedDay, setDetailedDay] = useState<WeatherData | null>(null);

  useEffect(() => {
    const loadWeather = async () => {
      setLoading(true);
      try {
        const data = await fetchWeatherData(city);
        setWeatherData(data);
      } catch (error) {
        console.error("Erro ao carregar clima:", error);
      } finally {
        setLoading(false);
      }
    };

    loadWeather();
  }, [city]);

  const handleDayClick = (day: WeatherData) => {
    if (onDayClick) {
      onDayClick(day);
    } else {
      setDetailedDay(detailedDay?.date === day.date ? null : day);
    }
  };

  const displayDay = selectedDay ? weatherData.find((d) => d.date === selectedDay) || detailedDay : detailedDay;

  if (loading) {
    return (
      <div className={cn("p-4 rounded-lg", theme === "dark" ? "bg-slate-800/50" : "bg-white/50")}>
        <div className="text-center py-4">Carregando previsão do tempo...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      {/* Cabeçalho */}
      <div className="flex items-center gap-2">
        <Sun size={20} className={theme === "dark" ? "text-yellow-400" : "text-yellow-600"} />
        <h3 className={cn("font-semibold", theme === "dark" ? "text-white" : "text-slate-800")}>
          Previsão do Tempo
        </h3>
      </div>

      {/* Cards dos dias */}
      <div className="w-full">
        <div className="flex gap-2 w-full overflow-x-auto scrollbar-hide pb-2 md:pb-0">
          {weatherData.map((day) => {
            const isSelected = displayDay?.date === day.date;
            return (
              <button
                key={day.date}
                onClick={() => handleDayClick(day)}
                className={cn(
                  "flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all flex-1 min-w-[100px] md:min-w-0",
                  theme === "dark"
                    ? isSelected
                      ? "bg-orange-500/20 border-orange-500/50"
                      : "bg-slate-700/80 border-orange-500/30 hover:border-orange-500/50"
                    : isSelected
                    ? "bg-orange-100 border-orange-300"
                    : "bg-white border-slate-200 hover:border-orange-200",
                  showDetailed && "cursor-pointer"
                )}
              >
                <span className={cn("text-base font-semibold", theme === "dark" ? "text-gray-200" : "text-slate-700")}>
                  {day.day}
                </span>
                <div className="flex-shrink-0">
                  {getWeatherIcon(day.icon, 50)}
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className={cn("text-xl font-bold", theme === "dark" ? "text-white" : "text-slate-900")}>
                    {day.high}°
                  </span>
                  <span className={cn("text-base", theme === "dark" ? "text-gray-400" : "text-slate-600")}>
                    {day.low}°
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Previsão detalhada hora a hora */}
      {displayDay && displayDay.hourly && (
        <div
          className={cn(
            "p-4 rounded-lg border relative overflow-hidden",
            // Remove background padrão se houver backgroundColor customizado
            getWeatherBackgroundColor(displayDay.icon)
              ? "border-orange-500/30"
              : theme === "dark" 
                ? "bg-slate-800/90 border-orange-500/30" 
                : "bg-white border-orange-200"
          )}
        >
          {/* Animação de fundo Lottie baseada no tipo de clima */}
          <WeatherBackground 
            weatherMain={displayDay.icon} 
          />
          
          {/* Conteúdo sobreposto à animação */}
          <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className={cn("font-bold text-lg", theme === "dark" ? "text-white" : "text-slate-800")}>
                {displayDay.day} - {format(new Date(displayDay.date), "dd 'de' MMMM", { locale: ptBR })}
              </h4>
              <p className={cn("text-sm", theme === "dark" ? "text-gray-300" : "text-slate-600")}>
                {city}
              </p>
            </div>
            <button
              onClick={() => {
                setDetailedDay(null);
                if (onDayClick) onDayClick(displayDay);
              }}
              className={cn(
                "p-1 rounded-full hover:bg-opacity-20",
                theme === "dark" ? "text-gray-400 hover:bg-white" : "text-slate-400 hover:bg-slate-200"
              )}
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-orange-500/20">
            {getWeatherIcon(displayDay.icon, 48)}
            <div>
              <div className={cn("text-2xl font-bold", theme === "dark" ? "text-white" : "text-slate-800")}>
                {displayDay.high}°/{displayDay.low}°
              </div>
              <div className={cn("text-sm", theme === "dark" ? "text-gray-300" : "text-slate-600")}>
                {displayDay.description}
              </div>
            </div>
          </div>

          <div>
            <h5 className={cn("font-semibold mb-3", theme === "dark" ? "text-white" : "text-slate-800")}>
              Previsão Hora a Hora
            </h5>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-60 overflow-y-auto">
              {displayDay.hourly.map((hour, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded",
                    theme === "dark" ? "bg-slate-700/50" : "bg-slate-50"
                  )}
                >
                  <span className={cn("text-xs", theme === "dark" ? "text-gray-400" : "text-slate-600")}>
                    {hour.time}
                  </span>
                  {getWeatherIcon(hour.icon, 20)}
                  <span className={cn("text-sm font-medium", theme === "dark" ? "text-white" : "text-slate-800")}>
                    {hour.temp}°
                  </span>
                  <span className={cn("text-[10px] text-center", theme === "dark" ? "text-gray-500" : "text-slate-500")}>
                    {hour.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
};
