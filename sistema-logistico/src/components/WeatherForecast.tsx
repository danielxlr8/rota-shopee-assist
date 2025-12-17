import React, { useEffect, useState } from "react";
import { CloudSun } from "lucide-react";
import { cn } from "../lib/utils";
import { fetchWeatherForecast, fetchHourlyWeather, WeatherForecastResponse, DayDetails } from "../utils/weather";
import { Loading } from "./ui/loading";
import { WeatherDayDetails } from "./WeatherDayDetails";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface WeatherForecastProps {
  hub: string | null;
  className?: string;
}

interface SortableWeatherCardProps {
  day: {
    date: string;
    day: string;
    temp: { min: number; max: number };
    icon: string;
    condition: string;
    description: string;
  };
  index: number;
  isDark: boolean;
  isSelected: boolean;
  onSelect: () => void;
}

const SortableWeatherCard: React.FC<SortableWeatherCardProps> = ({
  day,
  index,
  isDark,
  isSelected,
  onSelect,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: day.date });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onSelect}
      className={cn(
        "flex-1 p-2 md:p-3 lg:p-4 rounded-xl border text-center transition-all cursor-grab active:cursor-grabbing",
        isDark
          ? "bg-slate-800/50 border-orange-500/30 hover:bg-slate-700/50 hover:border-orange-500/50"
          : "bg-orange-50/50 border-orange-200/30 hover:bg-orange-50/70 hover:border-orange-300/50",
        isSelected && "ring-2 ring-orange-500/50 bg-slate-700/70",
        isDragging && "z-50 shadow-2xl scale-105"
      )}
    >
      <div
        className={cn(
          "text-xs md:text-sm font-medium mb-1.5 md:mb-2",
          isDark ? "text-gray-200" : "text-slate-700",
          index === 0 && "font-bold"
        )}
      >
        {day.day}
      </div>
      <div className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl mb-1.5 md:mb-2">{day.icon}</div>
      <div
        className={cn(
          "text-sm md:text-base lg:text-lg font-semibold mb-0.5",
          isDark ? "text-white" : "text-slate-800"
        )}
      >
        {day.temp.max}°
      </div>
      <div
        className={cn(
          "text-[10px] md:text-xs",
          isDark ? "text-gray-300" : "text-gray-600"
        )}
      >
        {day.temp.min}°
      </div>
    </div>
  );
};

export const WeatherForecast: React.FC<WeatherForecastProps> = ({
  hub,
  className,
}) => {
  const [weatherData, setWeatherData] = useState<WeatherForecastResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [dayDetails, setDayDetails] = useState<DayDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [orderedForecast, setOrderedForecast] = useState<WeatherForecastResponse["forecast"] | []>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Requer 8px de movimento antes de iniciar o drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!hub || hub === "Todos os Hubs") {
      setWeatherData(null);
      setOrderedForecast([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const loadWeather = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchWeatherForecast(hub);
        if (data) {
          setWeatherData(data);
          setOrderedForecast(data.forecast);
        }
      } catch (err) {
        console.error("Erro ao carregar previsão do tempo:", err);
        setError("Erro ao carregar previsão");
      } finally {
        setIsLoading(false);
      }
    };

    loadWeather();
  }, [hub]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && weatherData) {
      const oldIndex = orderedForecast.findIndex((day) => day.date === active.id);
      const newIndex = orderedForecast.findIndex((day) => day.date === over.id);

      const newOrder = arrayMove(orderedForecast, oldIndex, newIndex);
      setOrderedForecast(newOrder);
    }
  };

  const isDark = document.documentElement.classList.contains("dark");

  return (
    <div className={cn("w-full", className)}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
        <h3
          className={cn(
            "text-sm sm:text-base md:text-lg font-semibold flex items-center gap-2",
            isDark ? "text-white" : "text-slate-800"
          )}
        >
          <CloudSun size={18} className="sm:w-6 sm:h-6 flex-shrink-0" style={{ color: isDark ? "#fb923c" : "#ea580c" }} />
          Previsão do Tempo
        </h3>
        {weatherData && (
          <span
            className={cn(
              "text-xs sm:text-sm md:text-base",
              isDark ? "text-gray-300" : "text-gray-600"
            )}
          >
            {weatherData.city}, {weatherData.state}
          </span>
        )}
      </div>

      {!hub || hub === "Todos os Hubs" ? (
        <div
          className={cn(
            "text-sm md:text-base text-center py-4",
            isDark ? "text-gray-300" : "text-gray-600"
          )}
        >
          Selecione um hub para ver a previsão
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loading size="md" />
        </div>
      ) : error ? (
        <div
          className={cn(
            "text-sm md:text-base text-center py-4",
            isDark ? "text-gray-300" : "text-gray-600"
          )}
        >
          {error}
        </div>
      ) : weatherData && orderedForecast.length > 0 ? (
        <div className="flex flex-col lg:flex-row gap-3 md:gap-4 w-full">
          {/* Cards dos dias - Preenchendo todo o espaço disponível com drag and drop */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={orderedForecast.map((day) => day.date)}
              strategy={horizontalListSortingStrategy}
            >
              <div className={cn(
                "flex gap-0.5 md:gap-1 w-full",
                selectedDay && "lg:flex-1"
              )}>
                {orderedForecast.map((day, index) => (
                  <SortableWeatherCard
                    key={day.date}
                    day={day}
                    index={index}
                    isDark={isDark}
                    isSelected={selectedDay === day.date}
                    onSelect={async () => {
                      if (selectedDay === day.date) {
                        setSelectedDay(null);
                        setDayDetails(null);
                      } else {
                        setSelectedDay(day.date);
                        setIsLoadingDetails(true);
                        try {
                          const details = await fetchHourlyWeather(hub!, day.date);
                          setDayDetails(details);
                        } catch (err) {
                          console.error("Erro ao carregar detalhes:", err);
                        } finally {
                          setIsLoadingDetails(false);
                        }
                      }
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Detalhes do dia selecionado - Lado direito */}
          {selectedDay && (
            <div className="flex-shrink-0 w-full lg:w-80 xl:w-96">
              {isLoadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <Loading size="md" />
                </div>
              ) : (
                <WeatherDayDetails
                  dayDetails={dayDetails}
                  onClose={() => {
                    setSelectedDay(null);
                    setDayDetails(null);
                  }}
                />
              )}
            </div>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "text-sm md:text-base text-center py-4",
            isDark ? "text-gray-300" : "text-gray-600"
          )}
        >
          Previsão não disponível
        </div>
      )}
    </div>
  );
};

