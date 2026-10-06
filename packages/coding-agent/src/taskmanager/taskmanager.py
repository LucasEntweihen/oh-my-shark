"""
Terminal de Tarefas — janela translúcida, sem bordas, com cara e funcionalidade de terminal.

- Só fecha pelo botão ✕ do menu no canto superior direito (Alt+F4 e `exit` são ignorados).
- Menu com 3 botões: ◉ fixar no topo | ◐ transparência | ✕ fechar.
- Terminal de verdade: `cd`, `cd ..`, `cd ~`, `cd -`, `D:` (Windows), Tab completa caminhos,
  setas ↑/↓ navegam no histórico, Ctrl+C interrompe o comando em execução,
  e qualquer outro comando (git, python, npm, dir, ls...) roda na pasta atual.
- Painel de tarefas no topo (a divisória pode ser arrastada):
  botões ✎ editar / ✓ feita / ✕ remover / ⌫ limpar feitas / ➕ adicionar, duplo clique = concluir,
  Delete = remover, clique direito = remover.
- Também dá para gerenciar tarefas pelo terminal:
      todo                lista
      todo add <texto>       cria
      todo edit <n> <texto>  edita (sem <texto>: abre no prompt para você ajustar)
      todo done <n...>       marca como feita (só quando VOCÊ mandar)
      todo undone <n...>     reabre
      todo rm <n...>         remove (aceita 1 3 5 ou 2-4)
      todo clear             remove as concluídas
- Tarefas salvas em tarefas.json (mesma pasta do script).

Uso: python taskmanager.py   (Python 3 com tkinter, nada para instalar)
"""

import getpass
import json
import os
import queue
import re
import signal
import socket
import subprocess
import threading
import ctypes
import tkinter as tk
import tkinter.font as tkfont
from pathlib import Path
from tkinter import ttk

ARQUIVO = Path(__file__).with_name("tarefas.json")
WIN = os.name == "nt"
SEM_JANELA = getattr(subprocess, "CREATE_NO_WINDOW", 0)
ANSI = re.compile(r"\x1b\[[0-9;?]*[ -/]*[@-~]")

# Cores
BG = "#0c0c14"
PAINEL = "#12121c"
BARRA = "#08080e"
SELECAO = "#2a2a3d"
FG = "#cdd6f4"
BRANCO = "#ffffff"
MUDO = "#6c7086"
VERDE = "#a6e3a1"
AZUL = "#89b4fa"
VERMELHO = "#f38ba8"
AMARELO = "#f9e2af"


def codificacao_saida():
    if WIN:
        try:
            return "cp%d" % ctypes.windll.kernel32.GetOEMCP()
        except Exception:
            return "cp850"
    return "utf-8"


def escolher_fonte(root):
    disponiveis = set(tkfont.families(root))
    for nome in ("Cascadia Mono", "Consolas", "Menlo", "DejaVu Sans Mono",
                 "Liberation Mono", "Courier New"):
        if nome in disponiveis:
            return nome
    return "Courier"


