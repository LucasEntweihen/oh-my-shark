"""
Master Your Time - Project Timeline OS & Task Manager
Refatorado de acordo com o design system DESIGN.md:
- 3 Colunas: Sidebar de Navegação, Área Principal (Gantt Timeline + Kanban), Painel Analítico à Direita
- Cores Semânticas Invariantes:
    Cat A (Azul): #3B82F6 / #EFF6FF
    Cat B (Roxo): #A855F7 / #FAF5FF
    Cat C (Rosa): #EC4899 / #FDF2F8
    Cat D (Amarelo): #EAB308 / #FEFCE8
- Gantt Timeline com Pills e Toggles interativos
- Kanban Board em 4 colunas (DRAFT, IN PROGRESS, EDITING, DONE)
- Painel Analítico: Gráficos Radiais de Eficiência (Efficiency Rings) e Gráficos Orgânicos de Barras
- Monitor nativo de telemetria de processos / sistema sem dependências externas obrigatórias
"""

import datetime
import json
import math
import os
import queue
import re
import signal
import socket
import subprocess
import sys
import threading
import time
import tkinter as tk
import tkinter.font as tkfont
from pathlib import Path
from tkinter import messagebox, ttk

# Tenta carregar psutil opcionalmente para máxima precisão quando disponível
try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    psutil = None
    HAS_PSUTIL = False

if os.name == "nt":
    import ctypes
    from ctypes import wintypes
    HAS_CTYPES = True
else:
    HAS_CTYPES = False

WIN = os.name == "nt"
SEM_JANELA = getattr(subprocess, "CREATE_NO_WINDOW", 0)

# Caminhos de persistência
DIR_CONFIG = Path.home() / ".omsk"
DIR_CONFIG.mkdir(parents=True, exist_ok=True)
ARQUIVO_TAREFAS = DIR_CONFIG / "tarefas.json"

# ==============================================================================
# DESIGN TOKENS (MASTER YOUR TIME UI)
# ==============================================================================
BG_APP = "#F8FAFC"             # Fundo geral da aplicação (off-white)
SURFACE_MAIN = "#FFFFFF"       # Cards, sidebar e painéis
SURFACE_TIMELINE = "#F1F5F9"   # Área do gráfico de Gantt / fundos secundários
BORDER_SUBTLE = "#E2E8F0"      # Divisórias e bordas suaves
BORDER_FOCUS = "#3B82F6"       # Borda de foco

TEXT_PRIMARY = "#0F172A"       # Navy escuro para títulos e textos principais
TEXT_SECONDARY = "#64748B"     # Slate para subtítulos, datas e breadcrumbs
TEXT_MUTED = "#94A3B8"         # Labels terciários
TEXT_INVERSE = "#FFFFFF"       # Branco puro para texto dentro de barras

# Cores Semânticas e Invariantes de Categorias
CAT_A_BLUE = "#3B82F6"
CAT_A_LIGHT = "#EFF6FF"
CAT_B_PURPLE = "#A855F7"
CAT_B_LIGHT = "#FAF5FF"
CAT_C_PINK = "#EC4899"
CAT_C_LIGHT = "#FDF2F8"
CAT_D_YELLOW = "#EAB308"
CAT_D_LIGHT = "#FEFCE8"
SUCCESS_GREEN = "#22C55E"

CATEGORY_MAP = {
    "A": {"color": CAT_A_BLUE, "light": CAT_A_LIGHT, "name": "Category A (Engine)"},
    "B": {"color": CAT_B_PURPLE, "light": CAT_B_LIGHT, "name": "Category B (AI Swarm)"},
    "C": {"color": CAT_C_PINK, "light": CAT_C_LIGHT, "name": "Category C (Security)"},
    "D": {"color": CAT_D_YELLOW, "light": CAT_D_LIGHT, "name": "Category D (Ops/Infra)"},
}


def formatar_bytes(b):
    if b < 1024:
        return f"{b} B"
    elif b < 1024 * 1024:
        return f"{b/1024:.1f} KB"
    elif b < 1024 * 1024 * 1024:
        return f"{b/(1024*1024):.1f} MB"
    else:
        return f"{b/(1024*1024*1024):.2f} GB"


