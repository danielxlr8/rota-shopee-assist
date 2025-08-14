import { useState } from "react";
import { Smartphone, Settings, Sun, Moon } from "lucide-react";
import { AdminDashboard } from "./components/AdminDashboard";
import { DriverInterface } from "./components/DriverInterface";
import { mockCalls, mockDrivers } from "./data/mockData";
import type { Driver, SupportCall } from "./types/logistics";
console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);
console.log("VITE_MAP_KEY:", import.meta.env.VITE_MAP_KEY);

export default function App() {
  const [view, setView] = useState<"admin" | "driver">("admin");
  const [theme, setTheme] = useState("light");
  const [currentUser, setCurrentUser] = useState<Driver>(mockDrivers[0]);
  // O estado dos chamados agora é gerido aqui para ser partilhado
  const [calls, setCalls] = useState<SupportCall[]>(mockCalls);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleLoginAs = (driverId: string) => {
    const driver = mockDrivers.find((d: Driver) => d.id === driverId);
    if (driver) {
      setCurrentUser(driver);
    }
  };

  // Função para adicionar um novo chamado à lista
  const addNewCall = (
    newCall: Omit<SupportCall, "id" | "timestamp" | "solicitante">
  ) => {
    const callToAdd: SupportCall = {
      ...newCall,
      id: `c${Date.now()}`,
      timestamp: Date.now(),
      solicitante: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        initials: currentUser.initials,
      },
      status: "ABERTO",
    };
    setCalls((prevCalls) => [callToAdd, ...prevCalls]);
  };

  return (
    <div className={`${theme}`}>
      <div className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors duration-300 min-h-screen">
        {/* ===== CABEÇALHO COM ESTILO HÍBRIDO ===== */}
        <header className="bg-orange-600 shadow-md p-2 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center space-x-2">
            <img
              src="/spx-logo.png"
              alt="Logótipo da Shopee"
              className="h-8 object-contain"
            />
            <span className="font-bold text-xl text-black">
              Sistema de Apoio
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-white hover:bg-white/20 transition-colors"
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <select
              onChange={(e) => handleLoginAs(e.target.value)}
              value={currentUser.id}
              className="bg-black border border-orange-400/50 text-orange-400 rounded-md p-2 text-sm focus:ring-2 focus:ring-orange-400"
            >
              {mockDrivers.map((d: Driver) => (
                <option key={d.id} value={d.id}>
                  Logado como: {d.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setView("admin")}
              className={`flex items-center space-x-2 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${
                view === "admin"
                  ? "bg-black text-orange-600"
                  : "text-black hover:bg-black/20"
              }`}
            >
              <Settings size={16} />
              <span>Admin</span>
            </button>
            <button
              onClick={() => setView("driver")}
              className={`flex items-center space-x-2 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${
                view === "driver"
                  ? "bg-black text-orange-600"
                  : "text-black hover:bg-black/20"
              }`}
            >
              <Smartphone size={16} />
              <span>Motorista</span>
            </button>
          </div>
        </header>

        <main>
          {view === "admin" ? (
            <AdminDashboard calls={calls} setCalls={setCalls} />
          ) : (
            <DriverInterface driver={currentUser} onNewCall={addNewCall} />
          )}
        </main>
      </div>
    </div>
  );
}
