"""
OhMyShark Ultra Task & Process Manager (taskmanager.py)
Recriado do Zero com Telemetria em Tempo Real, Processos, Gráficos Vetoriais,
Gerenciamento de Tarefas com Prioridades e Painel de Agentes de IA OhMyShark.

Zero dependências externas obrigatórias (100% Python Standard Library + Tkinter nativo).
Suporta aceleração opcional com psutil se presente no ambiente.
"""

import datetime
import getpass
import json
import math
import os
import platform
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
from collections import deque
from pathlib import Path
from tkinter import messagebox, ttk

# Tenta carregar psutil opcionalmente para máxima performance
try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    psutil = None
    HAS_PSUTIL = False

# Tenta carregar ctypes no Windows para telemetria nativa sem psutil
if os.name == "nt":
    import ctypes
    from ctypes import wintypes
    HAS_CTYPES = True
else:
    HAS_CTYPES = False

WIN = os.name == "nt"
SEM_JANELA = getattr(subprocess, "CREATE_NO_WINDOW", 0)
ANSI_REGEX = re.compile(r"\x1b\[[0-9;?]*[ -/]*[@-~]")

# Caminhos de persistência
DIR_CONFIG = Path.home() / ".omsk"
DIR_CONFIG.mkdir(parents=True, exist_ok=True)
ARQUIVO_TAREFAS = DIR_CONFIG / "tarefas.json"

# ==============================================================================
# PALETA DE CORES CYBERPUNK / SHARK ULTRA
# ==============================================================================
BG_DARK = "#070A13"         # Fundo principal ultra escuro
BG_PANEL = "#0D1322"        # Painéis e cards
BG_CARD = "#141D33"         # Cards internos e inputs
BG_HEADER = "#090D18"       # Barra de título e status
CYAN_NEON = "#00F0FF"       # Destaque primário Neon Shark
CYAN_DIM = "#00A3B0"        # Ciano atenuado
GOLD_ACCENT = "#D4AF37"     # Destaque dourado bíblico / pro
GREEN_LIVE = "#10B981"      # Status ativo / saudável
RED_ALERT = "#EF4444"       # Alerta / Erro / Kill
PURPLE_AI = "#A855F7"       # Agentes / IA
FG_LIGHT = "#F1F5F9"        # Texto principal
FG_MUTED = "#64748B"        # Texto secundário
FG_SUBTLE = "#334155"       # Bordas sutis
BORDER_COLOR = "#1E293B"    # Bordas de divisórias
HOVER_COLOR = "#1E2C4A"     # Hover de botões
SELECT_COLOR = "#003D4D"    # Seleção de linhas