# ==============================================================================
# TELEMETRIA NATIVA DE PROCESSOS (FALLBACK COM ZERO DEPENDÊNCIAS EXTERNAS)
# ==============================================================================
class NativeMetrics:
    def __init__(self):
        self._prev_idle = 0
        self._prev_total = 0
        self._cpu_cores = os.cpu_count() or 4
        self.init_nt_metrics()

    def init_nt_metrics(self):
        if WIN and HAS_CTYPES:
            class FILETIME(ctypes.Structure):
                _fields_ = [("dwLowDateTime", wintypes.DWORD), ("dwHighDateTime", wintypes.DWORD)]
            self.FILETIME = FILETIME
            self.GetSystemTimes = ctypes.windll.kernel32.GetSystemTimes

            class MEMORYSTATUSEX(ctypes.Structure):
                _fields_ = [
                    ("dwLength", wintypes.DWORD),
                    ("dwMemoryLoad", wintypes.DWORD),
                    ("ullTotalPhys", ctypes.c_uint64),
                    ("ullAvailPhys", ctypes.c_uint64),
                    ("ullTotalPageFile", ctypes.c_uint64),
                    ("ullAvailPageFile", ctypes.c_uint64),
                    ("ullTotalVirtual", ctypes.c_uint64),
                    ("ullAvailVirtual", ctypes.c_uint64),
                    ("ullAvailExtendedVirtual", ctypes.c_uint64),
                ]
            self.MEMORYSTATUSEX = MEMORYSTATUSEX
            self.GlobalMemoryStatusEx = ctypes.windll.kernel32.GlobalMemoryStatusEx

    def _filetime_to_int(self, ft):
        return (ft.dwHighDateTime << 32) | ft.dwLowDateTime

    def get_cpu_percent(self):
        if HAS_PSUTIL:
            try:
                return psutil.cpu_percent(interval=None)
            except Exception:
                pass
        if WIN and HAS_CTYPES:
            try:
                idle = self.FILETIME()
                kernel = self.FILETIME()
                user = self.FILETIME()
                if self.GetSystemTimes(ctypes.byref(idle), ctypes.byref(kernel), ctypes.byref(user)):
                    idle_t = self._filetime_to_int(idle)
                    kernel_t = self._filetime_to_int(kernel)
                    user_t = self._filetime_to_int(user)
                    total_t = kernel_t + user_t

                    if self._prev_total > 0:
                        diff_idle = idle_t - self._prev_idle
                        diff_total = total_t - self._prev_total
                        if diff_total > 0:
                            usage = (1.0 - (diff_idle / diff_total)) * 100.0
                            self._prev_idle = idle_t
                            self._prev_total = total_t
                            return max(0.0, min(100.0, usage))
                    self._prev_idle = idle_t
                    self._prev_total = total_t
            except Exception:
                pass
        return 15.0

    def get_ram_info(self):
        if HAS_PSUTIL:
            try:
                v = psutil.virtual_memory()
                return v.percent, v.used, v.total
            except Exception:
                pass
        if WIN and HAS_CTYPES:
            try:
                stat = self.MEMORYSTATUSEX()
                stat.dwLength = ctypes.sizeof(self.MEMORYSTATUSEX)
                if self.GlobalMemoryStatusEx(ctypes.byref(stat)):
                    total = stat.ullTotalPhys
                    avail = stat.ullAvailPhys
                    used = total - avail
                    pct = (used / total) * 100.0 if total > 0 else 0
                    return pct, used, total
            except Exception:
                pass
        return 42.0, 6 * 1024 * 1024 * 1024, 16 * 1024 * 1024 * 1024

    def get_process_list(self):
        procs = []
        if HAS_PSUTIL:
            try:
                for p in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info', 'status', 'username']):
                    info = p.info
                    mem = info['memory_info'].rss if info['memory_info'] else 0
                    procs.append({
                        "pid": info['pid'],
                        "name": info['name'] or "desconhecido",
                        "cpu": info['cpu_percent'] or 0.0,
                        "ram": mem,
                        "status": info['status'] or "running",
                        "user": info['username'] or "SYSTEM",
                    })
                return procs
            except Exception:
                pass

        if WIN:
            try:
                cmd = "tasklist /FO CSV /NH"
                out = subprocess.check_output(cmd, shell=True, creationflags=SEM_JANELA).decode("latin-1", errors="ignore")
                for line in out.strip().splitlines():
                    parts = [p.strip(' "') for p in line.split('","')]
                    if len(parts) >= 5:
                        nome = parts[0]
                        pid = int(parts[1]) if parts[1].isdigit() else 0
                        mem_str = parts[4].replace(".", "").replace(",", "").replace(" K", "").replace(" KB", "").strip()
                        mem_kb = int(mem_str) if mem_str.isdigit() else 0
                        procs.append({
                            "pid": pid,
                            "name": nome,
                            "cpu": 0.0,
                            "ram": mem_kb * 1024,
                            "status": "running",
                            "user": parts[2] if len(parts) > 2 else "local",
                        })
                return procs
            except Exception:
                pass
        return procs


# ==============================================================================
# WIDGET CUSTOMIZADO: ANEL DE EFICIÊNCIA RADIAL (SECTION 10.A DO DESIGN.MD)
# ==============================================================================
class RadialEfficiencyRing(tk.Canvas):
    def __init__(self, master, percent=75, color=CAT_A_BLUE, light_bg=CAT_A_LIGHT, label="Category A", size=84, **kwargs):
        super().__init__(master, width=size, height=size, bg=SURFACE_MAIN, highlightthickness=0, **kwargs)
        self.percent = percent
        self.color = color
        self.light_bg = light_bg
        self.label = label
        self.size = size
        self.draw_ring()

    def set_percent(self, val):
        self.percent = max(0, min(100, val))
        self.draw_ring()

    def draw_ring(self):
        self.delete("all")
        s = self.size
        pad = 8
        extent = -(self.percent / 100.0) * 360.0

        # Trilha de fundo (Aro de fundo com sombra/cor leve)
        self.create_oval(pad, pad, s - pad, s - pad, outline=self.light_bg, width=7)

        # Arco Preenchido com a cor semântica da categoria
        if self.percent > 0:
            self.create_arc(
                pad, pad, s - pad, s - pad,
                start=90, extent=extent,
                outline=self.color, width=7, style="arc"
            )

        # Texto Centralizado
        self.create_text(
            s / 2, s / 2 - 2,
            text=f"{int(self.percent)}%",
            font=("Plus Jakarta Sans", 10, "bold"),
            fill=TEXT_PRIMARY
        )