class App:
    def __init__(self):
        self.root = r = tk.Tk()
        r.title("Terminal de Tarefas")
        r.overrideredirect(True)                 # sem barra nativa (sem X do sistema)
        r.geometry("720x540+100+100")
        r.minsize(460, 360)
        r.configure(bg=BARRA)

        self.niveis = [0.95, 0.85, 0.70, 0.55]   # níveis de opacidade
        self.nivel = 1
        r.attributes("-alpha", self.niveis[self.nivel])

        self.topo = True
        r.attributes("-topmost", True)

        # Ignora qualquer tentativa de fechar fora do botão ✕ (ex.: Alt+F4)
        r.protocol("WM_DELETE_WINDOW", lambda: None)

        self.fonte = escolher_fonte(r)
        self.tam = 10
        self.enc = codificacao_saida()
        try:
            self.usuario = getpass.getuser()
        except Exception:
            self.usuario = "user"
        self.host = socket.gethostname().split(".")[0]

        self.cwd = Path.home()
        self.anterior = self.cwd
        self.historico = []
        self.pos_hist = 0
        self.proc = None
        self.ocupado = False
        self.fila = queue.Queue()
        self.tarefas = self.carregar()

        self.montar()
        self.atualizar_tarefas()
        self.banner()
        self.atualizar_prompt()
        r.after(40, self.drenar_fila)
        r.after(150, self.entrada.focus_force)

    # ------------------------------------------------------------------ dados
    def carregar(self):
        try:
            dados = json.loads(ARQUIVO.read_text(encoding="utf-8"))
            return [{"texto": str(t["texto"]), 
                     "feita": bool(t.get("feita", False)),
                     "prioridade": str(t.get("prioridade", "Baixa")),
                     "data": str(t.get("data", ""))}
                    for t in dados]
        except Exception:
            return []

    def salvar(self):
        try:
            ARQUIVO.write_text(json.dumps(self.tarefas, ensure_ascii=False, indent=2),
                               encoding="utf-8")
        except Exception as e:
            print("Erro ao salvar:", e)

    # -------------------------------------------------------------- interface
    def botao(self, pai, texto, comando, cor=FG, bg=BARRA, **kw):
        b = tk.Label(pai, text=texto, bg=bg, fg=cor, cursor="hand2",
                     font=(self.fonte, self.tam), **kw)
        b.bind("<Button-1>", lambda e: comando())
        b.bind("<Enter>", lambda e: b.config(bg=SELECAO))
        b.bind("<Leave>", lambda e: b.config(bg=bg))
        return b

    def montar(self):
        r = self.root

        # ---- Barra superior: arrastar + menu de 3 botões à direita
        barra = tk.Frame(r, bg=BARRA, height=32)
        barra.pack(fill="x")
        barra.pack_propagate(False)

        titulo = tk.Label(barra, text="  ▍terminal de tarefas", bg=BARRA, fg=MUDO,
                          font=(self.fonte, 10, "bold"), anchor="w")
        titulo.pack(side="left", fill="both", expand=True)
        for w in (barra, titulo):
            w.bind("<ButtonPress-1>", self.inicio_arrasto)
            w.bind("<B1-Motion>", self.arrastar)

        self.botao(barra, "✕", self.fechar, VERMELHO, BARRA, width=4).pack(side="right", fill="y")
        self.botao(barra, "◐", self.trocar_opacidade, FG, BARRA, width=4).pack(side="right", fill="y")
        self.b_topo = self.botao(barra, "◉", self.alternar_topo, AZUL, BARRA, width=4)
        self.b_topo.pack(side="right", fill="y")

        # ---- Corpo: painel de tarefas (cima) + terminal (baixo)
        paned = tk.PanedWindow(r, orient="vertical", sashwidth=5, bg=BARRA,
                               bd=0, sashrelief="flat", opaqueresize=True)
        paned.pack(fill="both", expand=True)

        # Painel de tarefas
        painel = tk.Frame(paned, bg=PAINEL)
        cab = tk.Frame(painel, bg=PAINEL)
        cab.pack(fill="x")
        tk.Label(cab, text=" TAREFAS", bg=PAINEL, fg=MUDO,
                 font=(self.fonte, 9, "bold")).pack(side="left", pady=(4, 2))
        self.info = tk.Label(cab, text="", bg=PAINEL, fg=MUDO, font=(self.fonte, 9))
        self.info.pack(side="right", padx=8)

        corpo = tk.Frame(painel, bg=PAINEL)
        corpo.pack(fill="both", expand=True, padx=6)
        self.lista = tk.Listbox(
            corpo, bg=PAINEL, fg=FG, selectbackground=SELECAO, selectforeground=BRANCO,
            activestyle="none", relief="flat", highlightthickness=0, borderwidth=0,
            exportselection=False, font=(self.fonte, self.tam))
        rolagem = tk.Scrollbar(corpo, command=self.lista.yview)
        self.lista.config(yscrollcommand=rolagem.set)
        rolagem.pack(side="right", fill="y")
        self.lista.pack(side="left", fill="both", expand=True)
        self.lista.bind("<Double-Button-1>", self.duplo_clique)
        self.lista.bind("<Delete>", lambda e: self.remover_selecionada())
        self.lista.bind("<Button-3>", self.clique_direito)

        botoes = tk.Frame(painel, bg=PAINEL)
        botoes.pack(fill="x", padx=6, pady=(4, 6))
        for texto, cmd, cor in (("✎ editar", self.editar_selecionada, AZUL),
                                ("✓ feita/reabrir", self.alternar_selecionada, VERDE),
                                ("✕ remover", self.remover_selecionada, VERMELHO),
                                ("⌫ limpar feitas", self.limpar_feitas, AMARELO),
                                ("➕ adicionar", self.abrir_janela_adicionar, VERDE)):
            self.botao(botoes, texto, cmd, cor, PAINEL, padx=8, pady=2).pack(side="left", padx=(0, 6))

        # Terminal
        term = tk.Frame(paned, bg=BG)

        linha = tk.Frame(term, bg=BG)
        linha.pack(side="bottom", fill="x")
        self.prompt = tk.Label(linha, text="", bg=BG, fg=VERDE,
                               font=(self.fonte, self.tam, "bold"))
        self.prompt.pack(side="left", padx=(8, 4), pady=4)
        self.entrada = tk.Entry(linha, bg=BG, fg=BRANCO, insertbackground=BRANCO,
                                relief="flat", highlightthickness=0, borderwidth=0,
                                font=(self.fonte, self.tam))
        self.entrada.pack(side="left", fill="x", expand=True, pady=4)
        alca = tk.Label(linha, text="◢", bg=BG, fg=MUDO, cursor="size_nw_se")
        alca.pack(side="right", padx=4)
        alca.bind("<ButtonPress-1>", self.inicio_redim)
        alca.bind("<B1-Motion>", self.redimensionar)

        self.saida = tk.Text(term, bg=BG, fg=FG, relief="flat", borderwidth=0,
                             highlightthickness=0, wrap="char", padx=8, pady=6,
                             font=(self.fonte, self.tam), state="disabled",
                             insertwidth=0, spacing1=1)
        sb = tk.Scrollbar(term, command=self.saida.yview)
        self.saida.config(yscrollcommand=sb.set)
        sb.pack(side="right", fill="y")
        self.saida.pack(side="left", fill="both", expand=True)

        for tag, cor in (("out", FG), ("cmd", BRANCO), ("prompt", VERDE), ("path", AZUL),
                         ("dim", MUDO), ("err", VERMELHO), ("ok", VERDE), ("dir", AZUL)):
            self.saida.tag_config(tag, foreground=cor)
        self.saida.tag_config("prompt", font=(self.fonte, self.tam, "bold"))
        self.saida.tag_config("dir", font=(self.fonte, self.tam, "bold"))

        # Clicar na área de saída devolve o foco ao prompt (a menos que haja seleção)
        self.saida.bind("<ButtonRelease-1>", self.foco_prompt)

        paned.add(painel, minsize=90, height=170)
        paned.add(term, minsize=140, stretch="always")

        e = self.entrada
        e.bind("<Return>", self.enviar)
        e.bind("<Up>", self.hist_anterior)
        e.bind("<Down>", self.hist_proximo)
        e.bind("<Tab>", self.completar)
        e.bind("<Control-c>", self.ctrl_c)
        e.bind("<Control-l>", lambda ev: (self.limpar_tela(), "break")[1])

    def foco_prompt(self, _):
        if not self.saida.tag_ranges("sel"):
            self.entrada.focus_set()

    # ---------------------------------------------------------------- saída
    def escrever(self, texto, tag="out"):
        s = self.saida
        s.config(state="normal")
        s.insert("end", texto, tag)
        if int(s.index("end-1c").split(".")[0]) > 3000:   # limita o histórico na tela
            s.delete("1.0", "500.0")
        s.config(state="disabled")
        s.see("end")

    def limpar_tela(self):
        self.saida.config(state="normal")
        self.saida.delete("1.0", "end")
        self.saida.config(state="disabled")

    def eco(self, cmd):
        self.escrever(f"{self.usuario}@{self.host}", "prompt")
        self.escrever(":", "dim")
        self.escrever(self.caminho_curto(), "path")
        self.escrever("$ ", "dim")
        self.escrever(cmd + "\n", "cmd")

    def caminho_curto(self):
        p, h = str(self.cwd), str(Path.home())
        if p == h:
            return "~"
        if p.startswith(h + os.sep):
            return "~" + p[len(h):]
        return p

    def atualizar_prompt(self):
        if self.ocupado:
            self.prompt.config(text="⏳", fg=AMARELO)
        else:
            self.prompt.config(text=f"{self.usuario}@{self.host}:{self.caminho_curto()}$",
                               fg=VERDE)

    def banner(self):
        self.escrever("Terminal de Tarefas", "prompt")
        self.escrever("  —  digite ", "dim")
        self.escrever("help", "cmd")
        self.escrever(" para ver os comandos. Feche só pelo ✕ do menu.\n\n", "dim")

    # -------------------------------------------------------------- comandos
    def enviar(self, _=None):
        cmd = self.entrada.get().strip()
        self.entrada.delete(0, "end")
        if self.ocupado:
            self.escrever("processo em execução — use Ctrl+C para interromper\n", "err")
            return
        self.eco(cmd)
        if not cmd:
            return
        if not self.historico or self.historico[-1] != cmd:
            self.historico.append(cmd)
        self.pos_hist = len(self.historico)
        self.interpretar(cmd)

    def interpretar(self, cmd):
        partes = cmd.split(None, 1)
        nome = partes[0].lower()
        resto = partes[1] if len(partes) > 1 else ""

        if re.match(r"^cd(\s|$|\.\.|\\|/)", cmd, re.I):
            self.cmd_cd(cmd[2:])
        elif WIN and re.fullmatch(r"[A-Za-z]:", cmd):
            self.cmd_cd(cmd)
        elif nome in ("todo", "tarefa"):
            self.cmd_todo(resto)
        elif nome in ("clear", "cls"):
            self.limpar_tela()
        elif nome == "pwd":
            self.escrever(str(self.cwd) + "\n")
        elif nome in ("exit", "quit"):
            self.escrever("use o botão ✕ do menu (canto superior direito) para fechar.\n", "dim")
        elif nome in ("help", "ajuda", "?"):
            self.cmd_help()
        elif WIN and nome == "ls":
            self.cmd_ls(resto)
        else:
            self.executar_shell(cmd)

    def cmd_help(self):
        linhas = [
            ("cd <pasta>", "entra na pasta (cd .. | cd ~ | cd - | cd sozinho = home | D: troca de disco)"),
            ("ls / dir", "lista a pasta atual"),
            ("pwd", "mostra a pasta atual"),
            ("clear / cls", "limpa a tela (ou Ctrl+L)"),
            ("todo", "lista as tarefas"),
            ("todo add <texto>", "cria uma tarefa"),
            ("todo edit <n> <texto>", "troca o texto (sem <texto>: abre no prompt para editar)"),
            ("todo done <n...>", "marca como feita (aceita 1 3 5 ou 2-4)"),
            ("todo undone <n...>", "reabre a(s) tarefa(s)"),
            ("todo rm <n...>", "remove tarefa(s)"),
            ("todo clear", "remove todas as concluídas"),
            ("Tab / ↑ ↓", "completa caminhos / histórico"),
            ("Ctrl+C", "interrompe o comando em execução"),
            ("<qualquer outro>", "roda no shell da máquina, na pasta atual"),
        ]
        for a, b in linhas:
            self.escrever(f"  {a:<24}", "path")
            self.escrever(b + "\n", "dim")

    # ---- cd / ls
    def resolver(self, arg, nome="cd"):
        arg = arg.strip()
        if len(arg) >= 2 and arg[0] == arg[-1] and arg[0] in "\"'":
            arg = arg[1:-1]
        if WIN and re.fullmatch(r"[A-Za-z]:", arg):
            arg += os.sep
        destino = Path(os.path.expandvars(os.path.expanduser(arg)))
        if not destino.is_absolute():
            destino = self.cwd / destino
        try:
            destino = destino.resolve(strict=True)
        except (OSError, RuntimeError):
            self.escrever(f"{nome}: {arg}: caminho não encontrado\n", "err")
            return None
        if not destino.is_dir():
            self.escrever(f"{nome}: {arg}: não é uma pasta\n", "err")
            return None
        try:
            os.listdir(destino)
        except OSError:
            self.escrever(f"{nome}: {arg}: sem permissão\n", "err")
            return None
        return destino

    def cmd_cd(self, arg):
        arg = arg.strip()
        if WIN:
            arg = re.sub(r"^/d\s+", "", arg, flags=re.I)
        if arg == "":
            destino = Path.home()
        elif arg == "-":
            destino = self.anterior
        else:
            destino = self.resolver(arg, "cd")
            if destino is None:
                return
        self.anterior, self.cwd = self.cwd, destino
        self.atualizar_prompt()
        if arg == "-":
            self.escrever(str(self.cwd) + "\n", "dim")

    def cmd_ls(self, args):
        ocultos, partes = False, []
        for a in args.split():
            if a.startswith("-"):
                ocultos = ocultos or "a" in a
            else:
                partes.append(a)
        alvo = self.resolver(" ".join(partes), "ls") if partes else self.cwd
        if alvo is None:
            return
        pastas, arquivos = [], []
        try:
            for nome in os.listdir(alvo):
                caminho = alvo / nome
                oculto = nome.startswith(".")
                try:
                    oculto = oculto or bool(getattr(os.stat(caminho), "st_file_attributes", 0) & 2)
                except OSError:
                    pass
                if oculto and not ocultos:
                    continue
                (pastas if caminho.is_dir() else arquivos).append(nome)
        except OSError as e:
            self.escrever(f"ls: {e}\n", "err")
            return
        itens = [(n + os.sep, "dir") for n in sorted(pastas, key=str.lower)]
        itens += [(n, "out") for n in sorted(arquivos, key=str.lower)]
        if not itens:
            return
        f = tkfont.Font(family=self.fonte, size=self.tam)
        largura_chars = max(20, (self.saida.winfo_width() - 20) // max(1, f.measure("0")))
        col = max(len(n) for n, _ in itens) + 2
        n_cols = max(1, largura_chars // col)
        for i, (nome, tag) in enumerate(itens):
            fim = "\n" if (i + 1) % n_cols == 0 or i == len(itens) - 1 else ""
            self.escrever(nome.ljust(col) if not fim else nome, tag)
            if fim:
                self.escrever("\n")

    # ---- tarefas pelo terminal
    def cmd_todo(self, resto):
        sub, _, arg = resto.strip().partition(" ")
        sub, arg = sub.lower(), arg.strip()
        if sub in ("", "ls", "list"):
            self.imprimir_tarefas()
        elif sub in ("add", "new", "+"):
            if not arg:
                self.escrever("uso: todo add <texto>\n", "err")
                return
            self.tarefas.append({"texto": arg, "feita": False})
            self.persistir()
            self.escrever(f"+ tarefa {len(self.tarefas)} criada\n", "ok")
        elif sub in ("edit", "ed"):
            self.cmd_editar(arg)
        elif sub in ("done", "do", "x", "ok"):
            self.aplicar_indices(arg, lambda t: t.update(feita=True), "concluída(s)")
        elif sub in ("undone", "undo", "reopen"):
            self.aplicar_indices(arg, lambda t: t.update(feita=False), "reaberta(s)")
        elif sub in ("rm", "del", "remove"):
            self.cmd_remover(arg)
        elif sub == "clear":
            n = sum(1 for t in self.tarefas if t["feita"])
            self.tarefas = [t for t in self.tarefas if not t["feita"]]
            self.persistir()
            self.escrever(f"{n} tarefa(s) concluída(s) removida(s)\n", "ok")
        else:
            self.escrever("subcomandos: todo [add <txt> | edit <n> <txt> | done <n...> | "
                          "undone <n...> | rm <n...> | clear]\n", "err")

    def imprimir_tarefas(self):
        if not self.tarefas:
            self.escrever("nenhuma tarefa. crie uma com 'todo add <texto>' ou pelo botão ➕\n", "dim")
            return
        feitas = sum(1 for t in self.tarefas if t["feita"])
        self.escrever(f"Tarefas ({feitas}/{len(self.tarefas)} concluídas):\n", "path")
        for i, t in enumerate(self.tarefas, 1):
            if t["feita"]:
                self.escrever(f"  {i:>2}. [✓] ", "ok")
                self.escrever(f"{t['texto']}\n", "dim")
            else:
                self.escrever(f"  {i:>2}. [ ] ", "prompt")
                self.escrever(f"{t['texto']}\n", "cmd")

    def parse_indices(self, arg):
        if not arg:
            return []
        res = set()
        for parte in arg.split():
            m = re.fullmatch(r"(\d+)-(\d+)", parte)
            if m:
                a, b = sorted((int(m.group(1)), int(m.group(2))))
                res.update(range(a, b + 1))
            elif parte.isdigit():
                res.add(int(parte))
        return [i - 1 for i in sorted(res) if 1 <= i <= len(self.tarefas)]

    def aplicar_indices(self, arg, fn, rotulo):
        idx = self.parse_indices(arg)
        if not idx:
            self.escrever(f"uso: informe os números válidos (ex.: todo done 1 3 ou 2-4)\n", "err")
            return
        for i in idx:
            fn(self.tarefas[i])
        self.persistir()
        self.escrever(f"{len(idx)} tarefa(s) {rotulo}\n", "ok")

    def cmd_editar(self, arg):
        num, _, novo = arg.partition(" ")
        num, novo = num.strip(), novo.strip()
        if not num.isdigit() or not (1 <= int(num) <= len(self.tarefas)):
            self.escrever("uso: todo edit <número> [novo texto]\n", "err")
            return
        idx = int(num) - 1
        if novo:
            self.tarefas[idx]["texto"] = novo
            self.persistir()
            self.escrever(f"tarefa {num} atualizada\n", "ok")
        else:
            self.entrada.delete(0, "end")
            self.entrada.insert(0, f"todo edit {num} {self.tarefas[idx]['texto']}")
            self.entrada.focus_set()
            self.entrada.icursor("end")

    def cmd_remover(self, arg):
        idx = sorted(self.parse_indices(arg), reverse=True)
        if not idx:
            self.escrever("uso: todo rm <números> (ex.: todo rm 1 3 ou 2-4)\n", "err")
            return
        for i in idx:
            self.tarefas.pop(i)
        self.persistir()
        self.escrever(f"{len(idx)} tarefa(s) removida(s)\n", "ok")

    # ------------------------------------------------------------ interface
    def persistir(self):
        self.salvar()
        self.atualizar_tarefas()

    def atualizar_tarefas(self):
        self.lista.delete(0, "end")
        feitas = 0
        for i, t in enumerate(self.tarefas):
            prefixo = " ✓ " if t["feita"] else " ○ "
            self.lista.insert("end", f"{prefixo} {t['texto']}")
            if t["feita"]:
                self.lista.itemconfig(i, fg=MUDO)
                feitas += 1
            else:
                self.lista.itemconfig(i, fg=FG)
        total = len(self.tarefas)
        self.info.config(text=f"{feitas}/{total} feitas" if total else "nenhuma tarefa")

    def duplo_clique(self, event):
        sel = self.lista.curselection()
        if not sel:
            return
        idx = sel[0]
        self.tarefas[idx]["feita"] = not self.tarefas[idx]["feita"]
        self.persistir()

    def alternar_selecionada(self):
        sel = self.lista.curselection()
        if not sel:
            return
        idx = sel[0]
        self.tarefas[idx]["feita"] = not self.tarefas[idx]["feita"]
        self.persistir()

    def editar_selecionada(self):
        sel = self.lista.curselection()
        if not sel:
            return
        idx = sel[0]
        t = self.tarefas[idx]
        janela = tk.Toplevel(self.root)
        janela.title("Editar Tarefa")
        janela.geometry("400x120")
        janela.configure(bg=PAINEL)
        janela.transient(self.root)
        janela.grab_set()

        e = tk.Entry(janela, bg=BG, fg=BRANCO, insertbackground=BRANCO,
                     relief="flat", font=(self.fonte, self.tam))
        e.pack(fill="x", padx=16, pady=(20, 10))
        e.insert(0, t["texto"])
        e.focus_set()
        e.select_range(0, "end")

        def salvar():
            txt = e.get().strip()
            if txt:
                self.tarefas[idx]["texto"] = txt
                self.persistir()
            janela.destroy()

        b = tk.Button(janela, text="Salvar", command=salvar, bg=BARRA, fg=AZUL,
                      relief="flat", font=(self.fonte, self.tam))
        b.pack(pady=6)
        janela.bind("<Return>", lambda ev: salvar())
        janela.bind("<Escape>", lambda ev: janela.destroy())

    def remover_selecionada(self):
        sel = self.lista.curselection()
        if not sel:
            return
        idx = sel[0]
        self.tarefas.pop(idx)
        self.persistir()

    def limpar_feitas(self):
        self.tarefas = [t for t in self.tarefas if not t["feita"]]
        self.persistir()

    def abrir_janela_adicionar(self):
        janela = tk.Toplevel(self.root)
        janela.title("Nova Tarefa")
        janela.geometry("400x120")
        janela.configure(bg=PAINEL)
        janela.transient(self.root)
        janela.grab_set()

        e = tk.Entry(janela, bg=BG, fg=BRANCO, insertbackground=BRANCO,
                     relief="flat", font=(self.fonte, self.tam))
        e.pack(fill="x", padx=16, pady=(20, 10))
        e.focus_set()

        def salvar():
            txt = e.get().strip()
            if txt:
                self.tarefas.append({"texto": txt, "feita": False})
                self.persistir()
            janela.destroy()

        b = tk.Button(janela, text="Adicionar", command=salvar, bg=BARRA, fg=VERDE,
                      relief="flat", font=(self.fonte, self.tam))
        b.pack(pady=6)
        janela.bind("<Return>", lambda ev: salvar())
        janela.bind("<Escape>", lambda ev: janela.destroy())

    def clique_direito(self, event):
        idx = self.lista.nearest(event.y)
        if idx >= 0 and idx < len(self.tarefas):
            self.lista.selection_clear(0, "end")
            self.lista.selection_set(idx)
            self.remover_selecionada()

    # -------------------------------------------------------------- processo
    def executar_shell(self, cmd):
        self.ocupado = True
        self.atualizar_prompt()

        def alvo():
            try:
                kw = {"cwd": str(self.cwd), "stdout": subprocess.PIPE, "stderr": subprocess.PIPE,
                      "stdin": subprocess.DEVNULL}
                if WIN:
                    kw["creationflags"] = SEM_JANELA
                p = subprocess.Popen(cmd, shell=True, **kw)
                self.proc = p

                def ler(fluxo, tag):
                    for linha in iter(fluxo.readline, b""):
                        try:
                            txt = linha.decode(self.enc, errors="replace")
                        except Exception:
                            txt = linha.decode("utf-8", errors="replace")
                        txt = ANSI.sub("", txt)
                        self.fila.put((tag, txt))
                    fluxo.close()

                t1 = threading.Thread(target=ler, args=(p.stdout, "out"), daemon=True)
                t2 = threading.Thread(target=ler, args=(p.stderr, "err"), daemon=True)
                t1.start()
                t2.start()
                p.wait()
                t1.join()
                t2.join()
            except Exception as e:
                self.fila.put(("err", f"erro ao executar: {e}\n"))
            finally:
                self.fila.put(("__fim__", ""))

        threading.Thread(target=alvo, daemon=True).start()

    def drenar_fila(self):
        while not self.fila.empty():
            tag, txt = self.fila.get()
            if tag == "__fim__":
                self.ocupado = False
                self.proc = None
                self.atualizar_prompt()
            else:
                self.escrever(txt, tag)
        self.root.after(40, self.drenar_fila)

    def ctrl_c(self, _=None):
        if self.proc and self.proc.poll() is None:
            try:
                self.proc.terminate()
                self.escrever("^C\n", "err")
            except Exception:
                pass
        else:
            self.entrada.delete(0, "end")

    # --------------------------------------------------------- navegação & autocompletar
    def hist_anterior(self, _=None):
        if not self.historico:
            return "break"
        if self.pos_hist > 0:
            self.pos_hist -= 1
            self.entrada.delete(0, "end")
            self.entrada.insert(0, self.historico[self.pos_hist])
        return "break"

    def hist_proximo(self, _=None):
        if not self.historico:
            return "break"
        if self.pos_hist < len(self.historico) - 1:
            self.pos_hist += 1
            self.entrada.delete(0, "end")
            self.entrada.insert(0, self.historico[self.pos_hist])
        else:
            self.pos_hist = len(self.historico)
            self.entrada.delete(0, "end")
        return "break"

    def completar(self, _=None):
        txt = self.entrada.get()
        # auto-completar caminhos básicos
        partes = txt.split()
        if not partes:
            return "break"
        ultimo = partes[-1]
        caminho = Path(ultimo)
        if not caminho.is_absolute():
            base = self.cwd / caminho.parent
            prefixo = caminho.name
        else:
            base = caminho.parent
            prefixo = caminho.name
        if base.is_dir():
            try:
                matches = [n for n in os.listdir(base) if n.lower().startswith(prefixo.lower())]
                if len(matches) == 1:
                    novo_caminho = str(caminho.parent / matches[0]) if str(caminho.parent) != "." else matches[0]
                    if (base / matches[0]).is_dir():
                        novo_caminho += os.sep
                    partes[-1] = novo_caminho
                    self.entrada.delete(0, "end")
                    self.entrada.insert(0, " ".join(partes))
                    self.entrada.icursor("end")
            except Exception:
                pass
        return "break"

    # ------------------------------------------------------------- utilitários de janela
    def inicio_arrasto(self, event):
        self._x = event.x
        self._y = event.y

    def arrastar(self, event):
        x = self.root.winfo_x() + (event.x - self._x)
        y = self.root.winfo_y() + (event.y - self._y)
        self.root.geometry(f"+{x}+{y}")

    def inicio_redim(self, event):
        self._rx = event.x_root
        self._ry = event.y_root
        self._rw = self.root.winfo_width()
        self._rh = self.root.winfo_height()

    def redimensionar(self, event):
        dx = event.x_root - self._rx
        dy = event.y_root - self._ry
        nw = max(460, self._rw + dx)
        nh = max(360, self._rh + dy)
        self.root.geometry(f"{nw}x{nh}")

    def alternar_topo(self):
        self.topo = not self.topo
        self.root.attributes("-topmost", self.topo)
        self.b_topo.config(fg=AZUL if self.topo else MUDO)

    def trocar_opacidade(self):
        self.nivel = (self.nivel + 1) % len(self.niveis)
        self.root.attributes("-alpha", self.niveis[self.nivel])

    def fechar(self):
        self.salvar()
        if self.proc and self.proc.poll() is None:
            try:
                self.proc.terminate()
            except Exception:
                pass
        self.root.destroy()


def main():
    app = App()
    app.root.mainloop()


if __name__ == "__main__":
    main()