def escolher_fonte(root):
    disponiveis = set(tkfont.families(root))
    for f in ("Consolas", "Cascadia Code", "Fira Code", "JetBrains Mono", "Courier New", "DejaVu Sans Mono", "Courier"):
        if f in disponiveis:
            return f
    return "Courier"


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
# COLETOR DE TELEMETRIA NATIVO (FALLBACK ROBUSTO SEM PSUTIL)
# ==============================================================================
class NativeMetrics:
    def __init__(self):
        self.prev_cpu_times = None
        self.prev_cpu_calc_time = None
        self.num_cpus = os.cpu_count() or 4
        self.setup_windows_memory()

    def setup_windows_memory(self):
        if WIN and HAS_CTYPES:
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
            self.kernel32 = ctypes.windll.kernel32

    def get_system_metrics(self):
        cpu_percent = 0.0
        ram_percent = 0.0
        ram_used = 0
        ram_total = 1024 * 1024 * 1024 * 8  # 8GB default fallback

        if HAS_PSUTIL:
            try:
                cpu_percent = psutil.cpu_percent(interval=None)
                mem = psutil.virtual_memory()
                ram_percent = mem.percent
                ram_used = mem.used
                ram_total = mem.total
                return cpu_percent, ram_percent, ram_used, ram_total
            except Exception:
                pass

        # Windows Nativo
        if WIN and HAS_CTYPES:
            try:
                stat = self.MEMORYSTATUSEX()
                stat.dwLength = ctypes.sizeof(self.MEMORYSTATUSEX)
                self.kernel32.GlobalMemoryStatusEx(ctypes.byref(stat))
                ram_percent = float(stat.dwMemoryLoad)
                ram_total = stat.ullTotalPhys
                ram_used = ram_total - stat.ullAvailPhys
            except Exception:
                pass

            try:
                idle = ctypes.c_uint64()
                kernel = ctypes.c_uint64()
                user = ctypes.c_uint64()
                if self.kernel32.GetSystemTimes(ctypes.byref(idle), ctypes.byref(kernel), ctypes.byref(user)):
                    curr_times = (idle.value, kernel.value, user.value)
                    curr_time = time.time()
                    if self.prev_cpu_times and self.prev_cpu_calc_time:
                        dt = curr_time - self.prev_cpu_calc_time
                        if dt > 0.3:
                            d_idle = curr_times[0] - self.prev_cpu_times[0]
                            d_kernel = curr_times[1] - self.prev_cpu_times[1]
                            d_user = curr_times[2] - self.prev_cpu_times[2]
                            total_sys = d_kernel + d_user
                            if total_sys > 0:
                                busy = total_sys - d_idle
                                cpu_percent = max(0.0, min(100.0, (busy / total_sys) * 100.0))
                            self.prev_cpu_times = curr_times
                            self.prev_cpu_calc_time = curr_time
                    else:
                        self.prev_cpu_times = curr_times
                        self.prev_cpu_calc_time = curr_time
            except Exception:
                pass
        elif platform.system() == "Linux":
            try:
                with open("/proc/meminfo", "r") as f:
                    lines = f.readlines()
                    total = 0
                    avail = 0
                    for line in lines:
                        if line.startswith("MemTotal:"):
                            total = int(line.split()[1]) * 1024
                        elif line.startswith("MemAvailable:"):
                            avail = int(line.split()[1]) * 1024
                    if total > 0:
                        ram_total = total
                        ram_used = total - avail
                        ram_percent = (ram_used / ram_total) * 100.0
            except Exception:
                pass

        return cpu_percent, ram_percent, ram_used, ram_total

    def get_process_list(self):
        procs = []
        if HAS_PSUTIL:
            try:
                for p in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info', 'status', 'username']):
                    try:
                        info = p.info
                        mem = info.get('memory_info')
                        rss = mem.rss if mem else 0
                        procs.append({
                            "pid": info['pid'],
                            "name": info['name'] or "Unknown",
                            "cpu": info.get('cpu_percent') or 0.0,
                            "ram": rss,
                            "status": info.get('status') or "running",
                            "user": info.get('username') or "N/A"
                        })
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        continue
                return procs
            except Exception:
                pass

        # Fallback Windows: tasklist
        if WIN:
            try:
                cmd = ["tasklist", "/FO", "CSV", "/NH"]
                res = subprocess.run(cmd, capture_output=True, text=True, creationflags=SEM_JANELA, timeout=3)
                lines = res.stdout.strip().split("\n")
                for line in lines:
                    parts = [p.strip('"\r') for p in line.split('","')]
                    if len(parts) >= 5:
                        name = parts[0]
                        try:
                            pid = int(parts[1])
                            mem_str = parts[4].replace(".", "").replace(",", "").replace(" K", "").replace("K", "").strip()
                            mem_bytes = int(mem_str) * 1024
                        except Exception:
                            pid = 0
                            mem_bytes = 0
                        procs.append({
                            "pid": pid,
                            "name": name,
                            "cpu": 0.0,
                            "ram": mem_bytes,
                            "status": "running",
                            "user": "System/User"
                        })
            except Exception:
                pass
        else:
            try:
                cmd = ["ps", "-eo", "pid,user,%cpu,rss,comm"]
                res = subprocess.run(cmd, capture_output=True, text=True, timeout=3)
                lines = res.stdout.strip().split("\n")[1:]
                for line in lines:
                    parts = line.split(None, 4)
                    if len(parts) >= 5:
                        try:
                            pid = int(parts[0])
                            user = parts[1]
                            cpu = float(parts[2])
                            rss = int(parts[3]) * 1024
                            name = parts[4]
                            procs.append({
                                "pid": pid,
                                "name": name,
                                "cpu": cpu,
                                "ram": rss,
                                "status": "running",
                                "user": user
                            })
                        except Exception:
                            continue
            except Exception:
                pass

        return procs