# ==============================================================================
# WIDGET CUSTOMIZADO: GANTT TIMELINE PILL COM TOGGLE FÍSICO INTERATIVO
# ==============================================================================
class TimelinePillWidget(tk.Canvas):
    def __init__(self, master, task_data, day_width=68, row_height=36, on_toggle_callback=None, **kwargs):
        super().__init__(master, height=row_height, bg=SURFACE_TIMELINE, highlightthickness=0, **kwargs)
        self.task_data = task_data
        self.day_width = day_width
        self.row_height = row_height
        self.on_toggle = on_toggle_callback
        self.bind("<Configure>", lambda e: self.redraw())

    def redraw(self):
        self.delete("all")
        w = self.winfo_width()
        h = self.row_height

        cat = self.task_data.get("cat", "A")
        cat_info = CATEGORY_MAP.get(cat, CATEGORY_MAP["A"])
        color = cat_info["color"]
        light = cat_info["light"]

        start_day = self.task_data.get("start_day", 0)
        span_days = self.task_data.get("span_days", 3)
        progress = self.task_data.get("progress", 50)
        title = self.task_data.get("title", "Task")
        active = self.task_data.get("active", True)

        x1 = start_day * self.day_width + 8
        x2 = x1 + span_days * self.day_width - 16
        pill_w = max(120, x2 - x1)
        pill_h = 28
        y1 = (h - pill_h) / 2
        y2 = y1 + pill_h
        r = pill_h / 2

        # 1. Fundo da Pill (30% opacidade / cor light)
        self.create_round_rect(x1, y1, x1 + pill_w, y2, r, fill=light, outline=BORDER_SUBTLE, width=1)

        # 2. Progresso preenchido (100% da cor da categoria)
        fill_w = (progress / 100.0) * pill_w
        if fill_w > r * 2:
            self.create_round_rect(x1, y1, x1 + fill_w, y2, r, fill=color, outline="")

        # 3. Toggle Circular Interativo no início da Pill
        toggle_cx = x1 + r + 2
        toggle_cy = (y1 + y2) / 2
        toggle_r = r - 4
        btn_color = SURFACE_MAIN if active else TEXT_MUTED

        toggle_id = self.create_oval(
            toggle_cx - toggle_r, toggle_cy - toggle_r,
            toggle_cx + toggle_r, toggle_cy + toggle_r,
            fill=btn_color, outline=color if active else BORDER_SUBTLE, width=2
        )
        cat_text_id = self.create_text(
            toggle_cx, toggle_cy,
            text=cat,
            font=("Plus Jakarta Sans", 8, "bold"),
            fill=color if active else TEXT_MUTED
        )

        # Associa evento de clique no toggle
        for item in (toggle_id, cat_text_id):
            self.tag_bind(item, "<Button-1>", lambda e: self._handle_click())
            self.tag_bind(item, "<Enter>", lambda e: self.config(cursor="hand2"))
            self.tag_bind(item, "<Leave>", lambda e: self.config(cursor=""))

        # 4. Título da Tarefa e Porcentagem
        text_fill = TEXT_INVERSE if fill_w > pill_w * 0.45 else TEXT_PRIMARY
        self.create_text(
            x1 + r * 2 + 10, (y1 + y2) / 2,
            text=title,
            anchor="w",
            font=("Plus Jakarta Sans", 9, "bold"),
            fill=text_fill
        )

        self.create_text(
            x1 + pill_w - 14, (y1 + y2) / 2,
            text=f"{progress}%",
            anchor="e",
            font=("Plus Jakarta Sans", 8, "bold"),
            fill=TEXT_INVERSE if fill_w >= pill_w - 20 else TEXT_SECONDARY
        )

    def _handle_click(self):
        self.task_data["active"] = not self.task_data.get("active", True)
        self.redraw()
        if self.on_toggle:
            self.on_toggle(self.task_data)

    def create_round_rect(self, x1, y1, x2, y2, r, **kwargs):
        points = [
            x1 + r, y1,
            x2 - r, y1,
            x2, y1,
            x2, y1 + r,
            x2, y2 - r,
            x2, y2,
            x2 - r, y2,
            x1 + r, y2,
            x1, y2,
            x1, y2 - r,
            x1, y1 + r,
            x1, y1
        ]
        return self.create_polygon(points, smooth=True, **kwargs)


# ==============================================================================
# WIDGET CUSTOMIZADO: GRÁFICO DE BARRAS ORGÂNICAS ("COMPLETED TASKS")
# ==============================================================================
class OrganicBarChart(tk.Canvas):
    def __init__(self, master, data=None, **kwargs):
        super().__init__(master, bg=SURFACE_MAIN, highlightthickness=0, **kwargs)
        self.data = data or [
            ("Mon", 45, CAT_A_BLUE),
            ("Tue", 70, CAT_B_PURPLE),
            ("Wed", 30, CAT_C_PINK),
            ("Thu", 85, CAT_D_YELLOW),
            ("Fri", 60, CAT_A_BLUE),
            ("Sat", 90, SUCCESS_GREEN),
            ("Sun", 40, CAT_B_PURPLE),
        ]
        self.bind("<Configure>", lambda e: self.draw())

    def draw(self):
        self.delete("all")
        w = self.winfo_width()
        h = self.winfo_height()
        if w < 20 or h < 20:
            return

        n = len(self.data)
        bar_w = max(12, int((w - (n + 1) * 8) / n))
        chart_h = h - 28

        for i, (label, val, color) in enumerate(self.data):
            x = 12 + i * (bar_w + 10)
            bh = (val / 100.0) * (chart_h - 10)
            y1 = chart_h - bh
            y2 = chart_h
            r = min(bar_w / 2, 6)

            # Barra com topo arredondado
            self.create_round_top_rect(x, y1, x + bar_w, y2, r, fill=color, outline="")

            # Label do Dia
            self.create_text(
                x + bar_w / 2, h - 10,
                text=label,
                font=("Plus Jakarta Sans", 7, "bold"),
                fill=TEXT_SECONDARY
            )

    def create_round_top_rect(self, x1, y1, x2, y2, r, **kwargs):
        points = [
            x1, y2,
            x1, y1 + r,
            x1, y1,
            x1 + r, y1,
            x2 - r, y1,
            x2, y1,
            x2, y1 + r,
            x2, y2,
        ]
        return self.create_polygon(points, smooth=True, **kwargs)


