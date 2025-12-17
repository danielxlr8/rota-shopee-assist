import React, { useState } from "react";
import { X } from "lucide-react";
import { cn } from "../lib/utils";
import { DayDetails, HourlyWeatherData } from "../utils/weather";
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
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface WeatherDayDetailsProps {
  dayDetails: DayDetails | null;
  onClose: () => void;
}

interface SortableHourCardProps {
  hour: HourlyWeatherData;
  isDark: boolean;
}

const SortableHourCard: React.FC<SortableHourCardProps> = ({
  hour,
  isDark,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: hour.time });

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
      className={cn(
        "p-1.5 md:p-2 rounded-lg border text-center transition-all cursor-grab active:cursor-grabbing",
        isDark
          ? "bg-slate-700/50 border-orange-500/20 hover:bg-slate-700/70"
          : "bg-orange-50/50 border-orange-200/30 hover:bg-orange-50/70",
        isDragging && "z-50 shadow-2xl scale-105"
      )}
    >
      <div
        className={cn(
          "text-[9px] md:text-[10px] font-medium mb-1",
          isDark ? "text-gray-300" : "text-slate-700"
        )}
      >
        {hour.hour}
      </div>
      <div className="text-base md:text-lg mb-1">{hour.icon}</div>
      <div
        className={cn(
          "text-xs md:text-sm font-semibold mb-0.5",
          isDark ? "text-white" : "text-slate-800"
        )}
      >
        {hour.temperature}°
      </div>
      <div
        className={cn(
          "text-[8px] md:text-[9px] truncate",
          isDark ? "text-gray-400" : "text-gray-600"
        )}
        title={hour.description}
      >
        {hour.description}
      </div>
    </div>
  );
};

export const WeatherDayDetails: React.FC<WeatherDayDetailsProps> = ({
  dayDetails,
  onClose,
}) => {
  const [orderedHours, setOrderedHours] = useState<HourlyWeatherData[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  React.useEffect(() => {
    if (dayDetails) {
      setOrderedHours(dayDetails.hourly);
    }
  }, [dayDetails]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = orderedHours.findIndex((hour) => hour.time === active.id);
      const newIndex = orderedHours.findIndex((hour) => hour.time === over.id);

      const newOrder = arrayMove(orderedHours, oldIndex, newIndex);
      setOrderedHours(newOrder);
    }
  };

  if (!dayDetails) return null;

  const isDark = document.documentElement.classList.contains("dark");

  return (
    <div
      className={cn(
        "p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border transition-all shadow-lg flex flex-col h-full",
        isDark
          ? "bg-slate-800/90 border-orange-500/30"
          : "bg-white/80 border-orange-200/50"
      )}
    >
      {/* Header compacto */}
      <div className="flex items-start justify-between mb-2 sm:mb-3 flex-shrink-0">
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              "text-xs sm:text-sm md:text-base font-bold truncate",
              isDark ? "text-white" : "text-slate-800"
            )}
          >
            {dayDetails.day} - {new Date(dayDetails.date).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
            })}
          </h3>
          <div className="flex items-center gap-2 sm:gap-2 md:gap-3 mt-1 sm:mt-1.5">
            <div className="text-xl sm:text-2xl md:text-3xl flex-shrink-0">{dayDetails.icon}</div>
            <div className="min-w-0">
              <div
                className={cn(
                  "text-sm sm:text-lg md:text-xl font-bold",
                  isDark ? "text-white" : "text-slate-800"
                )}
              >
                {dayDetails.temp.max}° / {dayDetails.temp.min}°
              </div>
              <div
                className={cn(
                  "text-[10px] sm:text-xs truncate",
                  isDark ? "text-gray-300" : "text-gray-600"
                )}
              >
                {dayDetails.condition}
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className={cn(
            "p-1 rounded-lg hover:bg-opacity-20 transition-colors flex-shrink-0 ml-2",
            isDark
              ? "text-gray-300 hover:bg-white/10"
              : "text-gray-600 hover:bg-gray-100"
          )}
        >
          <X size={14} className="sm:w-4 sm:h-4" />
        </button>
      </div>

      {/* Previsão hora a hora - preenchendo o espaço restante */}
      <div className="flex-1 min-h-0 flex flex-col">
        <h4
          className={cn(
            "text-[10px] sm:text-xs font-semibold mb-1.5 sm:mb-2 flex-shrink-0",
            isDark ? "text-white" : "text-slate-800"
          )}
        >
          Previsão Hora a Hora
        </h4>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={orderedHours.map((hour) => hour.time)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-4 xl:grid-cols-6 gap-1 sm:gap-1.5 flex-1 overflow-y-auto pr-1">
              {orderedHours.map((hour) => (
                <SortableHourCard
                  key={hour.time}
                  hour={hour}
                  isDark={isDark}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};

