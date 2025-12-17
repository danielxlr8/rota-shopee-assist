// Mapeamento de hubs para cidades (para busca de previsão do tempo)
export const HUB_CITY_MAP: Record<string, { city: string; state: string; country: string }> = {
  "LM Hub_PR_Maringa": {
    city: "Maringá",
    state: "PR",
    country: "BR",
  },
  "LM Hub_PR_Londrina": {
    city: "Londrina",
    state: "PR",
    country: "BR",
  },
  "LM Hub_PR_Cascavel": {
    city: "Cascavel",
    state: "PR",
    country: "BR",
  },
  "LM Hub_PR_Foz do Iguaçu": {
    city: "Foz do Iguaçu",
    state: "PR",
    country: "BR",
  },
  "LM Hub_PR_Toledo": {
    city: "Toledo",
    state: "PR",
    country: "BR",
  },
  "LM Hub_PR_Pato Branco": {
    city: "Pato Branco",
    state: "PR",
    country: "BR",
  },
  "LM Hub_PR_Umuarama": {
    city: "Umuarama",
    state: "PR",
    country: "BR",
  },
  "LM Hub_PR_Curitiba": {
    city: "Curitiba",
    state: "PR",
    country: "BR",
  },
  "LM Hub_PR_Pinhais": {
    city: "Pinhais",
    state: "PR",
    country: "BR",
  },
  "LM Hub_PR_Sao Jose dos Pinhais": {
    city: "São José dos Pinhais",
    state: "PR",
    country: "BR",
  },
};

export interface WeatherData {
  date: string;
  day: string;
  temp: {
    min: number;
    max: number;
  };
  condition: string;
  icon: string;
  description: string;
}

export interface HourlyWeatherData {
  time: string;
  hour: string;
  temperature: number;
  condition: string;
  icon: string;
  description: string;
  weatherCode: number;
}

export interface DayDetails {
  date: string;
  day: string;
  temp: {
    min: number;
    max: number;
  };
  condition: string;
  icon: string;
  description: string;
  hourly: HourlyWeatherData[];
}

export interface WeatherForecastResponse {
  city: string;
  state: string;
  forecast: WeatherData[];
}

// Função para obter a cidade do hub
export const getCityFromHub = (hub: string): { city: string; state: string; country: string } | null => {
  return HUB_CITY_MAP[hub] || null;
};