# ==============================================================================
# WIDGET CUSTOMIZADO: GRAPH CANVAS (OSCILLOSCOPE ULTRA HUD)
# ==============================================================================
class SmoothGraph(tk.Canvas):
    def __init__(self, master, label="CPU", color=CYAN_NEON, max_points=60, **kwargs):
        super().__init__(master, bg=BG_CARD, highlightthickness=1, highlightbackground=BORDER_COLOR, **kwargs)
        self.label = label
        self.color = color
        self.data = deque([0.0] * max_points, maxlen=max_points)
        self.bind("<Configure>", lambda e: self.redraw())

    def push(self, val):
        self.data.append(max(0.0, min(100.0, float(val))))
        self.redraw()

    def redraw(self):
        self.delete("all")
        w = self.winfo_width()
        h = self.winfo_height()
        if w < 10 or h < 10:
            return

        # Grid de fundo
        for y in range(0, h, 24):
            self.create_line(0, y, w, y, fill=BORDER_COLOR, dash=(2, 4))
        for x in range(0, w, 32):
            self.create_line(x, 0, x, h, fill=BORDER_COLOR, dash=(2, 4))

        # Desenha linha gráfica com gradiente e preenchimento
        pts = list(self.data)
        n = len(pts)
        if n < 2:
            return

        step = w / (n - 1)
        coords = []
        for i, val in enumerate(pts):
            x = i * step
            y = h - (val / 100.0) * (h - 12) - 6
            coords.extend([x, y])

        # Preenchimento poligonal sob a curva
        poly_coords = [0, h] + coords + [w, h]
        self.create_polygon(poly_coords, fill=BG_PANEL, outline="")

        # Linha Neon
        self.create_line(coords, fill=self.color, width=2, smooth=True)

        # Label e valor atual
        curr = pts[-1]
        self.create_text(10, 12, text=f"{self.label}: {curr:.1f}%", fill=self.color,
                         anchor="w", font=("Consolas", 10, "bold"))


