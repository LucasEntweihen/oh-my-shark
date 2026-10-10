"""
Neuro-Task Horizon - Gerenciador de Tarefas Dark Mode & Kanban Board
Conforme DESIGN.md:
- Modo Dark nativo profundo (#22242B, #2A2D36, #1E1F26)
- Design minimalista, focado e responsivo
- SEM nome de usuário na interface
- SEM widgets de "Efficiency" ou "Completed Tasks"
- SOMENTE a aba/visão de Kanban Board
- Slider de Opacidade de Janela (com suporte a alpha no Windows/X11 sem prejudicar tipografia)
- Microinterações ultra-rápidas e otimizadas
- Visual de constelação e tema cósmico nos detalhes
"""

import json
import os
import sys
import tkinter as tk
import tkinter.font as tkfont
from pathlib import Path
from tkinter import ttk

# Configuração de diretórios de persistência
DIR_CONFIG = Path.home() / ".omsk"
DIR_CONFIG.mkdir(parents=True, exist_ok=True)
ARQUIVO_TAREFAS = DIR_CONFIG / "tarefas.json"

# ==============================================================================
# DESIGN TOKENS (DESIGN.md - Neuro-Task Horizon)
# ==============================================================================
BG_BASE = "#22242B"          # Fundo principal da aplicação
BG_SURFACE = "#2A2D36"       # Fundo dos cards e painéis
BG_SURFACE_HOVER = "#323640" # Hover em cards
BG_SIDEBAR = "#1E1F26"       # Header e barras
BORDER_SUBTLE = "#323640"    # Divisórias e bordas
BORDER_FOCUS = "#00E5FF"     # Ciano neon

TEXT_PRIMARY = "#FFFFFF"     # Texto principal
TEXT_SECONDARY = "#8A8C95"   # Textos secundários (hex sólido, sem opacidade)
TEXT_MUTED = "#5A5C63"

# Acentos Semânticos
COLOR_CYAN = "#00E5FF"       # Destaque Glitch / Ação Primária
COLOR_YELLOW = "#FFB300"     # Status Draft / Pending
COLOR_BLUE = "#1E88E5"       # Status In Progress
COLOR_MAGENTA = "#E040FB"    # Status Editing / Cosmos
COLOR_GREEN = "#43A047"      # Status Done
COLOR_RED = "#E53935"        # Exclusão / Alerta

CATEGORY_MAP = {
    "A": {"color": "#1E88E5", "name": "Engine Core"},
    "B": {"color": "#9C27B0", "name": "AI Swarm"},
    "C": {"color": "#E53935", "name": "Security Sentinel"},
    "D": {"color": "#FFB300", "name": "Ops & Infra"},
}