// Função para buscar previsão do tempo usando OpenWeatherMap
export const fetchWeatherForecast = async (
  hub: string
): Promise<WeatherForecastResponse | null> => {
  const cityInfo = getCityFromHub(hub);
  if (!cityInfo) {
    console.warn(`Hub não encontrado no mapeamento: ${hub}`);
    return null;
  }

  // Usando OpenWeatherMap API (requer API key)
  // Por enquanto, vamos usar uma API pública alternativa ou mock
  try {
    // Se tiver API key do OpenWeatherMap, descomente:
    // const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
    // if (!apiKey) {
    //   console.warn("OpenWeatherMap API key não configurada");
    //   return getMockWeatherForecast(cityInfo);
    // }
    
    // Timeout de 5 segundos para evitar travamentos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      // Por enquanto, usando API pública do Open-Meteo (sem necessidade de API key)
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityInfo.city)}&count=1&language=pt&format=json`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        return getMockWeatherForecast(cityInfo);
      }

      const geoData = await response.json();
      if (!geoData.results || geoData.results.length === 0) {
        return getMockWeatherForecast(cityInfo);
      }

      const { latitude, longitude } = geoData.results[0];

      // Buscar previsão do tempo para 7 dias com timeout
      const weatherController = new AbortController();
      const weatherTimeoutId = setTimeout(() => weatherController.abort(), 5000);
      
      try {
        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=America/Sao_Paulo&forecast_days=7`,
          { signal: weatherController.signal }
        );

        clearTimeout(weatherTimeoutId);

        if (!weatherResponse.ok) {
          return getMockWeatherForecast(cityInfo);
        }

        const weatherData = await weatherResponse.json();
    
    // Mapear códigos de tempo para descrições
    const weatherCodeMap: Record<number, { condition: string; icon: string; description: string }> = {
      0: { condition: "Céu limpo", icon: "☀️", description: "Ensolarado" },
      1: { condition: "Principalmente limpo", icon: "🌤️", description: "Parcialmente nublado" },
      2: { condition: "Parcialmente nublado", icon: "⛅", description: "Nublado" },
      3: { condition: "Nublado", icon: "☁️", description: "Nublado" },
      45: { condition: "Neblina", icon: "🌫️", description: "Neblina" },
      48: { condition: "Neblina", icon: "🌫️", description: "Neblina" },
      51: { condition: "Chuva leve", icon: "🌦️", description: "Chuva leve" },
      53: { condition: "Chuva moderada", icon: "🌧️", description: "Chuva moderada" },
      55: { condition: "Chuva forte", icon: "🌧️", description: "Chuva forte" },
      61: { condition: "Chuva leve", icon: "🌦️", description: "Chuva leve" },
      63: { condition: "Chuva moderada", icon: "🌧️", description: "Chuva moderada" },
      65: { condition: "Chuva forte", icon: "🌧️", description: "Chuva forte" },
      71: { condition: "Neve leve", icon: "❄️", description: "Neve leve" },
      73: { condition: "Neve moderada", icon: "❄️", description: "Neve moderada" },
      75: { condition: "Neve forte", icon: "❄️", description: "Neve forte" },
      80: { condition: "Chuva leve", icon: "🌦️", description: "Chuva leve" },
      81: { condition: "Chuva moderada", icon: "🌧️", description: "Chuva moderada" },
      82: { condition: "Chuva forte", icon: "🌧️", description: "Chuva forte" },
      85: { condition: "Neve", icon: "❄️", description: "Neve" },
      86: { condition: "Neve", icon: "❄️", description: "Neve" },
      95: { condition: "Tempestade", icon: "⛈️", description: "Tempestade" },
      96: { condition: "Tempestade com granizo", icon: "⛈️", description: "Tempestade" },
      99: { condition: "Tempestade com granizo", icon: "⛈️", description: "Tempestade" },
    };

    const forecast: WeatherData[] = weatherData.daily.time.map((date: string, index: number) => {
      const dateObj = new Date(date);
      const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
      const day = dayNames[dateObj.getDay()];
      
      const code = weatherData.daily.weather_code[index];
      const weatherInfo = weatherCodeMap[code] || { condition: "Desconhecido", icon: "❓", description: "Desconhecido" };

      return {
        date,
        day,
        temp: {
          min: Math.round(weatherData.daily.temperature_2m_min[index]),
          max: Math.round(weatherData.daily.temperature_2m_max[index]),
        },
        condition: weatherInfo.condition,
        icon: weatherInfo.icon,
        description: weatherInfo.description,
      };
    });

        return {
          city: cityInfo.city,
          state: cityInfo.state,
          forecast,
        };
      } catch (weatherError: any) {
        clearTimeout(weatherTimeoutId);
        if (weatherError.name === 'AbortError') {
          console.warn("Timeout ao buscar previsão do tempo");
        } else {
          console.error("Erro ao buscar previsão do tempo:", weatherError);
        }
        return getMockWeatherForecast(cityInfo);
      }
    } catch (geoError: any) {
      clearTimeout(timeoutId);
      if (geoError.name === 'AbortError') {
        console.warn("Timeout ao buscar coordenadas");
      } else {
        console.error("Erro ao buscar coordenadas:", geoError);
      }
      return getMockWeatherForecast(cityInfo);
    }
  } catch (error) {
    console.error("Erro ao buscar previsão do tempo:", error);
    return getMockWeatherForecast(cityInfo);
  }
};