# ==============================================================================
# APLICAÇÃO PRINCIPAL: TASK MANAGER ULTRA
# ==============================================================================
class TaskManagerApp:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("OhMyShark Task & Process Manager Ultra")
        self.root.geometry("980x680+80+80")
        self.root.minsize(740, 500)
        self.root.configure(bg=BG_DARK)

        # Configura estilo do ttk
        self.fonte_mono = escolher_fonte(self.root)
        self.style = ttk.Style()
        self.style.theme_use("clam")
        self.configurar_estilos_ttk()

        self.telemetria = NativeMetrics()
        self.tarefas = self.carregar_tarefas()
        self.processos = []
        self.filtro_proc = ""
        self.coluna_ordem = "cpu"
        self.ordem_reversa = True

        # Estados de terminal integrado
        self.cwd = Path.home()
        self.historico_cmd = []
        self.idx_hist = 0
        self.proc_terminal = None
        self.fila_terminal = queue.Queue()

        self.construir_interface()
        self.iniciar_threads_background()

    def configurar_estilos_ttk(self):
        s = self.style
        s.configure("TNotebook", background=BG_DARK, borderwidth=0)
        s.configure("TNotebook.Tab", background=BG_PANEL, foreground=FG_MUTED,
                    font=(self.fonte_mono, 10, "bold"), padding=[16, 8], borderwidth=0)
        s.map("TNotebook.Tab",
              background=[("selected", BG_CARD), ("active", HOVER_COLOR)],
              foreground=[("selected", CYAN_NEON), ("active", FG_LIGHT)])

        s.configure("Treeview", background=BG_CARD, foreground=FG_LIGHT,
                    fieldbackground=BG_CARD, font=(self.fonte_mono, 9),
                    rowheight=24, borderwidth=0)
        s.configure("Treeview.Heading", background=BG_PANEL, foreground=CYAN_NEON,
                    font=(self.fonte_mono, 9, "bold"), relief="flat")
        s.map("Treeview.Heading", background=[("active", HOVER_COLOR)])
        s.map("Treeview", background=[("selected", SELECT_COLOR)],
              foreground=[("selected", CYAN_NEON)])

    def carregar_tarefas(self):
        if not ARQUIVO_TAREFAS.exists():
            return [
                {"texto": "Configurar modelos e rotas do OMSK", "feita": False, "prioridade": "Alta", "data": "2026-10-08"},
                {"texto": "Validar telemetria de processos em tempo real", "feita": True, "prioridade": "Média", "data": "2026-10-08"},
                {"texto": "Executar auditoria de segurança dos subagentes", "feita": False, "prioridade": "Crítica", "data": "2026-10-08"},
            ]
        try:
            return json.loads(ARQUIVO_TAREFAS.read_text(encoding="utf-8"))
        except Exception:
            return []

    def salvar_tarefas(self):
        try:
            ARQUIVO_TAREFAS.write_text(json.dumps(self.tarefas, ensure_ascii=False, indent=2), encoding="utf-8")
        except Exception as e:
            print("Erro ao salvar tarefas:", e)

    def construir_interface(self):
        # 1. HEADER HUD SUPERIOR COM TELEMETRIA
        self.header = tk.Frame(self.root, bg=BG_HEADER, height=72, highlightthickness=1, highlightbackground=BORDER_COLOR)
        self.header.pack(fill="x", side="top", padx=8, pady=(8, 4))
        self.header.pack_propagate(False)

        # Logo / Branding OhMyShark
        brand_frame = tk.Frame(self.header, bg=BG_HEADER)
        brand_frame.pack(side="left", padx=16, pady=8)
        tk.Label(brand_frame, text="🦈 OHMYSHARK", font=(self.fonte_mono, 13, "bold"),
                 fg=CYAN_NEON, bg=BG_HEADER).pack(anchor="w")
        tk.Label(brand_frame, text="ULTRA TASK & PROCESS HUD", font=(self.fonte_mono, 8),
                 fg=GOLD_ACCENT, bg=BG_HEADER).pack(anchor="w")

        # Cards HUD métricas rápidas
        self.hud_cpu_val = tk.Label(self.header, text="CPU: 0.0%", font=(self.fonte_mono, 11, "bold"),
                                    fg=GREEN_LIVE, bg=BG_CARD, padx=12, pady=6, relief="flat",
                                    highlightthickness=1, highlightbackground=BORDER_COLOR)
        self.hud_cpu_val.pack(side="left", padx=8, pady=12)

        self.hud_ram_val = tk.Label(self.header, text="RAM: 0.0% (0 MB)", font=(self.fonte_mono, 11, "bold"),
                                    fg=CYAN_NEON, bg=BG_CARD, padx=12, pady=6, relief="flat",
                                    highlightthickness=1, highlightbackground=BORDER_COLOR)
        self.hud_ram_val.pack(side="left", padx=8, pady=12)

        self.hud_procs_val = tk.Label(self.header, text="PROCESSOS: 0", font=(self.fonte_mono, 11, "bold"),
                                      fg=PURPLE_AI, bg=BG_CARD, padx=12, pady=6, relief="flat",
                                      highlightthickness=1, highlightbackground=BORDER_COLOR)
        self.hud_procs_val.pack(side="left", padx=8, pady=12)

        # Botão Ação Rápida Fechar / Atualizar
        btn_refresh = tk.Label(self.header, text="🔄 REFRESH", font=(self.fonte_mono, 9, "bold"),
                               fg=FG_LIGHT, bg=BG_PANEL, padx=12, pady=6, cursor="hand2",
                               highlightthickness=1, highlightbackground=BORDER_COLOR)
        btn_refresh.pack(side="right", padx=12, pady=12)
        btn_refresh.bind("<Button-1>", lambda e: self.atualizar_ciclo())
        btn_refresh.bind("<Enter>", lambda e: btn_refresh.config(bg=HOVER_COLOR))
        btn_refresh.bind("<Leave>", lambda e: btn_refresh.config(bg=BG_PANEL))

        # 2. NOTEBOOK / ABAS PRINCIPAIS
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill="both", expand=True, padx=8, pady=4)

        # Criação das Abas
        self.tab_processos = tk.Frame(self.notebook, bg=BG_DARK)
        self.tab_graficos = tk.Frame(self.notebook, bg=BG_DARK)
        self.tab_tarefas = tk.Frame(self.notebook, bg=BG_DARK)
        self.tab_agentes = tk.Frame(self.notebook, bg=BG_DARK)
        self.tab_terminal = tk.Frame(self.notebook, bg=BG_DARK)

        self.notebook.add(self.tab_processos, text="⚡ Processos do Sistema")
        self.notebook.add(self.tab_graficos, text="📊 Gráficos em Tempo Real")
        self.notebook.add(self.tab_tarefas, text="📋 Gerenciador de Tarefas")
        self.notebook.add(self.tab_agentes, text="🤖 Agentes & IA OMSK")
        self.notebook.add(self.tab_terminal, text="💻 Terminal Integrado")

        self.montar_aba_processos()
        self.montar_aba_graficos()
        self.montar_aba_tarefas()
        self.montar_aba_agentes()
        self.montar_aba_terminal()

        # 3. STATUS BAR INFERIOR
        self.statusbar = tk.Frame(self.root, bg=BG_HEADER, height=26, highlightthickness=1, highlightbackground=BORDER_COLOR)
        self.statusbar.pack(fill="x", side="bottom", padx=8, pady=(0, 8))
        self.lbl_status = tk.Label(self.statusbar, text="● Sistema Operacional Online | Engine Shark Ativo",
                                   font=(self.fonte_mono, 8), fg=GREEN_LIVE, bg=BG_HEADER)
        self.lbl_status.pack(side="left", padx=8)

        self.lbl_user_host = tk.Label(self.statusbar, text=f"{getpass.getuser()}@{socket.gethostname()}",
                                      font=(self.fonte_mono, 8), fg=FG_MUTED, bg=BG_HEADER)
        self.lbl_user_host.pack(side="right", padx=8)

    # --------------------------------------------------------------------------
    # ABA 1: PROCESSOS DO SISTEMA
    # --------------------------------------------------------------------------
    def montar_aba_processos(self):
        f_top = tk.Frame(self.tab_processos, bg=BG_DARK)
        f_top.pack(fill="x", padx=8, pady=8)

        tk.Label(f_top, text="Filtrar Processo:", font=(self.fonte_mono, 9),
                 fg=CYAN_NEON, bg=BG_DARK).pack(side="left", padx=4)

        self.ent_busca_proc = tk.Entry(f_top, font=(self.fonte_mono, 9), bg=BG_CARD,
                                       fg=FG_LIGHT, insertbackground=CYAN_NEON,
                                       highlightthickness=1, highlightbackground=BORDER_COLOR)
        self.ent_busca_proc.pack(side="left", fill="x", expand=True, padx=8)
        self.ent_busca_proc.bind("<KeyRelease>", lambda e: self.filtrar_processos())

        btn_kill = tk.Label(f_top, text="🛑 Encerrar Processo (Kill)", font=(self.fonte_mono, 9, "bold"),
                            fg=RED_ALERT, bg=BG_CARD, padx=12, pady=4, cursor="hand2",
                            highlightthickness=1, highlightbackground=RED_ALERT)
        btn_kill.pack(side="right", padx=4)
        btn_kill.bind("<Button-1>", lambda e: self.matar_processo_selecionado())

        # Tabela Treeview
        colunas = ("pid", "name", "cpu", "ram", "status", "user")
        self.tree_procs = ttk.Treeview(self.tab_processos, columns=colunas, show="headings", selectmode="browse")
        self.tree_procs.heading("pid", text="PID", command=lambda: self.ordenar_processos("pid"))
        self.tree_procs.heading("name", text="Nome do Executável", command=lambda: self.ordenar_processos("name"))
        self.tree_procs.heading("cpu", text="CPU %", command=lambda: self.ordenar_processos("cpu"))
        self.tree_procs.heading("ram", text="Memória RAM", command=lambda: self.ordenar_processos("ram"))
        self.tree_procs.heading("status", text="Estado", command=lambda: self.ordenar_processos("status"))
        self.tree_procs.heading("user", text="Usuário", command=lambda: self.ordenar_processos("user"))

        self.tree_procs.column("pid", width=70, anchor="center")
        self.tree_procs.column("name", width=260, anchor="w")
        self.tree_procs.column("cpu", width=90, anchor="center")
        self.tree_procs.column("ram", width=120, anchor="center")
        self.tree_procs.column("status", width=90, anchor="center")
        self.tree_procs.column("user", width=160, anchor="w")

        scrollbar = ttk.Scrollbar(self.tab_processos, orient="vertical", command=self.tree_procs.yview)
        self.tree_procs.configure(yscrollcommand=scrollbar.set)

        self.tree_procs.pack(side="left", fill="both", expand=True, padx=(8, 0), pady=4)
        scrollbar.pack(side="right", fill="y", padx=(0, 8), pady=4)

    def ordenar_processos(self, coluna):
        if self.coluna_ordem == coluna:
            self.ordem_reversa = not self.ordem_reversa
        else:
            self.coluna_ordem = coluna
            self.ordem_reversa = True if coluna in ("cpu", "ram") else False
        self.renderizar_tabela_processos()

    def filtrar_processos(self):
        self.filtro_proc = self.ent_busca_proc.get().strip().lower()
        self.renderizar_tabela_processos()

    def renderizar_tabela_processos(self):
        for item in self.tree_procs.get_children():
            self.tree_procs.delete(item)

        procs_filtrados = [p for p in self.processos if not self.filtro_proc or self.filtro_proc in p["name"].lower()]

        if self.coluna_ordem in ("cpu", "ram", "pid"):
            procs_filtrados.sort(key=lambda x: x.get(self.coluna_ordem, 0), reverse=self.ordem_reversa)
        else:
            procs_filtrados.sort(key=lambda x: str(x.get(self.coluna_ordem, "")).lower(), reverse=self.ordem_reversa)

        for p in procs_filtrados[:150]:
            self.tree_procs.insert("", "end", values=(
                p["pid"],
                p["name"],
                f"{p['cpu']:.1f}%",
                formatar_bytes(p["ram"]),
                p["status"],
                p["user"]
            ))

    def matar_processo_selecionado(self):
        sel = self.tree_procs.selection()
        if not sel:
            messagebox.showwarning("Aviso", "Selecione um processo na tabela para encerrar.")
            return
        item = self.tree_procs.item(sel[0])
        pid = int(item["values"][0])
        nome = item["values"][1]

        if messagebox.askyesno("Confirmar Kill", f"Deseja forçar o encerramento do processo {nome} (PID: {pid})?"):
            try:
                if HAS_PSUTIL:
                    p = psutil.Process(pid)
                    p.kill()
                elif WIN:
                    subprocess.run(["taskkill", "/F", "/PID", str(pid)], creationflags=SEM_JANELA)
                else:
                    os.kill(pid, signal.SIGKILL)
                messagebox.showinfo("Sucesso", f"Processo {nome} ({pid}) encerrado.")
                self.atualizar_ciclo()
            except Exception as ex:
                messagebox.showerror("Erro", f"Falha ao encerrar processo: {ex}")

    # --------------------------------------------------------------------------
    # ABA 2: GRÁFICOS EM TEMPO REAL
    # --------------------------------------------------------------------------
    def montar_aba_graficos(self):
        f_cards = tk.Frame(self.tab_graficos, bg=BG_DARK)
        f_cards.pack(fill="both", expand=True, padx=8, pady=8)

        # Gráfico CPU
        self.graph_cpu = SmoothGraph(f_cards, label="USO TOTAL DE CPU", color=CYAN_NEON, height=180)
        self.graph_cpu.pack(fill="both", expand=True, padx=4, pady=4)

        # Gráfico RAM
        self.graph_ram = SmoothGraph(f_cards, label="USO DE MEMÓRIA RAM", color=PURPLE_AI, height=180)
        self.graph_ram.pack(fill="both", expand=True, padx=4, pady=4)

    # --------------------------------------------------------------------------
    # ABA 3: GERENCIADOR DE TAREFAS
    # --------------------------------------------------------------------------
    def montar_aba_tarefas(self):
        f_top = tk.Frame(self.tab_tarefas, bg=BG_DARK)
        f_top.pack(fill="x", padx=8, pady=8)

        tk.Label(f_top, text="Nova Tarefa:", font=(self.fonte_mono, 9), fg=GOLD_ACCENT, bg=BG_DARK).pack(side="left", padx=4)
        self.ent_tarefa = tk.Entry(f_top, font=(self.fonte_mono, 9), bg=BG_CARD, fg=FG_LIGHT,
                                   insertbackground=CYAN_NEON, highlightthickness=1, highlightbackground=BORDER_COLOR)
        self.ent_tarefa.pack(side="left", fill="x", expand=True, padx=8)
        self.ent_tarefa.bind("<Return>", lambda e: self.adicionar_tarefa())

        # Seletor de Prioridade
        self.cbo_prio = ttk.Combobox(f_top, values=["Baixa", "Média", "Alta", "Crítica"], state="readonly", width=10)
        self.cbo_prio.set("Média")
        self.cbo_prio.pack(side="left", padx=4)

        btn_add = tk.Label(f_top, text="➕ Adicionar", font=(self.fonte_mono, 9, "bold"),
                           fg=CYAN_NEON, bg=BG_CARD, padx=12, pady=4, cursor="hand2",
                           highlightthickness=1, highlightbackground=BORDER_COLOR)
        btn_add.pack(side="left", padx=4)
        btn_add.bind("<Button-1>", lambda e: self.adicionar_tarefa())

        btn_del = tk.Label(f_top, text="🗑️ Remover", font=(self.fonte_mono, 9, "bold"),
                           fg=RED_ALERT, bg=BG_CARD, padx=12, pady=4, cursor="hand2",
                           highlightthickness=1, highlightbackground=BORDER_COLOR)
        btn_del.pack(side="right", padx=4)
        btn_del.bind("<Button-1>", lambda e: self.remover_tarefa())

        btn_toggle = tk.Label(f_top, text="✔️ Concluir/Alternar", font=(self.fonte_mono, 9, "bold"),
                              fg=GREEN_LIVE, bg=BG_CARD, padx=12, pady=4, cursor="hand2",
                              highlightthickness=1, highlightbackground=BORDER_COLOR)
        btn_toggle.pack(side="right", padx=4)
        btn_toggle.bind("<Button-1>", lambda e: self.alternar_tarefa())

        # Tabela de Tarefas
        colunas = ("status", "prio", "desc", "data")
        self.tree_tarefas = ttk.Treeview(self.tab_tarefas, columns=colunas, show="headings", selectmode="browse")
        self.tree_tarefas.heading("status", text="Status")
        self.tree_tarefas.heading("prio", text="Prioridade")
        self.tree_tarefas.heading("desc", text="Descrição da Tarefa")
        self.tree_tarefas.heading("data", text="Data de Criação")

        self.tree_tarefas.column("status", width=90, anchor="center")
        self.tree_tarefas.column("prio", width=100, anchor="center")
        self.tree_tarefas.column("desc", width=460, anchor="w")
        self.tree_tarefas.column("data", width=120, anchor="center")

        scroll_t = ttk.Scrollbar(self.tab_tarefas, orient="vertical", command=self.tree_tarefas.yview)
        self.tree_tarefas.configure(yscrollcommand=scroll_t.set)

        self.tree_tarefas.pack(side="left", fill="both", expand=True, padx=(8, 0), pady=4)
        scroll_t.pack(side="right", fill="y", padx=(0, 8), pady=4)
        self.renderizar_tarefas()

    def adicionar_tarefa(self):
        txt = self.ent_tarefa.get().strip()
        if not txt:
            return
        prio = self.cbo_prio.get()
        data_hj = datetime.date.today().isoformat()
        self.tarefas.append({"texto": txt, "feita": False, "prioridade": prio, "data": data_hj})
        self.ent_tarefa.delete(0, "end")
        self.salvar_tarefas()
        self.renderizar_tarefas()

    def alternar_tarefa(self):
        sel = self.tree_tarefas.selection()
        if not sel:
            return
        idx = self.tree_tarefas.index(sel[0])
        if 0 <= idx < len(self.tarefas):
            self.tarefas[idx]["feita"] = not self.tarefas[idx]["feita"]
            self.salvar_tarefas()
            self.renderizar_tarefas()

    def remover_tarefa(self):
        sel = self.tree_tarefas.selection()
        if not sel:
            return
        idx = self.tree_tarefas.index(sel[0])
        if 0 <= idx < len(self.tarefas):
            del self.tarefas[idx]
            self.salvar_tarefas()
            self.renderizar_tarefas()

    def renderizar_tarefas(self):
        for item in self.tree_tarefas.get_children():
            self.tree_tarefas.delete(item)
        for t in self.tarefas:
            st = "✅ Concluída" if t["feita"] else "⏳ Pendente"
            self.tree_tarefas.insert("", "end", values=(
                st,
                t.get("prioridade", "Média"),
                t["texto"],
                t.get("data", "")
            ))

    # --------------------------------------------------------------------------
    # ABA 4: AGENTES & IA OMSK
    # --------------------------------------------------------------------------
    def montar_aba_agentes(self):
        f_top = tk.Frame(self.tab_agentes, bg=BG_DARK)
        f_top.pack(fill="x", padx=8, pady=8)

        tk.Label(f_top, text="Monitor de Processos & Subagentes OhMyShark:", font=(self.fonte_mono, 10, "bold"),
                 fg=CYAN_NEON, bg=BG_DARK).pack(side="left", padx=4)

        # Tabela dos agentes OMSK / Bun / Python / Ferramentas
        colunas = ("pid", "tipo", "name", "mem", "status")
        self.tree_agentes = ttk.Treeview(self.tab_agentes, columns=colunas, show="headings", selectmode="browse")
        self.tree_agentes.heading("pid", text="PID")
        self.tree_agentes.heading("tipo", text="Tipo / Runtime")
        self.tree_agentes.heading("name", text="Componente")
        self.tree_agentes.heading("mem", text="RAM Alocada")
        self.tree_agentes.heading("status", text="Status Operacional")

        self.tree_agentes.column("pid", width=80, anchor="center")
        self.tree_agentes.column("tipo", width=140, anchor="center")
        self.tree_agentes.column("name", width=320, anchor="w")
        self.tree_agentes.column("mem", width=120, anchor="center")
        self.tree_agentes.column("status", width=140, anchor="center")

        scroll_a = ttk.Scrollbar(self.tab_agentes, orient="vertical", command=self.tree_agentes.yview)
        self.tree_agentes.configure(yscrollcommand=scroll_a.set)

        self.tree_agentes.pack(side="left", fill="both", expand=True, padx=(8, 0), pady=4)
        scroll_a.pack(side="right", fill="y", padx=(0, 8), pady=4)

    def renderizar_agentes(self):
        for item in self.tree_agentes.get_children():
            self.tree_agentes.delete(item)

        termos_omsk = ("omsk", "ohms", "bun", "python", "node", "taskmanager")
        agentes_encontrados = [p for p in self.processos if any(t in p["name"].lower() for t in termos_omsk)]

        for a in agentes_encontrados:
            tipo = "🤖 OMSK / Bun" if "bun" in a["name"].lower() or "om" in a["name"].lower() else "🐍 Python Kernel / Tool"
            self.tree_agentes.insert("", "end", values=(
                a["pid"],
                tipo,
                a["name"],
                formatar_bytes(a["ram"]),
                "🟢 Ativo / Monitorado"
            ))

    # --------------------------------------------------------------------------
    # ABA 5: TERMINAL INTEGRADO
    # --------------------------------------------------------------------------
    def montar_aba_terminal(self):
        self.txt_term = tk.Text(self.tab_terminal, bg=BG_HEADER, fg=FG_LIGHT,
                                font=(self.fonte_mono, 9), insertbackground=CYAN_NEON,
                                relief="flat", highlightthickness=1, highlightbackground=BORDER_COLOR)
        scroll_term = ttk.Scrollbar(self.tab_terminal, orient="vertical", command=self.txt_term.yview)
        self.txt_term.configure(yscrollcommand=scroll_term.set)

        f_cmd = tk.Frame(self.tab_terminal, bg=BG_DARK)
        f_cmd.pack(fill="x", side="bottom", padx=8, pady=8)

        self.lbl_prompt = tk.Label(f_cmd, text=f"omsk >", font=(self.fonte_mono, 9, "bold"),
                                   fg=CYAN_NEON, bg=BG_DARK)
        self.lbl_prompt.pack(side="left", padx=4)

        self.ent_cmd = tk.Entry(f_cmd, font=(self.fonte_mono, 9), bg=BG_CARD, fg=FG_LIGHT,
                                insertbackground=CYAN_NEON, highlightthickness=1, highlightbackground=BORDER_COLOR)
        self.ent_cmd.pack(side="left", fill="x", expand=True, padx=4)
        self.ent_cmd.bind("<Return>", lambda e: self.executar_comando_terminal())

        self.txt_term.pack(side="left", fill="both", expand=True, padx=(8, 0), pady=4)
        scroll_term.pack(side="right", fill="y", padx=(0, 8), pady=4)

        # Mensagem inicial
        self.txt_term.insert("end", "╔════════════════════════════════════════════════════════════════════╗\n")
        self.txt_term.insert("end", "║     OHMYSHARK ULTRA PROCESS & TASK TERMINAL INTELLIGENCE HUD       ║\n")
        self.txt_term.insert("end", "╚════════════════════════════════════════════════════════════════════╝\n\n")

    def executar_comando_terminal(self):
        cmd = self.ent_cmd.get().strip()
        if not cmd:
            return
        self.ent_cmd.delete(0, "end")
        self.txt_term.insert("end", f"\nomsk > {cmd}\n")
        self.txt_term.see("end")

        def _run():
            try:
                res = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=self.cwd, timeout=15)
                saida = res.stdout if res.stdout else res.stderr
                self.fila_terminal.put(saida)
            except Exception as ex:
                self.fila_terminal.put(f"Erro: {ex}\n")

        threading.Thread(target=_run, daemon=True).start()

    # --------------------------------------------------------------------------
    # THREADS E ATUALIZAÇÃO EM BACKGROUND
    # --------------------------------------------------------------------------
    def iniciar_threads_background(self):
        def _loop_telemetria():
            while True:
                cpu, ram_pct, ram_used, ram_total = self.telemetria.get_system_metrics()
                procs = self.telemetria.get_process_list()

                self.root.after(0, self.atualizar_ui_telemetria, cpu, ram_pct, ram_used, ram_total, procs)
                time.sleep(1.5)

        threading.Thread(target=_loop_telemetria, daemon=True).start()
        self.root.after(100, self.drenar_fila_terminal)

    def drenar_fila_terminal(self):
        while not self.fila_terminal.empty():
            saida = self.fila_terminal.get()
            self.txt_term.insert("end", ANSI_REGEX.sub("", saida))
            self.txt_term.see("end")
        self.root.after(100, self.drenar_fila_terminal)

    def atualizar_ui_telemetria(self, cpu, ram_pct, ram_used, ram_total, procs):
        self.processos = procs
        self.hud_cpu_val.config(text=f"CPU: {cpu:.1f}%")
        self.hud_ram_val.config(text=f"RAM: {ram_pct:.1f}% ({formatar_bytes(ram_used)})")
        self.hud_procs_val.config(text=f"PROCESSOS: {len(procs)}")

        # Atualiza gráficos Canvas
        self.graph_cpu.push(cpu)
        self.graph_ram.push(ram_pct)

        # Atualiza tabelas
        self.renderizar_tabela_processos()
        self.renderizar_agentes()

    def atualizar_ciclo(self):
        cpu, ram_pct, ram_used, ram_total = self.telemetria.get_system_metrics()
        procs = self.telemetria.get_process_list()
        self.atualizar_ui_telemetria(cpu, ram_pct, ram_used, ram_total, procs)


def main():
    app = TaskManagerApp()
    app.root.mainloop()


if __name__ == "__main__":
    main()
