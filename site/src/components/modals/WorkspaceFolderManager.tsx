import { useState, useRef } from "react";
import { Folder, HardDrive, Plus, X, Check } from "lucide-react";
import { Icon } from "../ui/Icon";

export interface WorkspaceFolder {
  id: string;
  name: string;
  path: string;
  isDefault?: boolean;
}

interface WorkspaceFolderManagerProps {
  isOpen: boolean;
  onClose: () => void;
  folders: WorkspaceFolder[];
  activeFolderId: string;
  onSelectFolder: (id: string) => void;
  onAddFolder: (name: string, path: string) => void;
  onRemoveFolder: (id: string) => void;
}

/**
 * Gerenciador gráfico de diretórios do computador local
 * Permite ao usuário referenciar e alternar entre pastas de projetos
 */
export function WorkspaceFolderManager({
  isOpen,
  onClose,
  folders,
  activeFolderId,
  onSelectFolder,
  onAddFolder,
  onRemoveFolder,
}: WorkspaceFolderManagerProps) {
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderPath, setNewFolderPath] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!newFolderName.trim() || !newFolderPath.trim()) return;
    onAddFolder(newFolderName.trim(), newFolderPath.trim());
    setNewFolderName("");
    setNewFolderPath("");
    setIsAdding(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[var(--cor-borda)] bg-[var(--cor-superficie-elevada)] shadow-2xl overflow-hidden superficie-elevada"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "fadeScale 0.2s ease-out" }}
      >
        {/* Cabeçalho */}
        <div className="p-4 border-b border-[var(--cor-borda)] flex items-center justify-between bg-[var(--cor-superficie)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--cor-campo)] flex items-center justify-center text-[var(--espectro-ciano)]">
              <Icon icon={HardDrive} size="sm" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[var(--texto-principal)]">
                Diretórios & Pastas Locais
              </h3>
              <p className="text-xs text-[var(--texto-terciario)]">
                Referencie o contexto do seu computador nas conversas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--texto-terciario)] hover:text-[var(--texto-principal)] hover:bg-[var(--cor-campo)] transition-colors cursor-pointer"
          >
            <Icon icon={X} size="sm" />
          </button>
        </div>

        {/* Lista de Pastas */}
        <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
          {folders.map((folder) => {
            const isActive = folder.id === activeFolderId;
            return (
              <div
                key={folder.id}
                className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                  isActive
                    ? "bg-[var(--cor-campo)] border-[var(--espectro-ciano)]/50 shadow-sm"
                    : "bg-[var(--cor-superficie)] border-[var(--cor-borda)] hover:border-[var(--cor-borda-foco)]"
                }`}
                onClick={() => onSelectFolder(folder.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    icon={Folder}
                    size="md"
                    className={
                      isActive ? "text-[var(--espectro-ciano)]" : "text-[var(--texto-terciario)]"
                    }
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs text-[var(--texto-principal)] truncate">
                        {folder.name}
                      </span>
                      {folder.isDefault && (
                        <span className="px-1.5 py-0.2 text-[9px] font-mono rounded bg-[var(--cor-borda)] text-[var(--texto-terciario)]">
                          Workspace Atual
                        </span>
                      )}
                    </div>
                    <code className="text-[10px] text-[var(--texto-terciario)] truncate block font-mono">
                      {folder.path}
                    </code>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isActive && (
                    <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-[var(--espectro-ciano)] px-2 py-0.5 rounded bg-[var(--espectro-ciano)]/10">
                      <Icon icon={Check} size="sm" /> Ativa
                    </span>
                  )}
                  {!folder.isDefault && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFolder(folder.id);
                      }}
                      className="p-1 text-[var(--texto-terciario)] hover:text-[var(--cor-erro)] transition-colors rounded"
                      title="Remover pasta"
                    >
                      <Icon icon={X} size="sm" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Modo de adição */}
          {isAdding ? (
            <div className="p-3 rounded-xl border border-[var(--cor-borda-foco)] bg-[var(--cor-campo)] space-y-2 mt-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Nome do Projeto ou Pasta (ex: Meu Repositório)"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full text-xs p-2 rounded-lg bg-[var(--cor-superficie)] border border-[var(--cor-borda)] text-[var(--texto-principal)] placeholder:text-[var(--texto-placeholder)] focus:outline-none focus:border-[var(--espectro-ciano)]"
              />
              <input
                type="text"
                placeholder="Caminho Absoluto (ex: C:/Projetos/app ou ~/src/app)"
                value={newFolderPath}
                onChange={(e) => setNewFolderPath(e.target.value)}
                className="w-full text-xs p-2 rounded-lg bg-[var(--cor-superficie)] border border-[var(--cor-borda)] text-[var(--texto-principal)] placeholder:text-[var(--texto-placeholder)] font-mono focus:outline-none focus:border-[var(--espectro-ciano)]"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-[var(--texto-secundario)] hover:text-[var(--texto-principal)] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAdd}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--espectro-ciano)] text-[#0B0F19] hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Adicionar Pasta
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full p-2.5 rounded-xl border border-dashed border-[var(--cor-borda)] hover:border-[var(--espectro-ciano)]/50 text-[var(--texto-secundario)] hover:text-[var(--texto-principal)] text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-2"
            >
              <Icon icon={Plus} size="sm" />
              <span>Conectar Nova Pasta do Computador</span>
            </button>
          )}
        </div>

        <div className="p-3 border-t border-[var(--cor-borda)] bg-[var(--cor-superficie)]/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-[var(--cor-campo)] hover:bg-[var(--cor-campo)]/80 text-[var(--texto-principal)] border border-[var(--cor-borda)] cursor-pointer"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
}