// Função para buscar previsão hora a hora de um dia específico
export const fetchHourlyWeather = async (
  hub: string,
  date: string
): Promise<DayDetails | null> => {
  const cityInfo = getCityFromHub(hub);
  if (!cityInfo) {
    console.warn(`Hub não encontrado no mapeamento: ${hub}`);
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      // Buscar coordenadas
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityInfo.city)}&count=1&language=pt&format=json`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (!geoResponse.ok) {
        return getMockDayDetails(cityInfo, date);
      }

      const geoData = await geoResponse.json();
      if (!geoData.results || geoData.results.length === 0) {
        return getMockDayDetails(cityInfo, date);
      }

      const { latitude, longitude } = geoData.results[0];
      const targetDate = new Date(date);
      const startDate = targetDate.toISOString().split("T")[0];
      const endDate = new Date(targetDate);
      endDate.setDate(targetDate.getDate() + 1);
      const endDateStr = endDate.toISOString().split("T")[0];

      // Buscar previsão hora a hora
      const hourlyController = new AbortController();
      const hourlyTimeoutId = setTimeout(() => hourlyController.abort(), 5000);
      
      try {
        const hourlyResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weather_code&timezone=America/Sao_Paulo&start_date=${startDate}&end_date=${endDateStr}`,
          { signal: hourlyController.signal }
        );

        clearTimeout(hourlyTimeoutId);

        if (!hourlyResponse.ok) {
          return getMockDayDetails(cityInfo, date);
        }

        const hourlyData = await hourlyResponse.json();
        const weatherCodeMap: Record<number, { condition: string; icon: string; description: string }> = {
          0: { condition: "Céu limpo", icon: "☀️", description: "Ensolarado" },
          1: { condition: "Principalmente limpo", icon: "🌤️", description: "Parcialmente nublado" },
          2: { condition: "Parcialmente nublado", icon: "⛅", description: "Nublado" },
          3: { condition: "Nublado", icon: "☁️", description: "Nublado" },
          45: { condition: "Neblina", icon: "🌫️", description: "Neblina" },
          48: { condition: "Neblina", icon: "🌫️", description: "Neblina" },
          51: { condition: "Chuva leve", icon: "🌦️", description: "Chuva leve" },
          53: { condition: "Chuva moderada", icon: "🌧️", description: "Chuva moderada" },
          55: { condition: "Chuva forte", icon: "🌧️", description: "Chuva forte" },
          61: { condition: "Chuva leve", icon: "🌦️", description: "Chuva leve" },
          63: { condition: "Chuva moderada", icon: "🌧️", description: "Chuva moderada" },
          65: { condition: "Chuva forte", icon: "🌧️", description: "Chuva forte" },
          71: { condition: "Neve leve", icon: "❄️", description: "Neve leve" },
          73: { condition: "Neve moderada", icon: "❄️", description: "Neve moderada" },
          75: { condition: "Neve forte", icon: "❄️", description: "Neve forte" },
          80: { condition: "Chuva leve", icon: "🌦️", description: "Chuva leve" },
          81: { condition: "Chuva moderada", icon: "🌧️", description: "Chuva moderada" },
          82: { condition: "Chuva forte", icon: "🌧️", description: "Chuva forte" },
          85: { condition: "Neve", icon: "❄️", description: "Neve" },
          86: { condition: "Neve", icon: "❄️", description: "Neve" },
          95: { condition: "Tempestade", icon: "⛈️", description: "Tempestade" },
          96: { condition: "Tempestade com granizo", icon: "⛈️", description: "Tempestade" },
          99: { condition: "Tempestade com granizo", icon: "⛈️", description: "Tempestade" },
        };

        const hourly: HourlyWeatherData[] = [];
        const targetDateStr = targetDate.toISOString().split("T")[0];
        
        if (hourlyData.hourly && hourlyData.hourly.time) {
          hourlyData.hourly.time.forEach((time: string, index: number) => {
            if (time.startsWith(targetDateStr)) {
              const timeObj = new Date(time);
              const hour = timeObj.getHours();
              const code = hourlyData.hourly.weather_code[index];
              const weatherInfo = weatherCodeMap[code] || { condition: "Desconhecido", icon: "❓", description: "Desconhecido" };
              
              hourly.push({
                time,
                hour: `${hour.toString().padStart(2, "0")}:00`,
                temperature: Math.round(hourlyData.hourly.temperature_2m[index]),
                condition: weatherInfo.condition,
                icon: weatherInfo.icon,
                description: weatherInfo.description,
                weatherCode: code,
              });
            }
          });
        }

        // Buscar dados diários para min/max
        const dailyResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=America/Sao_Paulo&start_date=${startDate}&end_date=${startDate}`,
          { signal: hourlyController.signal }
        );

        let minTemp = hourly.length > 0 ? Math.min(...hourly.map(h => h.temperature)) : 15;
        let maxTemp = hourly.length > 0 ? Math.max(...hourly.map(h => h.temperature)) : 25;
        let dayCondition = "Céu limpo";
        let dayIcon = "☀️";
        let dayDescription = "Ensolarado";

        if (dailyResponse.ok) {
          const dailyData = await dailyResponse.json();
          if (dailyData.daily && dailyData.daily.time && dailyData.daily.time[0] === startDate) {
            minTemp = Math.round(dailyData.daily.temperature_2m_min[0]);
            maxTemp = Math.round(dailyData.daily.temperature_2m_max[0]);
            const code = dailyData.daily.weather_code[0];
            const weatherInfo = weatherCodeMap[code] || { condition: "Céu limpo", icon: "☀️", description: "Ensolarado" };
            dayCondition = weatherInfo.condition;
            dayIcon = weatherInfo.icon;
            dayDescription = weatherInfo.description;
          }
        }

        const dateObj = new Date(date);
        const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
        const day = dayNames[dateObj.getDay()];

        return {
          date,
          day,
          temp: { min: minTemp, max: maxTemp },
          condition: dayCondition,
          icon: dayIcon,
          description: dayDescription,
          hourly,
        };
      } catch (hourlyError: any) {
        clearTimeout(hourlyTimeoutId);
        if (hourlyError.name === 'AbortError') {
          console.warn("Timeout ao buscar previsão hora a hora");
        } else {
          console.error("Erro ao buscar previsão hora a hora:", hourlyError);
        }
        return getMockDayDetails(cityInfo, date);
      }
    } catch (geoError: any) {
      clearTimeout(timeoutId);
      if (geoError.name === 'AbortError') {
        console.warn("Timeout ao buscar coordenadas");
      } else {
        console.error("Erro ao buscar coordenadas:", geoError);
      }
      return getMockDayDetails(cityInfo, date);
    }
  } catch (error) {
    console.error("Erro ao buscar previsão hora a hora:", error);
    return getMockDayDetails(cityInfo, date);
  }
};

// Função para gerar dados mock de detalhes do dia
const getMockDayDetails = (_cityInfo: { city: string; state: string; country: string }, date: string): DayDetails => {
  const dateObj = new Date(date);
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const day = dayNames[dateObj.getDay()];
  
  const min = Math.floor(Math.random() * 10) + 15;
  const max = Math.floor(Math.random() * 10) + 22;
  
  const conditions = [
    { condition: "Céu limpo", icon: "☀️", description: "Ensolarado" },
    { condition: "Parcialmente nublado", icon: "⛅", description: "Parcialmente nublado" },
    { condition: "Nublado", icon: "☁️", description: "Nublado" },
    { condition: "Chuva leve", icon: "🌦️", description: "Chuva leve" },
  ];
  
  const weather = conditions[Math.floor(Math.random() * conditions.length)];
  
  // Gerar dados hora a hora mock
  const hourly: HourlyWeatherData[] = Array.from({ length: 24 }, (_, hour) => {
    const tempVariation = Math.floor(Math.random() * 8) - 4;
    const hourTemp = Math.round((min + max) / 2 + tempVariation);
    const hourCondition = conditions[Math.floor(Math.random() * conditions.length)];
    
    return {
      time: `${date}T${hour.toString().padStart(2, "0")}:00:00`,
      hour: `${hour.toString().padStart(2, "0")}:00`,
      temperature: hourTemp,
      condition: hourCondition.condition,
      icon: hourCondition.icon,
      description: hourCondition.description,
      weatherCode: 0,
    };
  });
  
  return {
    date,
    day,
    temp: { min, max },
    condition: weather.condition,
    icon: weather.icon,
    description: weather.description,
    hourly,
  };
};

// Função para gerar dados mock de previsão do tempo
const getMockWeatherForecast = (cityInfo: { city: string; state: string; country: string }): WeatherForecastResponse => {
  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const today = new Date();
  
  const forecast: WeatherData[] = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    const day = days[date.getDay()];
    
    // Gerar temperaturas aleatórias realistas para o Paraná (15-30°C)
    const min = Math.floor(Math.random() * 10) + 15;
    const max = Math.floor(Math.random() * 10) + 22;
    
    const conditions = [
      { condition: "Céu limpo", icon: "☀️", description: "Ensolarado" },
      { condition: "Parcialmente nublado", icon: "⛅", description: "Parcialmente nublado" },
      { condition: "Nublado", icon: "☁️", description: "Nublado" },
      { condition: "Chuva leve", icon: "🌦️", description: "Chuva leve" },
    ];
    
    const weather = conditions[Math.floor(Math.random() * conditions.length)];
    
    return {
      date: date.toISOString().split("T")[0],
      day,
      temp: { min, max },
      condition: weather.condition,
      icon: weather.icon,
      description: weather.description,
    };
  });

  return {
    city: cityInfo.city,
    state: cityInfo.state,
    forecast,
  };
};

