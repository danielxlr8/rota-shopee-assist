import React, { useState, useRef, useCallback, useEffect } from "react";
import type { SupportCall, Driver, UrgencyLevel } from "../types/logistics";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Users,
  Trash2,
  RotateCcw,
  MapPin,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { Timestamp } from "firebase/firestore";
import {
  AvatarComponent,
  UrgencyBadge,
  DriverCard,
  SummaryCard,
  KanbanColumn,
  DriverInfoModal,
} from "./UI";

// --- COMPONENTES AUXILIARES ---

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  call,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  call: SupportCall | null;
}) => {
  if (!isOpen || !call) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-800">Confirmar Exclusão</h2>
        <p className="text-gray-600 my-4">
          Tem certeza de que deseja excluir a solicitação de{" "}
          <strong>{call.solicitante.name}</strong>? Esta ação pode ser
          revertida.
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
};

const CallCard = ({
  call,
  onDelete,
}: {
  call: SupportCall;
  onDelete: (call: SupportCall) => void;
}) => {
  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return "Horário indisponível";
    let date;
    if (timestamp instanceof Timestamp) {
      date = timestamp.toDate();
    } else if (typeof timestamp === "object" && timestamp.seconds) {
      date = new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate();
    } else {
      date = new Date(timestamp);
    }
    if (isNaN(date.getTime())) return "Data inválida";
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  };
  const timeAgo = formatTimestamp(call.timestamp);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-3">
          <AvatarComponent user={call.solicitante} />
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-gray-800">{call.solicitante.name}</p>
              <button
                onClick={() => onDelete(call)}
                className="p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                title="Excluir Solicitação"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <p className="text-sm text-gray-500">Solicitante</p>
          </div>
        </div>
        <UrgencyBadge urgency={call.urgency} />
      </div>
      <div className="text-sm text-gray-600 space-y-2">
        <div className="flex items-center space-x-2">
          <Clock size={16} className="text-gray-400" />
          <span>{timeAgo}</span>
        </div>
        <div className="flex items-center space-x-2">
          <MapPin size={16} className="text-gray-400" />
          <span>{call.location}</span>
        </div>
      </div>
      <p className="text-gray-700 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
        {call.description}
      </p>
    </div>
  );
};

// --- Componentes para Layout Redimensionável ---

// ALTERAÇÃO: Divisor com novo estilo e ícone SVG personalizado
const ResizableHandle = ({
  onMouseDown,
  isResizing,
}: {
  onMouseDown: React.MouseEventHandler<HTMLDivElement>;
  isResizing: boolean;
}) => (
  <div
    className="w-2 h-full cursor-col-resize flex items-center justify-center group"
    onMouseDown={onMouseDown}
  >
    <div
      className={`w-0.5 h-full transition-colors ${
        isResizing ? "bg-orange-500" : "bg-gray-300 group-hover:bg-orange-400"
      }`}
    ></div>
  </div>
);

const ResizablePanel = ({
  children,
  width,
}: {
  children: React.ReactNode;
  width: number;
}) => {
  return (
    <div
      style={{ flex: `0 0 ${width}px` }}
      className="h-full overflow-hidden flex flex-col"
    >
      {children}
    </div>
  );
};

// --- COMPONENTE PRINCIPAL DO PAINEL ---

interface AdminDashboardProps {
  calls: SupportCall[];
  drivers: Driver[];
  updateCall: (id: string, updates: Partial<Omit<SupportCall, "id">>) => void;
  onDeleteCall: (id: string) => void;
}