# ==============================================================================
# APLICAÇÃO PRINCIPAL: MASTER YOUR TIME - PROJECT TIMELINE OS
# ==============================================================================
class TaskManagerApp:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Master Your Time // OhMyShark Timeline OS")
        self.root.geometry("1280x760+40+40")
        self.root.minsize(960, 620)
        self.root.configure(bg=BG_APP)

        self.fonte_base = self.escolher_fonte_moderna()
        self.telemetria = NativeMetrics()
        self.tarefas_kanban = self.carregar_tarefas_kanban()
        self.timeline_tasks = self.obter_timeline_tasks()
        self.processos = []
        self.nav_ativa = "timeline"

        self.construir_layout_macro()
        self.iniciar_threads_background()

    def escolher_fonte_moderna(self):
        disponiveis = set(tkfont.families(self.root))
        for f in ("Plus Jakarta Sans", "Inter", "Segoe UI", "SF Pro Display", "Helvetica"):
            if f in disponiveis:
                return f
        return "Arial"

    def carregar_tarefas_kanban(self):
        if not ARQUIVO_TAREFAS.exists():
            return [
                {"id": 1, "title": "Model Routes & Fallbacks", "cat": "A", "status": "DONE", "desc": "Configurar rotas prioritárias de modelo"},
                {"id": 2, "title": "Subagent Swarm Dispatch", "cat": "B", "status": "IN_PROGRESS", "desc": "Decomposição em lote e IRC orchestration"},
                {"id": 3, "title": "Security Invariant Auditor", "cat": "C", "status": "DRAFT", "desc": "Auditoria de vetores e blindagem de prompts"},
                {"id": 4, "title": "Kernel Workpool & Workflows", "cat": "D", "status": "EDITING", "desc": "Execução persistente de kernels paralelos"},
            ]
        try:
            return json.loads(ARQUIVO_TAREFAS.read_text(encoding="utf-8"))
        except Exception:
            return []

    def salvar_tarefas_kanban(self):
        try:
            ARQUIVO_TAREFAS.write_text(json.dumps(self.tarefas_kanban, ensure_ascii=False, indent=2), encoding="utf-8")
        except Exception as e:
            print("Erro ao salvar tarefas:", e)

    def obter_timeline_tasks(self):
        return [
            {"id": "t1", "title": "Engine Core Bootstrap", "cat": "A", "start_day": 0, "span_days": 3, "progress": 85, "active": True},
            {"id": "t2", "title": "Multi-Agent Protocol", "cat": "B", "start_day": 2, "span_days": 4, "progress": 60, "active": True},
            {"id": "t3", "title": "AST Patch Optimizer", "cat": "A", "start_day": 4, "span_days": 3, "progress": 45, "active": True},
            {"id": "t4", "title": "Security Invariants Proof", "cat": "C", "start_day": 1, "span_days": 5, "progress": 90, "active": True},
            {"id": "t5", "title": "Zero-Overhead Memory Pool", "cat": "D", "start_day": 3, "span_days": 4, "progress": 75, "active": True},
        ]

    # --------------------------------------------------------------------------
    # LAYOUT MACRO: 3 COLUNAS (SIDEBAR 240px, CENTRO FLEX-1, PAINEL DIREITO 300px)
    # --------------------------------------------------------------------------
    def construir_layout_macro(self):
        self.container_principal = tk.Frame(self.root, bg=BG_APP)
        self.container_principal.pack(fill="both", expand=True)

        # 1. COLUNA ESQUERDA: SIDEBAR (240px fixa)
        self.sidebar = tk.Frame(self.container_principal, bg=SURFACE_MAIN, width=230, highlightthickness=1, highlightbackground=BORDER_SUBTLE)
        self.sidebar.pack(side="left", fill="y")
        self.sidebar.pack_propagate(False)
        self.montar_sidebar()

        # 3. COLUNA DIREITA: PAINEL ANALÍTICO (300px fixa)
        self.painel_direito = tk.Frame(self.container_principal, bg=SURFACE_MAIN, width=290, highlightthickness=1, highlightbackground=BORDER_SUBTLE)
        self.painel_direito.pack(side="right", fill="y")
        self.painel_direito.pack_propagate(False)
        self.montar_painel_analitico()

        # 2. COLUNA CENTRAL: ÁREA PRINCIPAL (FLEX-1)
        self.area_central = tk.Frame(self.container_principal, bg=BG_APP)
        self.area_central.pack(side="left", fill="both", expand=True, padx=16, pady=16)
        self.montar_area_central()

    # --------------------------------------------------------------------------
    # 1. SIDEBAR DE NAVEGAÇÃO
    # --------------------------------------------------------------------------
    def montar_sidebar(self):
        # Logo / Branding Topo
        top_brand = tk.Frame(self.sidebar, bg=SURFACE_MAIN, height=70)
        top_brand.pack(fill="x", padx=16, pady=(16, 8))

        logo_box = tk.Canvas(top_brand, width=36, height=36, bg=SURFACE_MAIN, highlightthickness=0)
        logo_box.pack(side="left")
        # Pétalas sobrepostas do logo floral/abstrato (Section 10.B)
        logo_box.create_oval(4, 10, 24, 30, fill=CAT_A_BLUE, outline="")
        logo_box.create_oval(12, 10, 32, 30, fill=CAT_A_BLUE, outline="")
        logo_box.create_oval(8, 4, 28, 24, fill=CAT_C_PINK, outline="")
        logo_box.create_oval(8, 16, 28, 36, fill=CAT_C_PINK, outline="")
        logo_box.create_oval(14, 14, 22, 22, fill=SURFACE_MAIN, outline="")

        title_box = tk.Frame(top_brand, bg=SURFACE_MAIN)
        title_box.pack(side="left", padx=10)
        tk.Label(title_box, text="Master Your Time", font=(self.fonte_base, 11, "bold"), fg=TEXT_PRIMARY, bg=SURFACE_MAIN).pack(anchor="w")
        tk.Label(title_box, text="Timeline OS // v1.0", font=(self.fonte_base, 8), fg=TEXT_SECONDARY, bg=SURFACE_MAIN).pack(anchor="w")

        # Divisória
        tk.Frame(self.sidebar, bg=BORDER_SUBTLE, height=1).pack(fill="x", padx=16, pady=8)

        # Links de Menu Vertical
        self.menu_items = [
            ("⚡ Timeline (Gantt)", "timeline"),
            ("📋 Kanban Board", "kanban"),
            ("📊 Processos & Telemetria", "processos"),
            ("🤖 Agentes OMSK Swarm", "agentes"),
        ]
        self.menu_btns = {}

        nav_frame = tk.Frame(self.sidebar, bg=SURFACE_MAIN)
        nav_frame.pack(fill="x", padx=12, pady=8)

        for label, key in self.menu_items:
            is_active = self.nav_ativa == key
            btn = tk.Label(
                nav_frame, text=f"  {label}",
                font=(self.fonte_base, 10, "bold" if is_active else "normal"),
                fg=CAT_A_BLUE if is_active else TEXT_PRIMARY,
                bg=CAT_A_LIGHT if is_active else SURFACE_MAIN,
                anchor="w", padx=12, pady=10, cursor="hand2"
            )
            btn.pack(fill="x", pady=2)
            btn.bind("<Button-1>", lambda e, k=key: self.trocar_secao(k))
            self.menu_btns[key] = btn

        # Categorias Color-Coded no Rodapé da Sidebar
        cat_box = tk.Frame(self.sidebar, bg=SURFACE_MAIN)
        cat_box.pack(side="bottom", fill="x", padx=16, pady=16)

        tk.Label(cat_box, text="CATEGORIES", font=(self.fonte_base, 8, "bold"), fg=TEXT_SECONDARY, bg=SURFACE_MAIN).pack(anchor="w", pady=(0, 6))
        for cat_k, cat_v in CATEGORY_MAP.items():
            row = tk.Frame(cat_box, bg=SURFACE_MAIN)
            row.pack(fill="x", pady=2)
            dot = tk.Canvas(row, width=10, height=10, bg=SURFACE_MAIN, highlightthickness=0)
            dot.pack(side="left")
            dot.create_oval(1, 1, 9, 9, fill=cat_v["color"], outline="")
            tk.Label(row, text=cat_v["name"], font=(self.fonte_base, 8), fg=TEXT_PRIMARY, bg=SURFACE_MAIN).pack(side="left", padx=6)

    def trocar_secao(self, key):
        self.nav_ativa = key
        for k, btn in self.menu_btns.items():
            active = k == key
            btn.config(
                fg=CAT_A_BLUE if active else TEXT_PRIMARY,
                bg=CAT_A_LIGHT if active else SURFACE_MAIN,
                font=(self.fonte_base, 10, "bold" if active else "normal")
            )
        self.atualizar_visao_central()

    # --------------------------------------------------------------------------
    # 2. ÁREA CENTRAL (HEADER + TIMELINE GANTT + KANBAN / TELAS)
    # --------------------------------------------------------------------------
    def montar_area_central(self):
        # Cabeçalho Principal (H1: Task Management)
        header_frame = tk.Frame(self.area_central, bg=BG_APP)
        header_frame.pack(fill="x", pady=(0, 12))

        left_h = tk.Frame(header_frame, bg=BG_APP)
        left_h.pack(side="left")
        self.lbl_view_title = tk.Label(left_h, text="Task Management", font=(self.fonte_base, 18, "bold"), fg=TEXT_PRIMARY, bg=BG_APP)
        self.lbl_view_title.pack(anchor="w")
        self.lbl_view_sub = tk.Label(left_h, text="Timeline Project OS • Real-Time Gantt & Kanban Workflow", font=(self.fonte_base, 9), fg=TEXT_SECONDARY, bg=BG_APP)
        self.lbl_view_sub.pack(anchor="w")

        # Botão Ação Rápida + Nova Tarefa
        btn_add = tk.Label(
            header_frame, text="➕ Add New Task",
            font=(self.fonte_base, 9, "bold"), fg=TEXT_INVERSE, bg=CAT_A_BLUE,
            padx=14, pady=8, cursor="hand2"
        )
        btn_add.pack(side="right")
        btn_add.bind("<Button-1>", lambda e: self.dialogo_nova_tarefa())

        # Contêiner Dinâmico de Conteúdo Central
        self.conteudo_dinamico = tk.Frame(self.area_central, bg=BG_APP)
        self.conteudo_dinamico.pack(fill="both", expand=True)

        self.atualizar_visao_central()

    def atualizar_visao_central(self):
        for w in self.conteudo_dinamico.winfo_children():
            w.destroy()

        if self.nav_ativa == "timeline":
            self.montar_visao_timeline_e_kanban()
        elif self.nav_ativa == "kanban":
            self.montar_visao_kanban_completo()
        elif self.nav_ativa == "processos":
            self.montar_visao_processos()
        elif self.nav_ativa == "agentes":
            self.montar_visao_agentes()

    def montar_visao_timeline_e_kanban(self):
        # 1. CARD DA TIMELINE GANTT
        gantt_card = tk.Frame(self.conteudo_dinamico, bg=SURFACE_MAIN, highlightthickness=1, highlightbackground=BORDER_SUBTLE)
        gantt_card.pack(fill="x", pady=(0, 14))

        gantt_header = tk.Frame(gantt_card, bg=SURFACE_MAIN)
        gantt_header.pack(fill="x", padx=16, pady=12)
        tk.Label(gantt_header, text="Project Timeline (Gantt)", font=(self.fonte_base, 11, "bold"), fg=TEXT_PRIMARY, bg=SURFACE_MAIN).pack(side="left")
        tk.Label(gantt_header, text="October 2026", font=(self.fonte_base, 9, "bold"), fg=CAT_A_BLUE, bg=SURFACE_MAIN).pack(side="right")

        # Régua de Dias (Grid 7 dias: 28, 29, 30, 01, 02, 03, 04)
        timeline_box = tk.Frame(gantt_card, bg=SURFACE_TIMELINE)
        timeline_box.pack(fill="x", padx=12, pady=(0, 12))

        dias = ["28 Mon", "29 Tue", "30 Wed", "01 Thu", "02 Fri", "03 Sat", "04 Sun"]
        ruler_frame = tk.Frame(timeline_box, bg=SURFACE_TIMELINE)
        ruler_frame.pack(fill="x", padx=8, pady=(8, 4))
        for d in dias:
            tk.Label(ruler_frame, text=d, font=(self.fonte_base, 8, "bold"), fg=TEXT_SECONDARY, bg=SURFACE_TIMELINE).pack(side="left", expand=True)

        # Linhas de Tarefas da Timeline
        for t in self.timeline_tasks:
            pill = TimelinePillWidget(timeline_box, t, day_width=84, row_height=36, on_toggle_callback=self.on_pill_toggle)
            pill.pack(fill="x", padx=4, pady=2)

        # 2. QUADRO KANBAN (4 COLUNAS: DRAFT, IN PROGRESS, EDITING, DONE)
        kanban_container = tk.Frame(self.conteudo_dinamico, bg=BG_APP)
        kanban_container.pack(fill="both", expand=True)

        colunas_spec = [
            ("DRAFT", CAT_C_PINK, "DRAFT"),
            ("IN PROGRESS", CAT_A_BLUE, "IN_PROGRESS"),
            ("EDITING", CAT_D_YELLOW, "EDITING"),
            ("DONE", SUCCESS_GREEN, "DONE")
        ]

        for label, color, status_key in colunas_spec:
            col_frame = tk.Frame(kanban_container, bg=SURFACE_MAIN, highlightthickness=1, highlightbackground=BORDER_SUBTLE)
            col_frame.pack(side="left", fill="both", expand=True, padx=4)

            # Cabeçalho da Coluna Kanban
            col_h = tk.Frame(col_frame, bg=SURFACE_MAIN)
            col_h.pack(fill="x", padx=10, pady=8)
            dot = tk.Canvas(col_h, width=8, height=8, bg=SURFACE_MAIN, highlightthickness=0)
            dot.pack(side="left")
            dot.create_oval(1, 1, 7, 7, fill=color, outline="")
            tk.Label(col_h, text=label, font=(self.fonte_base, 8, "bold"), fg=TEXT_PRIMARY, bg=SURFACE_MAIN).pack(side="left", padx=4)

            # Cards dentro da coluna
            tarefas_desta_col = [t for t in self.tarefas_kanban if t.get("status") == status_key]
            for t in tarefas_desta_col:
                self.criar_kanban_card(col_frame, t)

    def criar_kanban_card(self, parent, task):
        cat = task.get("cat", "A")
        cat_color = CATEGORY_MAP.get(cat, CATEGORY_MAP["A"])["color"]

        card = tk.Frame(parent, bg=BG_APP, highlightthickness=1, highlightbackground=BORDER_SUBTLE)
        card.pack(fill="x", padx=8, pady=4)

        # Linha vertical indicadora de categoria
        stripe = tk.Frame(card, bg=cat_color, width=4)
        stripe.pack(side="left", fill="y")

        body = tk.Frame(card, bg=BG_APP)
        body.pack(side="left", fill="both", expand=True, padx=8, pady=6)

        tk.Label(body, text=task.get("title", ""), font=(self.fonte_base, 9, "bold"), fg=TEXT_PRIMARY, bg=BG_APP, anchor="w").pack(fill="x")
        tk.Label(body, text=task.get("desc", ""), font=(self.fonte_base, 7), fg=TEXT_SECONDARY, bg=BG_APP, anchor="w").pack(fill="x")

    def on_pill_toggle(self, task_data):
        self.lbl_view_sub.config(text=f"Toggled: {task_data.get('title')} -> Active: {task_data.get('active')}")

    def montar_visao_kanban_completo(self):
        self.montar_visao_timeline_e_kanban()

    def montar_visao_processos(self):
        card = tk.Frame(self.conteudo_dinamico, bg=SURFACE_MAIN, highlightthickness=1, highlightbackground=BORDER_SUBTLE)
        card.pack(fill="both", expand=True, padx=4, pady=4)

        top_f = tk.Frame(card, bg=SURFACE_MAIN)
        top_f.pack(fill="x", padx=12, pady=10)
        tk.Label(top_f, text="Monitor de Processos Nativos", font=(self.fonte_base, 11, "bold"), fg=TEXT_PRIMARY, bg=SURFACE_MAIN).pack(side="left")

        # Tabela Treeview Estilizada
        colunas = ("pid", "name", "cpu", "ram", "status", "user")
        self.tree_procs = ttk.Treeview(card, columns=colunas, show="headings", selectmode="browse")
        self.tree_procs.heading("pid", text="PID")
        self.tree_procs.heading("name", text="Nome do Processo")
        self.tree_procs.heading("cpu", text="CPU %")
        self.tree_procs.heading("ram", text="Memória RAM")
        self.tree_procs.heading("status", text="Status")
        self.tree_procs.heading("user", text="Usuário")

        self.tree_procs.column("pid", width=70, anchor="center")
        self.tree_procs.column("name", width=240, anchor="w")
        self.tree_procs.column("cpu", width=80, anchor="center")
        self.tree_procs.column("ram", width=110, anchor="center")
        self.tree_procs.column("status", width=90, anchor="center")
        self.tree_procs.column("user", width=140, anchor="w")

        scroll = ttk.Scrollbar(card, orient="vertical", command=self.tree_procs.yview)
        self.tree_procs.configure(yscrollcommand=scroll.set)

        self.tree_procs.pack(side="left", fill="both", expand=True, padx=(12, 0), pady=8)
        scroll.pack(side="right", fill="y", padx=(0, 12), pady=8)
        self.renderizar_tabela_processos()

    def renderizar_tabela_processos(self):
        if not hasattr(self, "tree_procs") or not self.tree_procs.winfo_exists():
            return
        for item in self.tree_procs.get_children():
            self.tree_procs.delete(item)
        for p in self.processos[:100]:
            self.tree_procs.insert("", "end", values=(
                p["pid"],
                p["name"],
                f"{p['cpu']:.1f}%",
                formatar_bytes(p["ram"]),
                p["status"],
                p["user"]
            ))

    def montar_visao_agentes(self):
        card = tk.Frame(self.conteudo_dinamico, bg=SURFACE_MAIN, highlightthickness=1, highlightbackground=BORDER_SUBTLE)
        card.pack(fill="both", expand=True, padx=4, pady=4)

        top_f = tk.Frame(card, bg=SURFACE_MAIN)
        top_f.pack(fill="x", padx=12, pady=10)
        tk.Label(top_f, text="Agentes e Subagentes Ativos OMSK", font=(self.fonte_base, 11, "bold"), fg=TEXT_PRIMARY, bg=SURFACE_MAIN).pack(side="left")

        termos = ("omsk", "ohms", "bun", "python", "node")
        agentes = [p for p in self.processos if any(t in p["name"].lower() for t in termos)]

        for a in agentes:
            row = tk.Frame(card, bg=SURFACE_TIMELINE, highlightthickness=1, highlightbackground=BORDER_SUBTLE)
            row.pack(fill="x", padx=12, pady=4)
            tk.Label(row, text=f"🤖 {a['name']} (PID: {a['pid']})", font=(self.fonte_base, 9, "bold"), fg=CAT_B_PURPLE, bg=SURFACE_TIMELINE).pack(side="left", padx=8, pady=6)
            tk.Label(row, text=f"RAM: {formatar_bytes(a['ram'])}", font=(self.fonte_base, 8), fg=TEXT_SECONDARY, bg=SURFACE_TIMELINE).pack(side="right", padx=8)

    # --------------------------------------------------------------------------
    # 3. PAINEL ANALÍTICO DIREITO (PERFIL, RADIAIS DE EFICIÊNCIA E BARRAS)
    # --------------------------------------------------------------------------
    def montar_painel_analitico(self):
        # Perfil de Usuário
        profile_box = tk.Frame(self.painel_direito, bg=SURFACE_MAIN)
        profile_box.pack(fill="x", padx=16, pady=16)

        avatar = tk.Canvas(profile_box, width=44, height=44, bg=SURFACE_MAIN, highlightthickness=0)
        avatar.pack(side="left")
        avatar.create_oval(2, 2, 42, 42, fill=CAT_A_LIGHT, outline=CAT_A_BLUE, width=2)
        avatar.create_text(22, 22, text="🦈", font=("Arial", 16))

        user_info = tk.Frame(profile_box, bg=SURFACE_MAIN)
        user_info.pack(side="left", padx=10)
        tk.Label(user_info, text="Lucas Entweihen", font=(self.fonte_base, 10, "bold"), fg=TEXT_PRIMARY, bg=SURFACE_MAIN).pack(anchor="w")
        tk.Label(user_info, text="Lead Architect", font=(self.fonte_base, 8), fg=TEXT_SECONDARY, bg=SURFACE_MAIN).pack(anchor="w")

        tk.Frame(self.painel_direito, bg=BORDER_SUBTLE, height=1).pack(fill="x", padx=16, pady=4)

        # 1. EFICIÊNCIA (GRÁFICOS RADIAIS CIRCLULARES SECTION 10.A)
        tk.Label(self.painel_direito, text="Efficiency (Categories)", font=(self.fonte_base, 10, "bold"), fg=TEXT_PRIMARY, bg=SURFACE_MAIN).pack(anchor="w", padx=16, pady=(8, 4))

        rings_frame = tk.Frame(self.painel_direito, bg=SURFACE_MAIN)
        rings_frame.pack(fill="x", padx=12, pady=4)

        self.ring_a = RadialEfficiencyRing(rings_frame, percent=75, color=CAT_A_BLUE, light_bg=CAT_A_LIGHT)
        self.ring_a.pack(side="left", expand=True)

        self.ring_b = RadialEfficiencyRing(rings_frame, percent=60, color=CAT_B_PURPLE, light_bg=CAT_B_LIGHT)
        self.ring_b.pack(side="left", expand=True)

        self.ring_c = RadialEfficiencyRing(rings_frame, percent=88, color=CAT_C_PINK, light_bg=CAT_C_LIGHT)
        self.ring_c.pack(side="left", expand=True)

        tk.Frame(self.painel_direito, bg=BORDER_SUBTLE, height=1).pack(fill="x", padx=16, pady=8)

        # 2. COMPLETED TASKS (GRÁFICO DE BARRAS ORGÂNICAS)
        tk.Label(self.painel_direito, text="Completed Tasks", font=(self.fonte_base, 10, "bold"), fg=TEXT_PRIMARY, bg=SURFACE_MAIN).pack(anchor="w", padx=16, pady=(4, 4))
        self.bar_chart = OrganicBarChart(self.painel_direito, height=140)
        self.bar_chart.pack(fill="x", padx=12, pady=4)

        # 3. TELEMETRIA HUD RÁPIDA
        tk.Frame(self.painel_direito, bg=BORDER_SUBTLE, height=1).pack(fill="x", padx=16, pady=8)
        hud_box = tk.Frame(self.painel_direito, bg=SURFACE_TIMELINE, highlightthickness=1, highlightbackground=BORDER_SUBTLE)
        hud_box.pack(fill="x", padx=12, pady=8)

        self.lbl_tele_cpu = tk.Label(hud_box, text="CPU: 0.0%", font=(self.fonte_base, 8, "bold"), fg=CAT_A_BLUE, bg=SURFACE_TIMELINE)
        self.lbl_tele_cpu.pack(anchor="w", padx=8, pady=2)
        self.lbl_tele_ram = tk.Label(hud_box, text="RAM: 0.0%", font=(self.fonte_base, 8, "bold"), fg=CAT_B_PURPLE, bg=SURFACE_TIMELINE)
        self.lbl_tele_ram.pack(anchor="w", padx=8, pady=2)

    # --------------------------------------------------------------------------
    # THREADS DE ATUALIZAÇÃO E BACKGROUND
    # --------------------------------------------------------------------------
    def iniciar_threads_background(self):
        t = threading.Thread(target=self._loop_telemetria, daemon=True)
        t.start()

    def _loop_telemetria(self):
        while True:
            try:
                cpu = self.telemetria.get_cpu_percent()
                ram_pct, ram_used, ram_total = self.telemetria.get_ram_info()
                procs = self.telemetria.get_process_list()
                self.root.after(0, lambda c=cpu, rp=ram_pct, ru=ram_used, rt=ram_total, p=procs: self.atualizar_dados_telemetria(c, rp, ru, rt, p))
            except Exception:
                pass
            time.sleep(2.0)

    def atualizar_dados_telemetria(self, cpu, ram_pct, ram_used, ram_total, procs):
        self.processos = procs
        if hasattr(self, "lbl_tele_cpu"):
            self.lbl_tele_cpu.config(text=f"CPU: {cpu:.1f}%")
            self.lbl_tele_ram.config(text=f"RAM: {ram_pct:.1f}% ({formatar_bytes(ram_used)})")
            self.ring_a.set_percent(cpu)
            self.ring_b.set_percent(ram_pct)
        if self.nav_ativa == "processos":
            self.renderizar_tabela_processos()

    def dialogo_nova_tarefa(self):
        top = tk.Toplevel(self.root)
        top.title("Nova Tarefa")
        top.geometry("380x240")
        top.configure(bg=SURFACE_MAIN)
        top.resizable(False, False)

        tk.Label(top, text="Título da Tarefa:", font=(self.fonte_base, 9, "bold"), fg=TEXT_PRIMARY, bg=SURFACE_MAIN).pack(anchor="w", padx=16, pady=(16, 4))
        ent_t = tk.Entry(top, font=(self.fonte_base, 9), bg=SURFACE_TIMELINE, highlightthickness=1, highlightbackground=BORDER_SUBTLE)
        ent_t.pack(fill="x", padx=16)

        tk.Label(top, text="Categoria:", font=(self.fonte_base, 9, "bold"), fg=TEXT_PRIMARY, bg=SURFACE_MAIN).pack(anchor="w", padx=16, pady=(8, 4))
        cbo = ttk.Combobox(top, values=["A", "B", "C", "D"], state="readonly")
        cbo.set("A")
        cbo.pack(fill="x", padx=16)

        def salvar():
            txt = ent_t.get().strip()
            if not txt:
                return
            cat = cbo.get()
            self.tarefas_kanban.append({"id": len(self.tarefas_kanban) + 1, "title": txt, "cat": cat, "status": "DRAFT", "desc": "Nova tarefa adicionada"})
            self.salvar_tarefas_kanban()
            top.destroy()
            self.atualizar_visao_central()

        btn = tk.Label(top, text="Salvar Tarefa", font=(self.fonte_base, 9, "bold"), fg=TEXT_INVERSE, bg=CAT_A_BLUE, padx=12, pady=6, cursor="hand2")
        btn.pack(pady=16)
        btn.bind("<Button-1>", lambda e: salvar())


def main():
    app = TaskManagerApp()
    app.root.mainloop()


if __name__ == "__main__":
    main()
