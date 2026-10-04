export function renderSandboxHtml(): string {
	return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Oh My Shark · Agent Sandbox & Bible Strong Avatar Studio</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
	<style>
		:root {
			--bg-deep-ocean: #0B0F19;
			--bg-shark-skin: #1A2235;
			--bg-card: #151D2E;
			--neon-cyan: #00F0FF;
			--abyssal-purple: #8A2BE2;
			--aged-gold: #D4AF37;
			--papyrus-dark: #2C2518;
			--emerald-status: #10B981;
			--amber-status: #F59E0B;
			--crimson-status: #EF4444;
			--text-primary: #E2E8F0;
			--text-muted: #94A3B8;
			--border-color: #2A3245;
			--font-title: 'Space Grotesk', sans-serif;
			--font-body: 'Inter', sans-serif;
			--font-code: 'JetBrains Mono', monospace;
		}

		* {
			box-sizing: border-box;
			margin: 0;
			padding: 0;
		}

		body {
			background: var(--bg-deep-ocean);
			color: var(--text-primary);
			font-family: var(--font-body);
			height: 100vh;
			display: flex;
			flex-direction: column;
			overflow: hidden;
		}

		/* Header */
		header {
			height: 64px;
			background: rgba(11, 15, 25, 0.95);
			border-bottom: 1px solid var(--border-color);
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 0 24px;
			flex-shrink: 0;
			backdrop-filter: blur(12px);
			z-index: 50;
		}

		.brand {
			display: flex;
			align-items: center;
			gap: 12px;
		}

		.logo-badge {
			background: linear-gradient(135deg, var(--neon-cyan), var(--abyssal-purple));
			width: 38px;
			height: 38px;
			border-radius: 10px;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 20px;
			box-shadow: 0 0 15px rgba(0, 240, 255, 0.4);
		}

		.brand-title {
			font-family: var(--font-title);
			font-weight: 700;
			font-size: 1.15rem;
			letter-spacing: -0.5px;
			background: linear-gradient(90deg, #FFFFFF, var(--neon-cyan));
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
		}

		.brand-tag {
			font-size: 0.75rem;
			background: rgba(138, 43, 226, 0.25);
			color: #C084FC;
			border: 1px solid rgba(138, 43, 226, 0.4);
			padding: 2px 8px;
			border-radius: 999px;
			margin-left: 8px;
		}

		.header-actions {
			display: flex;
			align-items: center;
			gap: 12px;
		}

		/* Buttons */
		.btn {
			font-family: var(--font-body);
			font-size: 0.85rem;
			font-weight: 600;
			padding: 8px 16px;
			border-radius: 8px;
			border: none;
			cursor: pointer;
			display: inline-flex;
			align-items: center;
			gap: 8px;
			transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		}

		.btn-primary {
			background: var(--neon-cyan);
			color: #070B14;
			box-shadow: 0 0 16px rgba(0, 240, 255, 0.35);
		}

		.btn-primary:hover {
			transform: translateY(-2px);
			box-shadow: 0 0 24px rgba(0, 240, 255, 0.6);
		}

		.btn-secondary {
			background: rgba(26, 34, 53, 0.8);
			color: var(--text-primary);
			border: 1px solid var(--border-color);
		}

		.btn-secondary:hover {
			border-color: var(--neon-cyan);
			color: #FFFFFF;
			transform: translateY(-1px);
		}

		.btn-gold {
			background: linear-gradient(135deg, var(--aged-gold), #B45309);
			color: #FFFFFF;
			box-shadow: 0 0 15px rgba(212, 175, 55, 0.3);
		}

		.btn-gold:hover {
			transform: translateY(-2px);
			box-shadow: 0 0 22px rgba(212, 175, 55, 0.55);
		}

		.btn-danger {
			background: rgba(239, 68, 68, 0.15);
			color: var(--crimson-status);
			border: 1px solid rgba(239, 68, 68, 0.3);
		}

		.btn-danger:hover {
			background: var(--crimson-status);
			color: white;
		}

		/* Grid Shell */
		.app-grid {
			display: grid;
			grid-template-columns: 300px 1fr 420px;
			flex: 1;
			overflow: hidden;
			background: var(--bg-deep-ocean);
		}

		/* Left Sidebar: Agents Roster */
		.sidebar-roster {
			background: var(--bg-shark-skin);
			border-right: 1px solid var(--border-color);
			display: flex;
			flex-direction: column;
			overflow: hidden;
		}

		.sidebar-header {
			padding: 16px 20px;
			border-bottom: 1px solid var(--border-color);
			display: flex;
			justify-content: space-between;
			align-items: center;
		}

		.sidebar-title {
			font-family: var(--font-title);
			font-size: 0.95rem;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.5px;
			color: var(--text-muted);
		}

		.agents-list {
			flex: 1;
			overflow-y: auto;
			padding: 12px;
			display: flex;
			flex-direction: column;
			gap: 8px;
		}

		.agent-item {
			padding: 12px 14px;
			background: var(--bg-card);
			border: 1px solid transparent;
			border-radius: 10px;
			cursor: pointer;
			display: flex;
			align-items: center;
			gap: 12px;
			transition: all 0.2s ease;
		}

		.agent-item:hover {
			border-color: rgba(0, 240, 255, 0.4);
			transform: translateX(3px);
			background: #1C263B;
		}

		.agent-item.active {
			border-color: var(--neon-cyan);
			background: #1E2942;
			box-shadow: 0 0 15px rgba(0, 240, 255, 0.15);
		}

		.agent-thumb {
			width: 44px;
			height: 44px;
			border-radius: 50%;
			background: #0B0F19;
			display: flex;
			align-items: center;
			justify-content: center;
			overflow: hidden;
			border: 1px solid var(--border-color);
			flex-shrink: 0;
		}

		.agent-thumb svg {
			width: 100%;
			height: 100%;
		}

		.agent-meta {
			flex: 1;
			min-width: 0;
		}

		.agent-name {
			font-weight: 600;
			font-size: 0.9rem;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.agent-role {
			font-size: 0.75rem;
			color: var(--text-muted);
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		/* Central Workspace */
		.workspace {
			overflow-y: auto;
			padding: 28px 36px;
			display: flex;
			flex-direction: column;
			gap: 24px;
			background: var(--bg-deep-ocean);
		}

		.section-card {
			background: var(--bg-shark-skin);
			border: 1px solid var(--border-color);
			border-radius: 12px;
			padding: 22px;
			display: flex;
			flex-direction: column;
			gap: 16px;
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
		}

		.section-card:focus-within {
			border-color: rgba(0, 240, 255, 0.4);
		}

		.section-header {
			display: flex;
			align-items: center;
			gap: 10px;
			border-bottom: 1px solid rgba(255, 255, 255, 0.05);
			padding-bottom: 10px;
		}

		.section-title {
			font-family: var(--font-title);
			font-size: 1.05rem;
			font-weight: 700;
			color: var(--neon-cyan);
		}

		.form-row {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 16px;
		}

		.form-group {
			display: flex;
			flex-direction: column;
			gap: 6px;
		}

		.form-label {
			font-size: 0.8rem;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.5px;
			color: var(--text-muted);
		}

		.form-input, .form-textarea, .form-select {
			background: #111726;
			border: 1px solid var(--border-color);
			border-radius: 8px;
			color: var(--text-primary);
			font-family: var(--font-body);
			font-size: 0.9rem;
			padding: 10px 14px;
			transition: all 0.2s ease;
		}

		.form-textarea {
			min-height: 120px;
			resize: vertical;
			line-height: 1.5;
			font-family: var(--font-code);
			font-size: 0.85rem;
		}

		.form-input:focus, .form-textarea:focus, .form-select:focus {
			outline: none;
			border-color: var(--neon-cyan);
			box-shadow: 0 0 12px rgba(0, 240, 255, 0.25);
		}

		.chips-container {
			display: flex;
			flex-wrap: wrap;
			gap: 8px;
			margin-top: 4px;
		}

		.chip {
			background: #111726;
			border: 1px solid var(--border-color);
			padding: 6px 12px;
			border-radius: 6px;
			font-size: 0.8rem;
			cursor: pointer;
			display: flex;
			align-items: center;
			gap: 6px;
			user-select: none;
			transition: all 0.15s ease;
		}

		.chip.selected {
			background: rgba(0, 240, 255, 0.15);
			border-color: var(--neon-cyan);
			color: var(--neon-cyan);
			font-weight: 600;
		}

		/* Right Panel: Bible Strong Avatar Studio */
		.avatar-studio {
			background: var(--bg-shark-skin);
			border-left: 1px solid var(--border-color);
			display: flex;
			flex-direction: column;
			overflow-y: auto;
			padding: 24px;
			gap: 20px;
		}

		.preview-viewport {
			background: radial-gradient(circle at center, #1B243B 0%, #0B0F19 80%);
			border: 1px solid var(--border-color);
			border-radius: 16px;
			height: 320px;
			display: flex;
			align-items: center;
			justify-content: center;
			position: relative;
			overflow: hidden;
			box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.6);
		}

		.preview-controls {
			position: absolute;
			bottom: 12px;
			display: flex;
			gap: 8px;
			background: rgba(11, 15, 25, 0.85);
			padding: 4px 10px;
			border-radius: 999px;
			border: 1px solid var(--border-color);
		}

		.preview-btn {
			background: transparent;
			border: none;
			color: var(--text-muted);
			font-size: 0.75rem;
			font-weight: 600;
			padding: 4px 8px;
			border-radius: 999px;
			cursor: pointer;
		}

		.preview-btn.active {
			background: var(--neon-cyan);
			color: #070B14;
		}

		/* Modal for AGENTS.md */
		.modal-backdrop {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: rgba(7, 11, 20, 0.85);
			backdrop-filter: blur(8px);
			display: none;
			align-items: center;
			justify-content: center;
			z-index: 100;
		}

		.modal-card {
			background: var(--bg-shark-skin);
			border: 1px solid var(--border-color);
			border-radius: 16px;
			width: 800px;
			max-width: 90vw;
			height: 80vh;
			display: flex;
			flex-direction: column;
			box-shadow: 0 0 40px rgba(0, 0, 0, 0.8);
			overflow: hidden;
		}

		.modal-header {
			padding: 18px 24px;
			border-bottom: 1px solid var(--border-color);
			display: flex;
			justify-content: space-between;
			align-items: center;
		}

		.modal-body {
			flex: 1;
			padding: 20px 24px;
			overflow-y: auto;
		}

		.toast {
			position: fixed;
			bottom: 24px;
			right: 24px;
			background: var(--bg-card);
			border: 1px solid var(--neon-cyan);
			box-shadow: 0 0 20px rgba(0, 240, 255, 0.3);
			padding: 12px 20px;
			border-radius: 8px;
			font-weight: 600;
			display: none;
			z-index: 200;
			animation: slideUp 0.3s ease;
		}

		@keyframes slideUp {
			from { transform: translateY(20px); opacity: 0; }
			to { transform: translateY(0); opacity: 1; }
		}
	</style>
</head>
<body>
	<header>
		<div class="brand">
			<div class="logo-badge">🦈</div>
			<div>
				<span class="brand-title">Oh My Shark</span>
				<span class="brand-tag">/agent-sandbox</span>
			</div>
		</div>
		<div class="header-actions">
			<button class="btn btn-secondary" onclick="openAgentsMdModal()">
				📄 Ver AGENTS.md
			</button>
			<button class="btn btn-gold" onclick="generateAndSaveAgentsMd()">
				⚡ Gerar & Salvar AGENTS.md
			</button>
			<button class="btn btn-primary" onclick="saveCurrentAgent()">
				💾 Salvar Agente
			</button>
		</div>
	</header>

	<div class="app-grid">
		<!-- Left: Roster -->
		<aside class="sidebar-roster">
			<div class="sidebar-header">
				<span class="sidebar-title">Agentes do Projeto</span>
				<button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.75rem;" onclick="createNewAgent()">
					+ Novo
				</button>
			</div>
			<div class="agents-list" id="agentsList">
				<!-- Injected by JS -->
			</div>
		</aside>

		<!-- Center: Form Attributes -->
		<main class="workspace" id="workspace">
			<div class="section-card">
				<div class="section-header">
					<span class="section-title">Identidade & Estrutura</span>
				</div>
				<div class="form-row">
					<div class="form-group">
						<label class="form-label">ID do Agente (Handle)</label>
						<input type="text" class="form-input" id="agentId" placeholder="ex: code-architect" />
					</div>
					<div class="form-group">
						<label class="form-label">Nome Exibido</label>
						<input type="text" class="form-input" id="agentName" placeholder="ex: Code Architect" />
					</div>
				</div>
				<div class="form-row">
					<div class="form-group">
						<label class="form-label">Título / Papel</label>
						<input type="text" class="form-input" id="agentTitle" placeholder="ex: Especialista em Engenharia" />
					</div>
					<div class="form-group">
						<label class="form-label">Categoria Estrutural</label>
						<select class="form-select" id="agentCategory">
							<option value="orchestrator">Orquestrador (Líder)</option>
							<option value="specialist">Especialista (Código / Execução)</option>
							<option value="critic">Crítico (Revisão / Segurança)</option>
							<option value="scholar">Erudito / Teólogo (Pesquisa)</option>
						</select>
					</div>
				</div>
			</div>

			<div class="section-card">
				<div class="section-header">
					<span class="section-title">Prompt de Sistema</span>
				</div>
				<div class="form-group">
					<label class="form-label">Instruções Nucleares e Contexto</label>
					<textarea class="form-textarea" id="agentSystemPrompt" placeholder="Defina aqui as diretrizes inegociáveis de comportamento do agente..."></textarea>
				</div>
			</div>

			<div class="section-card">
				<div class="section-header">
					<span class="section-title">Personalidade & Conduta</span>
				</div>
				<div class="form-row">
					<div class="form-group">
						<label class="form-label">Tom de Comunicação</label>
						<input type="text" class="form-input" id="agentTone" placeholder="ex: Confiante, cirúrgico, predatório" />
					</div>
					<div class="form-group">
						<label class="form-label">Lema / Catchphrase</label>
						<input type="text" class="form-input" id="agentCatchphrase" placeholder="ex: Zero overhead, máxima elegância." />
					</div>
				</div>
				<div class="form-group">
					<label class="form-label">Traços Comportamentais (separados por vírgula)</label>
					<input type="text" class="form-input" id="agentTraits" placeholder="ex: Precisão, Velocidade, Taste Apurado" />
				</div>
				<div class="form-group">
					<label class="form-label">Regras de Conduta (uma por linha)</label>
					<textarea class="form-textarea" style="min-height: 80px;" id="agentBehaviorRules" placeholder="Nunca usar any\nValidar tipagem antes de responder"></textarea>
				</div>
			</div>

			<div class="section-card">
				<div class="section-header">
					<span class="section-title">Funções & Ferramentas Autorizadas</span>
				</div>
				<div class="chips-container" id="toolsChips">
					<!-- Injected by JS -->
				</div>
			</div>

			<div class="section-card">
				<div class="section-header">
					<span class="section-title">Modelos & Estratégia de Fallback</span>
				</div>
				<div class="form-row">
					<div class="form-group">
						<label class="form-label">Modelo Primário</label>
						<input type="text" class="form-input" id="agentPrimaryModel" value="default" />
					</div>
					<div class="form-group">
						<label class="form-label">Nível de Thinking</label>
						<select class="form-select" id="agentThinkingLevel">
							<option value="off">Off</option>
							<option value="low">Low</option>
							<option value="medium">Medium</option>
							<option value="high" selected>High (Máximo)</option>
						</select>
					</div>
				</div>
				<div class="form-row">
					<div class="form-group">
						<label class="form-label">Modelos de Fallback (vírgula)</label>
						<input type="text" class="form-input" id="agentFallbacks" value="smol, slow" />
					</div>
					<div class="form-group">
						<label class="form-label">Estratégia de Failover</label>
						<select class="form-select" id="agentFallbackStrategy">
							<option value="fallback-model">Tentar Próximo Modelo</option>
							<option value="downgrade-effort">Reduzir Esforço de Raciocínio</option>
							<option value="next-provider">Alternar Provedor</option>
						</select>
					</div>
				</div>
			</div>
		</main>

		<!-- Right: Bible Strong Avatar Studio -->
		<aside class="avatar-studio">
			<div class="section-header">
				<span class="section-title">Bible Strong Avatar Studio</span>
			</div>
			<div class="preview-viewport" id="avatarViewport">
				<div id="avatarSvgContainer" style="width: 260px; height: 260px;"></div>
				<div class="preview-controls">
					<button class="preview-btn active" onclick="setPreviewExpr('neutral')">Neutral</button>
					<button class="preview-btn" onclick="setPreviewExpr('thinking')">Thinking</button>
					<button class="preview-btn" onclick="setPreviewExpr('talking')">Talking</button>
					<button class="preview-btn" onclick="setPreviewExpr('skeptical')">Skeptical</button>
					<button class="preview-btn" onclick="setPreviewExpr('alert')">Alert</button>
				</div>
			</div>

			<div class="form-group">
				<label class="form-label">Superfície Geométrica 3D</label>
				<select class="form-select" id="avatarSurfaceType" onchange="updateAvatarPreview()">
					<option value="sphere">Sphère (Esfera Fluida)</option>
					<option value="cube">Cube (Cubo Tecnológico)</option>
					<option value="diamond">Diamant (Diamante / Cristal)</option>
					<option value="capsule">Capsule (Cápsula Orgânica)</option>
					<option value="cylinder">Cylindre (Cilindro Robótico)</option>
					<option value="cone">Cône (Cone de Foco)</option>
					<option value="mickey">Mickey (Superfície Dupla)</option>
				</select>
			</div>

			<div class="form-row">
				<div class="form-group">
					<label class="form-label">Cor do Corpo</label>
					<input type="color" class="form-input" id="avatarBodyColor" value="#00F0FF" onchange="updateAvatarPreview()" />
				</div>
				<div class="form-group">
					<label class="form-label">Cor dos Olhos</label>
					<input type="color" class="form-input" id="avatarEyesColor" value="#0B0F19" onchange="updateAvatarPreview()" />
				</div>
			</div>

			<div class="form-row">
				<div class="form-group">
					<label class="form-label">Glow / Brilho Neon</label>
					<input type="color" class="form-input" id="avatarGlowColor" value="#00F0FF" onchange="updateAvatarPreview()" />
				</div>
				<div class="form-group">
					<label class="form-label">Accent / Destaque</label>
					<input type="color" class="form-input" id="avatarAccentColor" value="#8A2BE2" onchange="updateAvatarPreview()" />
				</div>
			</div>

			<div class="form-group">
				<label class="form-label">Largura dos Olhos: <span id="eyeWidthVal">22</span>px</label>
				<input type="range" min="10" max="60" value="22" id="eyeWidth" oninput="updateAvatarPreview()" />
			</div>

			<div class="form-group">
				<label class="form-label">Altura dos Olhos: <span id="eyeHeightVal">48</span>px</label>
				<input type="range" min="10" max="80" value="48" id="eyeHeight" oninput="updateAvatarPreview()" />
			</div>

			<div class="form-group">
				<label class="form-label">Espaçamento dos Olhos: <span id="eyeSpacingVal">42</span>px</label>
				<input type="range" min="20" max="80" value="42" id="eyeSpacing" oninput="updateAvatarPreview()" />
			</div>

			<button class="btn btn-danger" style="margin-top: 10px;" onclick="deleteCurrentAgent()">
				🗑️ Excluir Agente
			</button>
		</aside>
	</div>

	<!-- Modal AGENTS.md -->
	<div class="modal-backdrop" id="modalBackdrop">
		<div class="modal-card">
			<div class="modal-header">
				<h3 style="font-family: var(--font-title); font-size: 1.1rem; color: var(--neon-cyan);">AGENTS.md Gerado para o Projeto</h3>
				<button class="btn btn-secondary" onclick="closeAgentsMdModal()">Fechar</button>
			</div>
			<div class="modal-body">
				<textarea class="form-textarea" id="agentsMdContent" style="height: 100%; width: 100%;"></textarea>
			</div>
		</div>
	</div>

	<div class="toast" id="toast"></div>

	<script>
		let allAgents = [];
		let currentAgentId = null;
		let currentExpression = 'neutral';
		const AVAILABLE_TOOLS = ['read', 'write', 'edit', 'bash', 'grep', 'glob', 'lsp', 'ast_edit', 'web_search', 'task', 'hub', 'todo'];

		async function init() {
			renderToolsChips();
			await loadAgents();
			startBlinkLoop();
		}

		function showToast(msg) {
			const t = document.getElementById('toast');
			t.textContent = msg;
			t.style.display = 'block';
			setTimeout(() => { t.style.display = 'none'; }, 3000);
		}

		function renderToolsChips() {
			const container = document.getElementById('toolsChips');
			container.innerHTML = '';
			AVAILABLE_TOOLS.forEach(tool => {
				const chip = document.createElement('div');
				chip.className = 'chip';
				chip.id = 'chip-' + tool;
				chip.textContent = tool;
				chip.onclick = () => {
					chip.classList.toggle('selected');
				};
				container.appendChild(chip);
			});
		}

		async function loadAgents() {
			try {
				const res = await fetch('/api/agents');
				allAgents = await res.json();
				renderRoster();
				if (allAgents.length > 0) {
					selectAgent(allAgents[0].id);
				}
			} catch (err) {
				console.error(err);
			}
		}

		function renderRoster() {
			const list = document.getElementById('agentsList');
			list.innerHTML = '';
			allAgents.forEach(a => {
				const item = document.createElement('div');
				item.className = 'agent-item' + (a.id === currentAgentId ? ' active' : '');
				item.onclick = () => selectAgent(a.id);
				item.innerHTML = \`
					<div class="agent-thumb" style="border-color: \${a.avatar.colors.body}">
						<div style="width: 28px; height: 28px; border-radius: 50%; background: \${a.avatar.colors.body};"></div>
					</div>
					<div class="agent-meta">
						<div class="agent-name">\${a.name}</div>
						<div class="agent-role">\${a.title}</div>
					</div>
				\`;
				list.appendChild(item);
			});
		}

		function selectAgent(id) {
			currentAgentId = id;
			const a = allAgents.find(x => x.id === id);
			if (!a) return;

			document.getElementById('agentId').value = a.id;
			document.getElementById('agentName').value = a.name;
			document.getElementById('agentTitle').value = a.title;
			document.getElementById('agentCategory').value = a.structure.category;
			document.getElementById('agentSystemPrompt').value = a.systemPrompt;
			document.getElementById('agentTone').value = a.personality.tone;
			document.getElementById('agentCatchphrase').value = a.personality.catchphrase || '';
			document.getElementById('agentTraits').value = a.personality.traits.join(', ');
			document.getElementById('agentBehaviorRules').value = a.personality.behaviorRules.join('\\n');

			document.getElementById('agentPrimaryModel').value = a.models.primary.model;
			document.getElementById('agentThinkingLevel').value = a.models.primary.thinkingLevel || 'high';
			document.getElementById('agentFallbacks').value = a.fallbacks.models.join(', ');
			document.getElementById('agentFallbackStrategy').value = a.fallbacks.strategy;

			AVAILABLE_TOOLS.forEach(tool => {
				const el = document.getElementById('chip-' + tool);
				if (el) {
					if (a.functions.includes(tool)) el.classList.add('selected');
					else el.classList.remove('selected');
				}
			});

			document.getElementById('avatarSurfaceType').value = a.avatar.body.primary.type;
			document.getElementById('avatarBodyColor').value = a.avatar.colors.body;
			document.getElementById('avatarEyesColor').value = a.avatar.colors.eyes;
			document.getElementById('avatarGlowColor').value = a.avatar.colors.glow || a.avatar.colors.body;
			document.getElementById('avatarAccentColor').value = a.avatar.colors.accent || '#8A2BE2';

			const expr = a.avatar.expressions.neutral || {};
			const leftEye = expr.eyes ? expr.eyes.left : { width: 22, height: 48 };
			const spacing = expr.eyes ? expr.eyes.spacing : 42;

			document.getElementById('eyeWidth').value = leftEye.width;
			document.getElementById('eyeHeight').value = leftEye.height;
			document.getElementById('eyeSpacing').value = spacing;
			document.getElementById('eyeWidthVal').textContent = leftEye.width;
			document.getElementById('eyeHeightVal').textContent = leftEye.height;
			document.getElementById('eyeSpacingVal').textContent = spacing;

			renderRoster();
			updateAvatarPreview();
		}

		function updateAvatarPreview() {
			const bodyColor = document.getElementById('avatarBodyColor').value;
			const eyesColor = document.getElementById('avatarEyesColor').value;
			const glowColor = document.getElementById('avatarGlowColor').value;
			const surface = document.getElementById('avatarSurfaceType').value;
			const eyeW = parseInt(document.getElementById('eyeWidth').value);
			const eyeH = parseInt(document.getElementById('eyeHeight').value);
			const eyeSpacing = parseInt(document.getElementById('eyeSpacing').value);

			document.getElementById('eyeWidthVal').textContent = eyeW;
			document.getElementById('eyeHeightVal').textContent = eyeH;
			document.getElementById('eyeSpacingVal').textContent = eyeSpacing;

			// Construct SVG procedurally
			const container = document.getElementById('avatarSvgContainer');
			let rx = 100, ry = 100;
			if (surface === 'capsule') { rx = 85; ry = 115; }
			else if (surface === 'cube') { rx = 95; ry = 95; }
			else if (surface === 'diamond') { rx = 105; ry = 110; }

			const leftEyeX = -eyeSpacing / 2;
			const rightEyeX = eyeSpacing / 2;

			let eyeHeightMod = eyeH;
			let eyeAngle = 0;
			let headRot = 0;

			if (currentExpression === 'thinking') {
				headRot = -6;
				eyeAngle = 8;
			} else if (currentExpression === 'skeptical') {
				eyeHeightMod = eyeH * 0.7;
				eyeAngle = -10;
			} else if (currentExpression === 'alert') {
				eyeHeightMod = eyeH * 1.3;
			}

			container.innerHTML = \`
				<svg viewBox="-150 -150 300 300" width="100%" height="100%" style="transform: rotate(\${headRot}deg); transition: transform 0.3s ease;">
					<defs>
						<filter id="preview-glow" x="-40%" y="-40%" width="180%" height="180%">
							<feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="\${glowColor}" flood-opacity="0.55"/>
						</filter>
						<clipPath id="head-clip">
							<rect x="\${-rx}" y="\${-ry}" width="\${rx*2}" height="\${ry*2}" rx="\${surface==='cube'?20:surface==='diamond'?60:rx}" ry="\${surface==='cube'?20:surface==='diamond'?60:ry}" />
						</clipPath>
					</defs>
					<rect x="\${-rx}" y="\${-ry}" width="\${rx*2}" height="\${ry*2}" rx="\${surface==='cube'?20:surface==='diamond'?60:rx}" ry="\${surface==='cube'?20:surface==='diamond'?60:ry}" fill="\${bodyColor}" filter="url(#preview-glow)" />
					<g clip-path="url(#head-clip)">
						<ellipse cx="\${leftEyeX}" cy="-5" rx="\${eyeW/2}" ry="\${eyeHeightMod/2}" fill="\${eyesColor}" transform="rotate(\${eyeAngle} \${leftEyeX} -5)" />
						<ellipse cx="\${rightEyeX}" cy="-5" rx="\${eyeW/2}" ry="\${eyeHeightMod/2}" fill="\${eyesColor}" transform="rotate(\${-eyeAngle} \${rightEyeX} -5)" />
					</g>
				</svg>
			\`;
		}

		function setPreviewExpr(expr) {
			currentExpression = expr;
			document.querySelectorAll('.preview-btn').forEach(b => {
				b.classList.toggle('active', b.textContent.toLowerCase() === expr);
			});
			updateAvatarPreview();
		}

		function startBlinkLoop() {
			setInterval(() => {
				const container = document.getElementById('avatarSvgContainer');
				const ellipses = container.querySelectorAll('ellipse');
				ellipses.forEach(e => {
					e.style.transform = 'scaleY(0.1)';
					setTimeout(() => { e.style.transform = ''; }, 140);
				});
			}, 3800);
		}

		function createNewAgent() {
			const id = 'agent-' + Date.now().toString(36);
			const newA = {
				id,
				name: 'Novo Agente',
				title: 'Especialista',
				description: 'Novo agente criado via /agent-sandbox',
				systemPrompt: 'Você é um novo agente especializado...',
				personality: {
					tone: 'Objetivo e focado',
					traits: ['Rigor', 'Clareza'],
					style: 'Conciso',
					behaviorRules: ['Sempre responder com precisão']
				},
				functions: ['read', 'write', 'bash'],
				models: { primary: { model: 'default', thinkingLevel: 'high' } },
				fallbacks: { models: ['smol'], strategy: 'fallback-model' },
				structure: { role: 'Especialista', category: 'specialist' },
				avatar: {
					schema: 'bible-strong/avatar-definition',
					schemaVersion: 1,
					body: { primary: { type: 'sphere', width: 240, height: 240, depth: 240, roundness: 1 }, nodes: [] },
					colors: { body: '#00F0FF', eyes: '#0B0F19' },
					expressions: { neutral: { head: {x:0, y:0, z:0}, eyes: { left: {width: 22, height: 48, x:0, y:0, angle:0}, right: {width: 22, height: 48, x:0, y:0, angle:0}, spacing: 42 }, perspective: 1, motion: {eyes: 'microSaccades', body: 'slowDrift'} } },
					expressionOrder: ['neutral'],
					animations: { idle: { playbackMode: 'loop', steps: [{expression: 'neutral', holdMs: 2000, transitionMs: 500, transition: 'smooth'}], blink: {enabled: true, initialDelayMs: 2000, minIntervalMs: 2500, maxIntervalMs: 6000, durationMs: 180} } },
					animationOrder: ['idle']
				},
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			};
			allAgents.push(newA);
			selectAgent(id);
			showToast('Novo agente adicionado!');
		}

		async function saveCurrentAgent() {
			const id = document.getElementById('agentId').value.trim();
			if (!id) return alert('ID é obrigatório');

			const selectedTools = [];
			document.querySelectorAll('.chip.selected').forEach(c => {
				selectedTools.push(c.textContent);
			});

			const traits = document.getElementById('agentTraits').value.split(',').map(x => x.trim()).filter(Boolean);
			const rules = document.getElementById('agentBehaviorRules').value.split('\\n').map(x => x.trim()).filter(Boolean);
			const fallbacks = document.getElementById('agentFallbacks').value.split(',').map(x => x.trim()).filter(Boolean);

			const agent = {
				id,
				name: document.getElementById('agentName').value,
				title: document.getElementById('agentTitle').value,
				description: document.getElementById('agentName').value + ' - ' + document.getElementById('agentTitle').value,
				systemPrompt: document.getElementById('agentSystemPrompt').value,
				personality: {
					tone: document.getElementById('agentTone').value,
					traits,
					style: 'Direto e resolutivo',
					catchphrase: document.getElementById('agentCatchphrase').value,
					behaviorRules: rules
				},
				functions: selectedTools,
				models: {
					primary: {
						model: document.getElementById('agentPrimaryModel').value,
						thinkingLevel: document.getElementById('agentThinkingLevel').value
					}
				},
				fallbacks: {
					models: fallbacks,
					strategy: document.getElementById('agentFallbackStrategy').value
				},
				structure: {
					role: document.getElementById('agentTitle').value,
					category: document.getElementById('agentCategory').value
				},
				avatar: {
					schema: 'bible-strong/avatar-definition',
					schemaVersion: 1,
					body: {
						primary: {
							type: document.getElementById('avatarSurfaceType').value,
							width: 240, height: 240, depth: 240, roundness: 1
						},
						nodes: []
					},
					colors: {
						body: document.getElementById('avatarBodyColor').value,
						eyes: document.getElementById('avatarEyesColor').value,
						glow: document.getElementById('avatarGlowColor').value,
						accent: document.getElementById('avatarAccentColor').value
					},
					expressions: {
						neutral: {
							head: { x: 0, y: 0, z: 0 },
							eyes: {
								left: { width: parseInt(document.getElementById('eyeWidth').value), height: parseInt(document.getElementById('eyeHeight').value), x: 0, y: 0, angle: 0 },
								right: { width: parseInt(document.getElementById('eyeWidth').value), height: parseInt(document.getElementById('eyeHeight').value), x: 0, y: 0, angle: 0 },
								spacing: parseInt(document.getElementById('eyeSpacing').value)
							},
							perspective: 1,
							motion: { eyes: 'microSaccades', body: 'slowDrift' }
						}
					},
					expressionOrder: ['neutral'],
					animations: {
						idle: {
							playbackMode: 'loop',
							steps: [{ expression: 'neutral', holdMs: 2500, transitionMs: 500, transition: 'smooth' }],
							blink: { enabled: true, initialDelayMs: 2000, minIntervalMs: 2500, maxIntervalMs: 6000, durationMs: 180 }
						}
					},
					animationOrder: ['idle']
				},
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			};

			try {
				const res = await fetch('/api/agents', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(agent)
				});
				if (res.ok) {
					showToast('Agente salvo com sucesso!');
					await loadAgents();
					selectAgent(id);
				}
			} catch (err) {
				alert('Erro ao salvar agente');
			}
		}

		async function deleteCurrentAgent() {
			if (!confirm('Deseja excluir este agente?')) return;
			try {
				await fetch('/api/agents/' + currentAgentId, { method: 'DELETE' });
				showToast('Agente removido');
				await loadAgents();
			} catch (err) {
				alert('Erro ao excluir agente');
			}
		}

		async function generateAndSaveAgentsMd() {
			try {
				const res = await fetch('/api/generate-agents-md', { method: 'POST' });
				const data = await res.json();
				if (data.ok) {
					showToast('AGENTS.md gerado e salvo com sucesso na raiz do projeto!');
					openAgentsMdModal();
				}
			} catch (err) {
				alert('Erro ao gerar AGENTS.md');
			}
		}

		async function openAgentsMdModal() {
			try {
				const res = await fetch('/api/agents-md');
				const data = await res.json();
				document.getElementById('agentsMdContent').value = data.content || '';
				document.getElementById('modalBackdrop').style.display = 'flex';
			} catch (err) {
				console.error(err);
			}
		}

		function closeAgentsMdModal() {
			document.getElementById('modalBackdrop').style.display = 'none';
		}

		window.onload = init;
	</script>
</body>
</html>`;
}