export const AdminDashboard = ({
  calls,
  drivers,
  updateCall,
  onDeleteCall,
}: AdminDashboardProps) => {
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyLevel | "TODOS">(
    "TODOS"
  );
  const [adminView, setAdminView] = useState<
    "kanban" | "approvals" | "excluded"
  >("kanban");
  const [infoModalDriver, setInfoModalDriver] = useState<Driver | null>(null);
  const [callToDelete, setCallToDelete] = useState<SupportCall | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [excludedNameFilter, setExcludedNameFilter] = useState("");
  const [excludedHubFilter, setExcludedHubFilter] = useState("");

  const [columnWidths, setColumnWidths] = useState([350, 350, 350]);
  const resizingIndexRef = useRef<number | null>(null);
  const startCursorXRef = useRef<number>(0);
  const startWidthsRef = useRef<number[]>([]);

  const onMouseDown = useCallback(
    (index: number, event: React.MouseEvent) => {
      resizingIndexRef.current = index;
      startCursorXRef.current = event.clientX;
      startWidthsRef.current = columnWidths;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [columnWidths]
  );

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (resizingIndexRef.current === null) return;

      const delta = event.clientX - startCursorXRef.current;
      const index = resizingIndexRef.current;

      const newWidths = [...startWidthsRef.current];
      const minWidth = 280;
      const maxWidth = 600;

      const currentWidth = startWidthsRef.current[index];
      const nextWidth = startWidthsRef.current[index + 1];

      const newCurrentWidth = currentWidth + delta;
      const newNextWidth = nextWidth - delta;

      if (
        newCurrentWidth >= minWidth &&
        newCurrentWidth <= maxWidth &&
        newNextWidth >= minWidth &&
        newNextWidth <= maxWidth
      ) {
        newWidths[index] = newCurrentWidth;
        newWidths[index + 1] = newNextWidth;
        setColumnWidths(newWidths);
      }
    };

    const onMouseUp = () => {
      resizingIndexRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const handleAcionarDriver = (driverId: string) => {
    const driver = drivers.find((d) => d.id === driverId);
    if (driver && driver.phone) {
      const message = encodeURIComponent(
        `Olá ${driver.name}, temos um chamado de apoio para você.`
      );
      const whatsappUrl = `https://wa.me/55${driver.phone}?text=${message}`;
      window.open(whatsappUrl, "_blank");
    } else {
      console.error(
        "Não foi possível acionar o motorista. Telefone não encontrado."
      );
    }
  };

  const handleDeleteClick = (call: SupportCall) => {
    setCallToDelete(call);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (callToDelete) {
      onDeleteCall(callToDelete.id);
    }
    setIsDeleteModalOpen(false);
    setCallToDelete(null);
  };

  const handleRestore = (callId: string) => {
    updateCall(callId, { status: "ABERTO" });
  };

  const activeCalls = calls.filter((c) => c.status !== "EXCLUIDO");
  const excludedCalls = calls.filter((c) => c.status === "EXCLUIDO");
  const openCalls = activeCalls.filter((c) => c.status === "ABERTO");
  const inProgressCalls = activeCalls.filter(
    (c) => c.status === "EM ANDAMENTO"
  );
  const concludedCalls = activeCalls.filter(
    (c) => c.status === "CONCLUIDO" || c.status === "APROVADO"
  );
  const pendingApprovalCalls = activeCalls.filter(
    (c) => c.status === "AGUARDANDO_APROVACAO"
  );
  const availableDrivers = drivers.filter((d) => d.status === "DISPONIVEL");
  const filteredOpenCalls =
    urgencyFilter === "TODOS"
      ? openCalls
      : openCalls.filter((call) => call.urgency === urgencyFilter);

  const filterControls = (
    <div className="flex flex-wrap gap-1">
      {(["TODOS", "URGENTE", "ALTA", "MEDIA", "BAIXA"] as const).map(
        (level) => (
          <button
            key={level}
            onClick={() => setUrgencyFilter(level)}
            className={`px-2 py-0.5 text-xs rounded-md font-semibold transition-colors ${
              urgencyFilter === level
                ? "bg-orange-600 text-white"
                : "bg-gray-300 text-gray-700 hover:bg-gray-400"
            }`}
          >
            {level === "TODOS"
              ? "Todos"
              : level.charAt(0) + level.slice(1).toLowerCase()}
          </button>
        )
      )}
    </div>
  );

  const activeCallForDriver = infoModalDriver
    ? calls.find(
        (c) =>
          c.assignedTo === infoModalDriver.id &&
          (c.status === "EM ANDAMENTO" || c.status === "AGUARDANDO_APROVACAO")
      ) || null
    : null;

  return (
    <div className="bg-orange-50 min-h-screen font-sans">
      <header className="p-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Sistema de Apoio Logístico
            </h1>
            <p className="text-gray-500">Painel Administrativo - SPX Shopee</p>
          </div>
        </div>
      </header>
      <nav className="px-6 border-b border-gray-200">
        <div className="flex space-x-4">
          <button
            onClick={() => setAdminView("kanban")}
            className={`py-2 px-1 text-sm font-semibold transition-colors ${
              adminView === "kanban"
                ? "border-b-2 border-orange-600 text-orange-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Painel de Chamados
          </button>
          <button
            onClick={() => setAdminView("approvals")}
            className={`py-2 px-1 text-sm font-semibold relative transition-colors ${
              adminView === "approvals"
                ? "border-b-2 border-orange-600 text-orange-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Aprovações Pendentes
            {pendingApprovalCalls.length > 0 && (
              <span className="absolute top-1 -right-3 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {pendingApprovalCalls.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setAdminView("excluded")}
            className={`py-2 px-1 text-sm font-semibold transition-colors ${
              adminView === "excluded"
                ? "border-b-2 border-orange-600 text-orange-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Solicitações Excluídas
          </button>
        </div>
      </nav>

      {adminView === "kanban" && (
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SummaryCard
              title="Chamados Abertos"
              value={openCalls.length}
              icon={<AlertTriangle />}
              subtext="Aguardando atendimento"
              colorClass="#F59E0B"
            />
            <SummaryCard
              title="Em Andamento"
              value={inProgressCalls.length}
              icon={<Clock />}
              subtext="Sendo atendidos"
              colorClass="#3B82F6"
            />
            <SummaryCard
              title="Concluídos"
              value={concludedCalls.length}
              icon={<CheckCircle />}
              subtext="Finalizados"
              colorClass="#10B981"
            />
            <SummaryCard
              title="Motoristas Disponíveis"
              value={availableDrivers.length}
              icon={<Users />}
              subtext="Prontos para apoio"
              colorClass="#8B5CF6"
            />
          </div>

          <main className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3 overflow-x-auto">
              <div className="flex w-full h-full">
                <ResizablePanel width={columnWidths[0]}>
                  <KanbanColumn
                    title="Chamados Abertos"
                    count={filteredOpenCalls.length}
                    colorClass="#F59E0B"
                    headerControls={filterControls}
                  >
                    {filteredOpenCalls.map((call) => (
                      <CallCard
                        key={call.id}
                        call={call}
                        onDelete={handleDeleteClick}
                      />
                    ))}
                  </KanbanColumn>
                </ResizablePanel>

                <ResizableHandle
                  onMouseDown={(e) => onMouseDown(0, e)}
                  isResizing={resizingIndexRef.current === 0}
                />

                <ResizablePanel width={columnWidths[1]}>
                  <KanbanColumn
                    title="Em Andamento"
                    count={inProgressCalls.length}
                    colorClass="#3B82F6"
                  >
                    {inProgressCalls.map((call) => (
                      <CallCard
                        key={call.id}
                        call={call}
                        onDelete={handleDeleteClick}
                      />
                    ))}
                  </KanbanColumn>
                </ResizablePanel>

                <ResizableHandle
                  onMouseDown={(e) => onMouseDown(1, e)}
                  isResizing={resizingIndexRef.current === 1}
                />

                <ResizablePanel width={columnWidths[2]}>
                  <KanbanColumn
                    title="Concluídos"
                    count={concludedCalls.length}
                    colorClass="#10B981"
                  >
                    {concludedCalls.map((call) => (
                      <CallCard
                        key={call.id}
                        call={call}
                        onDelete={handleDeleteClick}
                      />
                    ))}
                  </KanbanColumn>
                </ResizablePanel>
              </div>
            </div>
            <div className="xl:col-span-1">
              <KanbanColumn
                title="Motoristas Disponíveis"
                count={availableDrivers.length}
                colorClass="#8B5CF6"
              >
                {drivers
                  .filter((d) => d.status === "DISPONIVEL")
                  .map((driver) => (
                    <DriverCard
                      key={driver.id}
                      driver={driver}
                      onAction={handleAcionarDriver}
                      onInfoClick={() => setInfoModalDriver(driver)}
                    />
                  ))}
              </KanbanColumn>
            </div>
          </main>
        </div>
      )}

      {adminView === "excluded" && (
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Solicitações Excluídas
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <input
              type="text"
              placeholder="Filtrar por nome..."
              value={excludedNameFilter}
              onChange={(e) => setExcludedNameFilter(e.target.value)}
              className="p-2 border rounded-lg w-full"
            />
            <input
              type="text"
              placeholder="Filtrar por hub..."
              value={excludedHubFilter}
              onChange={(e) => setExcludedHubFilter(e.target.value)}
              className="p-2 border rounded-lg w-full"
            />
          </div>
          <div className="space-y-4">
            {excludedCalls
              .filter((call) =>
                call.solicitante.name
                  .toLowerCase()
                  .includes(excludedNameFilter.toLowerCase())
              )
              .filter(
                (call) =>
                  call.hub
                    ?.toLowerCase()
                    .includes(excludedHubFilter.toLowerCase()) ?? true
              )
              .map((call) => (
                <div
                  key={call.id}
                  className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center"
                >
                  <div>
                    <p className="font-bold">{call.solicitante.name}</p>
                    <p className="text-sm text-gray-500">{call.description}</p>
                  </div>
                  <button
                    onClick={() => handleRestore(call.id)}
                    className="flex items-center gap-2 px-3 py-1 text-sm font-semibold bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                  >
                    <RotateCcw size={14} /> Restaurar
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {infoModalDriver && (
        <DriverInfoModal
          driver={infoModalDriver}
          call={activeCallForDriver}
          onClose={() => setInfoModalDriver(null)}
        />
      )}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        call={callToDelete}
      />
    </div>
  );
};