class KanbanDarkApp:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Neuro-Task Horizon // Kanban Board")
        self.root.geometry("1180x740+60+60")
        self.root.minsize(860, 560)
        self.root.configure(bg=BG_BASE)

        self.fonte_display = self._obter_fonte(("Space Grotesk", "Inter", "Segoe UI", "Arial"))
        self.fonte_body = self._obter_fonte(("Inter", "Segoe UI", "Arial"))
        self.fonte_mono = self._obter_fonte(("JetBrains Mono", "Consolas", "Courier New"))

        self.tarefas = self.carregar_tarefas()
        self.construir_interface()

    def _obter_fonte(self, candidatos):
        disponiveis = set(tkfont.families(self.root))
        for c in candidatos:
            if c in disponiveis:
                return c
        return "Arial"

    def carregar_tarefas(self):
        if not ARQUIVO_TAREFAS.exists():
            return [
                {"id": 1, "title": "Model Routes & Fast Inference", "cat": "A", "status": "DONE", "desc": "Otimização de pipelines de raciocínio profundo."},
                {"id": 2, "title": "Subagent Swarm Dispatch", "cat": "B", "status": "IN_PROGRESS", "desc": "Comunicação peer-to-peer via Hub IRC."},
                {"id": 3, "title": "Security Invariant Auditor", "cat": "C", "status": "DRAFT", "desc": "Prevenção rigorosa de injeção de comandos."},
                {"id": 4, "title": "Kernel Workpool Multi-thread", "cat": "D", "status": "EDITING", "desc": "Pool de execução concorrente sem alocações inúteis."},
            ]
        try:
            return json.loads(ARQUIVO_TAREFAS.read_text(encoding="utf-8"))
        except Exception:
            return []

    def salvar_tarefas(self):
        try:
            ARQUIVO_TAREFAS.write_text(json.dumps(self.tarefas, ensure_ascii=False, indent=2), encoding="utf-8")
        except Exception as e:
            print("Erro ao salvar:", e)

    def construir_interface(self):
        # 1. TOP BAR (Sem nome de usuário, minimalista e com controle de opacidade)
        topbar = tk.Frame(self.root, bg=BG_SIDEBAR, height=60, highlightthickness=1, highlightbackground=BORDER_SUBTLE)
        topbar.pack(fill="x", side="top")
        topbar.pack_propagate(False)

        # Brand / Logo Cósmica
        left_box = tk.Frame(topbar, bg=BG_SIDEBAR)
        left_box.pack(side="left", padx=20)

        logo_canvas = tk.Canvas(left_box, width=28, height=28, bg=BG_SIDEBAR, highlightthickness=0)
        logo_canvas.pack(side="left")
        # Estrela de Constelação Geométrica
        logo_canvas.create_oval(3, 3, 25, 25, outline=COLOR_CYAN, width=1.5)
        logo_canvas.create_line(14, 3, 14, 25, fill=COLOR_CYAN, width=1)
        logo_canvas.create_line(3, 14, 25, 14, fill=COLOR_CYAN, width=1)
        logo_canvas.create_oval(11, 11, 17, 17, fill=COLOR_MAGENTA, outline="")

        title_lbl = tk.Label(
            left_box,
            text="NEURO-TASK",
            font=(self.fonte_display, 12, "bold"),
            fg=TEXT_PRIMARY,
            bg=BG_SIDEBAR
        )
        title_lbl.pack(side="left", padx=10)

        badge_lbl = tk.Label(
            left_box,
            text="KANBAN OS",
            font=(self.fonte_mono, 7, "bold"),
            fg=COLOR_CYAN,
            bg="#112233",
            padx=6,
            pady=2
        )
        badge_lbl.pack(side="left")

        # Ações à direita da Topbar
        right_box = tk.Frame(topbar, bg=BG_SIDEBAR)
        right_box.pack(side="right", padx=20)

        # Controle de Opacidade da Tela (Item 8: sem afetar a tipografia)
        op_frame = tk.Frame(right_box, bg=BG_SURFACE, padx=8, pady=4, highlightthickness=1, highlightbackground=BORDER_SUBTLE)
        op_frame.pack(side="left", padx=12)

        tk.Label(op_frame, text="OPACIDADE", font=(self.fonte_mono, 7, "bold"), fg=TEXT_SECONDARY, bg=BG_SURFACE).pack(side="left", padx=(0, 6))

        self.op_scale = tk.Scale(
            op_frame,
            from_=0.35, to=1.0,
            resolution=0.02,
            orient="horizontal",
            showvalue=0,
            length=80,
            bg=BG_SURFACE,
            troughcolor=BG_BASE,
            activebackground=COLOR_CYAN,
            highlightthickness=0,
            command=self.ajustar_opacidade
        )
        self.op_scale.set(0.96)
        self.op_scale.pack(side="left")

        # Botão Nova Tarefa
        btn_add = tk.Label(
            right_box,
            text="➕ Nova Tarefa",
            font=(self.fonte_body, 9, "bold"),
            fg="#0B0F19",
            bg=COLOR_CYAN,
            padx=14,
            pady=6,
            cursor="hand2"
        )
        btn_add.pack(side="left")
        btn_add.bind("<Button-1>", lambda e: self.dialogo_nova_tarefa())

        # 2. ÁREA KANBAN BOARD (Única aba em exibição - 100% responsiva)
        self.kanban_area = tk.Frame(self.root, bg=BG_BASE)
        self.kanban_area.pack(fill="both", expand=True, padx=20, pady=20)

        self.colunas_spec = [
            ("DRAFT", COLOR_YELLOW, "DRAFT"),
            ("IN PROGRESS", COLOR_CYAN, "IN_PROGRESS"),
            ("EDITING", COLOR_MAGENTA, "EDITING"),
            ("DONE", COLOR_GREEN, "DONE")
        ]
        self.renderizar_kanban()

    def ajustar_opacidade(self, valor):
        try:
            val = float(valor)
            self.root.attributes("-alpha", val)
        except Exception:
            pass

    def renderizar_kanban(self):
        for w in self.kanban_area.winfo_children():
            w.destroy()

        for label, color, status_key in self.colunas_spec:
            col_frame = tk.Frame(self.kanban_area, bg=BG_SURFACE, highlightthickness=1, highlightbackground=BORDER_SUBTLE)
            col_frame.pack(side="left", fill="both", expand=True, padx=6)

            # Cabeçalho da Coluna
            col_h = tk.Frame(col_frame, bg=BG_SIDEBAR)
            col_h.pack(fill="x", padx=1, pady=1)

            dot = tk.Canvas(col_h, width=8, height=8, bg=BG_SIDEBAR, highlightthickness=0)
            dot.pack(side="left", padx=(10, 6), pady=10)
            dot.create_oval(1, 1, 7, 7, fill=color, outline="")

            tk.Label(col_h, text=label, font=(self.fonte_display, 8, "bold"), fg=TEXT_PRIMARY, bg=BG_SIDEBAR).pack(side="left")

            tarefas_desta_col = [t for t in self.tarefas if t.get("status") == status_key]

            badge_count = tk.Label(
                col_h,
                text=str(len(tarefas_desta_col)),
                font=(self.fonte_mono, 7, "bold"),
                fg=TEXT_SECONDARY,
                bg=BG_SURFACE,
                padx=6, pady=1
            )
            badge_count.pack(side="right", padx=10)

            # Scroll e Lista de Cards
            tasks_container = tk.Frame(col_frame, bg=BG_SURFACE)
            tasks_container.pack(fill="both", expand=True, padx=8, pady=8)

            for t in tarefas_desta_col:
                self.criar_card_tarefa(tasks_container, t)

    def criar_card_tarefa(self, parent, task):
        cat = task.get("cat", "A")
        cat_info = CATEGORY_MAP.get(cat, CATEGORY_MAP["A"])
        color = cat_info["color"]

        card = tk.Frame(parent, bg=BG_SURFACE_HOVER, highlightthickness=1, highlightbackground=BORDER_SUBTLE)
        card.pack(fill="x", pady=4)

        # Faixa de Categoria Lateral
        stripe = tk.Frame(card, bg=color, width=3)
        stripe.pack(side="left", fill="y")

        body = tk.Frame(card, bg=BG_SURFACE_HOVER)
        body.pack(side="left", fill="both", expand=True, padx=10, pady=8)

        # Topo do card com título e botão de remover
        header = tk.Frame(body, bg=BG_SURFACE_HOVER)
        header.pack(fill="x")

        tk.Label(
            header,
            text=task.get("title", ""),
            font=(self.fonte_body, 9, "bold"),
            fg=TEXT_PRIMARY,
            bg=BG_SURFACE_HOVER,
            anchor="w",
            wraplength=200,
            justify="left"
        ).pack(side="left", fill="x", expand=True)

        btn_del = tk.Label(
            header,
            text="✕",
            font=(self.fonte_mono, 8),
            fg=TEXT_MUTED,
            bg=BG_SURFACE_HOVER,
            cursor="hand2"
        )
        btn_del.pack(side="right")
        btn_del.bind("<Button-1>", lambda e, tid=task.get("id"): self.remover_tarefa(tid))

        if task.get("desc"):
            tk.Label(
                body,
                text=task.get("desc", ""),
                font=(self.fonte_body, 7),
                fg=TEXT_SECONDARY,
                bg=BG_SURFACE_HOVER,
                anchor="w",
                wraplength=200,
                justify="left"
            ).pack(fill="x", pady=(4, 6))

        # Rodapé do card: Categoria e Seletor de Status
        footer = tk.Frame(body, bg=BG_SURFACE_HOVER)
        footer.pack(fill="x", pady=(4, 0))

        tk.Label(
            footer,
            text=cat_info["name"].upper(),
            font=(self.fonte_mono, 6, "bold"),
            fg=color,
            bg=BG_SURFACE,
            padx=4, pady=1
        ).pack(side="left")

        # ComboBox simplificado para mover entre colunas instantaneamente
        cb = ttk.Combobox(footer, values=["DRAFT", "IN_PROGRESS", "EDITING", "DONE"], width=11, state="readonly", font=(self.fonte_mono, 7))
        cb.set(task.get("status", "DRAFT"))
        cb.pack(side="right")
        cb.bind("<<ComboboxSelected>>", lambda e, tid=task.get("id"), w=cb: self.mover_tarefa(tid, w.get()))

    def mover_tarefa(self, tid, novo_status):
        for t in self.tarefas:
            if t.get("id") == tid:
                t["status"] = novo_status
                break
        self.salvar_tarefas()
        self.renderizar_kanban()

    def remover_tarefa(self, tid):
        self.tarefas = [t for t in self.tarefas if t.get("id") != tid]
        self.salvar_tarefas()
        self.renderizar_kanban()

    def dialogo_nova_tarefa(self):
        top = tk.Toplevel(self.root)
        top.title("Nova Tarefa")
        top.geometry("380x280")
        top.configure(bg=BG_SURFACE)
        top.resizable(False, False)

        tk.Label(top, text="TÍTULO DA TAREFA", font=(self.fonte_mono, 8, "bold"), fg=TEXT_SECONDARY, bg=BG_SURFACE).pack(anchor="w", padx=20, pady=(16, 4))
        ent_t = tk.Entry(top, font=(self.fonte_body, 9), bg=BG_BASE, fg=TEXT_PRIMARY, insertbackground=COLOR_CYAN, highlightthickness=1, highlightbackground=BORDER_SUBTLE)
        ent_t.pack(fill="x", padx=20)
        ent_t.focus_set()

        tk.Label(top, text="DESCRIÇÃO", font=(self.fonte_mono, 8, "bold"), fg=TEXT_SECONDARY, bg=BG_SURFACE).pack(anchor="w", padx=20, pady=(10, 4))
        ent_d = tk.Entry(top, font=(self.fonte_body, 8), bg=BG_BASE, fg=TEXT_PRIMARY, insertbackground=COLOR_CYAN, highlightthickness=1, highlightbackground=BORDER_SUBTLE)
        ent_d.pack(fill="x", padx=20)

        tk.Label(top, text="CATEGORIA SEMÂNTICA", font=(self.fonte_mono, 8, "bold"), fg=TEXT_SECONDARY, bg=BG_SURFACE).pack(anchor="w", padx=20, pady=(10, 4))
        cbo = ttk.Combobox(top, values=["A", "B", "C", "D"], state="readonly")
        cbo.set("A")
        cbo.pack(fill="x", padx=20)

        def salvar():
            txt = ent_t.get().strip()
            if not txt:
                return
            desc = ent_d.get().strip()
            cat = cbo.get()
            self.tarefas.append({
                "id": len(self.tarefas) + 1,
                "title": txt,
                "desc": desc,
                "cat": cat,
                "status": "DRAFT"
            })
            self.salvar_tarefas()
            top.destroy()
            self.renderizar_kanban()

        btn = tk.Label(
            top,
            text="Adicionar ao Kanban",
            font=(self.fonte_body, 9, "bold"),
            fg="#0B0F19",
            bg=COLOR_CYAN,
            padx=16,
            pady=8,
            cursor="hand2"
        )
        btn.pack(pady=20)
        btn.bind("<Button-1>", lambda e: salvar())


def main():
    app = KanbanDarkApp()
    app.root.mainloop()


if __name__ == "__main__":
    main()
