import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronDown, LucideIcon } from "lucide-react";

interface SearchableSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: LucideIcon;
}

export const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder,
  icon: Icon,
}: SearchableSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredOptions = useMemo(() => {
    // Se não há opções, retornar array vazio
    if (!options || options.length === 0) {
      return [];
    }
    
    const lowerSearch = searchTerm.toLowerCase().trim();
    const allOption = options.find((option) =>
      option.toLowerCase().startsWith("todos")
    );
    
    // Se não há termo de busca, mostrar TODAS as opções (com "Todos" no início)
    if (!lowerSearch) {
      const otherOptions = options.filter(opt => !opt.toLowerCase().startsWith("todos"));
      return allOption ? [allOption, ...otherOptions] : options;
    }
    
    // Se há termo de busca, filtrar (mantendo "Todos" no início se corresponder)
    const filtered = options.filter(
      (option) =>
        option.toLowerCase().includes(lowerSearch) &&
        !option.toLowerCase().startsWith("todos")
    );
    
    // Verificar se "Todos" também corresponde à busca
    const allMatches = allOption && allOption.toLowerCase().includes(lowerSearch);
    return allMatches && allOption ? [allOption, ...filtered] : filtered;
  }, [options, searchTerm]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const handleSelect = (option: string) => {
    onChange(option);
    setSearchTerm("");
    setIsOpen(false);
  };

  // Quando o dropdown está aberto e não há busca, mostrar o valor atual
  // Quando há busca, mostrar o termo de busca
  const displayValue = isOpen && searchTerm ? searchTerm : value;

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <Icon
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={16}
        />
        <input
          type="text"
          placeholder={placeholder}
          value={displayValue}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
            if (e.target.value === "") {
              const allOption = options.find((opt) =>
                opt.toLowerCase().startsWith("todos")
              );
              if (allOption) onChange(allOption);
            }
          }}
          onFocus={(e) => {
            setSearchTerm("");
            setIsOpen(true);
            // Manter o valor atual no input quando focar
            e.target.select();
          }}
          onClick={() => {
            if (!isOpen) {
              setSearchTerm("");
              setIsOpen(true);
            }
          }}
          className="w-full pl-10 pr-8 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-sans text-foreground placeholder:text-muted-foreground"
        />
        <ChevronDown
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          size={16}
        />
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto text-sm text-foreground">
          <ul>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <li
                  key={option}
                  onClick={() => handleSelect(option)}
                  className="px-4 py-2 hover:bg-muted cursor-pointer capitalize transition-colors"
                >
                  {option.toLowerCase().replace(/_/g, " ")}
                </li>
              ))
            ) : (
              <li className="px-4 py-2 text-muted-foreground">
                Nenhuma opção encontrada.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
