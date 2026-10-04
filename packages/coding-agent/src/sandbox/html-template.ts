export function renderSandboxHtml(): string {
	return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Oh My Shark · Cosmic Agent Studio & Bible Strong Avatars</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
	<style>
		/* ==========================================================================
		   DESIGN.md: COSMIC REFRACTION & GALACTIC CARTOGRAPHY SYSTEM
		   ========================================================================== */
		:root {
			--space-black: #030305;
			--space-deep: #07090E;
			--space-void: #0D0F18;
			--core-white: #FFFFFF;
			--neon-orange: #FF5500;
			--stellar-cyan: #00E5FF;
			--abyssal-violet: #5C24FF;
			--spectral-pink: #EC4899;
			--emerald-code: #10B981;
			--aged-gold: #D4AF37;
			--crimson-guard: #EF4444;

			--glass-bg: rgba(255, 255, 255, 0.035);
			--glass-bg-hover: rgba(255, 255, 255, 0.06);
			--glass-bg-active: rgba(0, 229, 255, 0.08);
			--glass-border: rgba(255, 255, 255, 0.12);
			--glass-border-focus: rgba(0, 229, 255, 0.5);
			--glass-blur: blur(40px) saturate(150%);
			--glass-inner-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.18), inset 0 0 20px rgba(255, 255, 255, 0.02);

			--font-display: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
			--font-body: 'Inter', sans-serif;
			--font-hud: 'JetBrains Mono', monospace;

			--radius-glass: 20px;
			--radius-card: 16px;
			--radius-btn: 10px;
			--radius-pill: 9999px;
		}

		* {
			box-sizing: border-box;
			margin: 0;
			padding: 0;
		}

		body {
			background: var(--space-black);
			color: #E2E8F0;
			font-family: var(--font-body);
			height: 100vh;
			display: flex;
			flex-direction: column;
			overflow: hidden;
			position: relative;
			user-select: none;
		}

		/* ==========================================================================
		   COSMIC BACKGROUND LAYERS (Layer 0, 1, 2, 3)
		   ========================================================================== */
		.cosmic-viewport {
			position: fixed;
			top: 0;
			left: 0;
			width: 100vw;
			height: 100vh;
			pointer-events: none;
			z-index: 0;
			overflow: hidden;
		}

		.cosmic-viewport svg {
			width: 100%;
			height: 100%;
			display: block;
		}

		/* ==========================================================================
		   HEADER & HUD TOP BAR
		   ========================================================================== */
		header.hud-header {
			position: relative;
			z-index: 50;
			height: 64px;
			background: rgba(3, 3, 5, 0.75);
			backdrop-filter: var(--glass-blur);
			border-bottom: 1px solid var(--glass-border);
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 0 24px;
			flex-shrink: 0;
		}

		.hud-brand {
			display: flex;
			align-items: center;
			gap: 14px;
		}

		.brand-gem {
			width: 36px;
			height: 36px;
			border-radius: 10px;
			background: linear-gradient(135deg, var(--stellar-cyan) 0%, var(--abyssal-violet) 100%);
			box-shadow: 0 0 20px rgba(0, 229, 255, 0.45);
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 18px;
		}

		.brand-info {
			display: flex;
			flex-direction: column;
		}

		.brand-title {
			font-family: var(--font-display);
			font-weight: 700;
			font-size: 1.05rem;
			letter-spacing: -0.02em;
			background: linear-gradient(90deg, #FFFFFF 0%, var(--stellar-cyan) 100%);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
		}

		.brand-hud {
			font-family: var(--font-hud);
			font-size: 0.65rem;
			color: #64748B;
			letter-spacing: 0.08em;
			text-transform: uppercase;
		}

		/* HUD Navigation Tabs (Studio vs Cosmic Chat) */
		.nav-tabs {
			display: flex;
			align-items: center;
			gap: 6px;
			background: rgba(255, 255, 255, 0.04);
			padding: 4px;
			border-radius: var(--radius-pill);
			border: 1px solid var(--glass-border);
		}

		.tab-btn {
			font-family: var(--font-body);
			font-size: 0.85rem;
			font-weight: 600;
			padding: 8px 18px;
			border-radius: var(--radius-pill);
			border: none;
			background: transparent;
			color: #94A3B8;
			cursor: pointer;
			display: inline-flex;
			align-items: center;
			gap: 8px;
			transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
		}

		.tab-btn:hover {
			color: #FFFFFF;
			background: rgba(255, 255, 255, 0.06);
		}

		.tab-btn.active {
			background: var(--stellar-cyan);
			color: #030305;
			box-shadow: 0 0 18px rgba(0, 229, 255, 0.4);
		}

		.hud-actions {
			display: flex;
			align-items: center;
			gap: 10px;
		}

		/* Generic Glass Buttons */
		.btn {
			font-family: var(--font-body);
			font-size: 0.82rem;
			font-weight: 600;
			padding: 8px 16px;
			border-radius: var(--radius-btn);
			border: 1px solid var(--glass-border);
			background: var(--glass-bg);
			color: #E2E8F0;
			cursor: pointer;
			display: inline-flex;
			align-items: center;
			gap: 8px;
			backdrop-filter: blur(16px);
			transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		}

		.btn:hover {
			background: var(--glass-bg-hover);
			border-color: rgba(255, 255, 255, 0.25);
			color: #FFFFFF;
			transform: translateY(-1px);
		}

		.btn-primary {
			background: var(--stellar-cyan);
			color: #030305;
			border: none;
			box-shadow: 0 0 16px rgba(0, 229, 255, 0.35);
		}

		.btn-primary:hover {
			background: #33ECFF;
			box-shadow: 0 0 24px rgba(0, 229, 255, 0.6);
			color: #000;
			transform: translateY(-2px);
		}

		.btn-gold {
			background: linear-gradient(135deg, var(--aged-gold), #B45309);
			color: #FFFFFF;
			border: none;
			box-shadow: 0 0 16px rgba(212, 175, 55, 0.3);
		}

		.btn-gold:hover {
			box-shadow: 0 0 24px rgba(212, 175, 55, 0.55);
			transform: translateY(-2px);
		}

		.btn-danger {
			background: rgba(239, 68, 68, 0.15);
			border-color: rgba(239, 68, 68, 0.35);
			color: #F87171;
		}

		.btn-danger:hover {
			background: var(--crimson-guard);
			color: #FFF;
		}

		/* ==========================================================================
		   MAIN APP CONTAINER
		   ========================================================================== */
		.app-container {
			position: relative;
			z-index: 10;
			flex: 1;
			display: flex;
			overflow: hidden;
		}

		.screen-view {
			width: 100%;
			height: 100%;
			display: none;
		}

		.screen-view.active {
			display: flex;
		}

		/* ==========================================================================
		   SCREEN 1: AGENT SANDBOX STUDIO
		   ========================================================================== */
		.studio-grid {
			width: 100%;
			height: 100%;
			display: grid;
			grid-template-columns: 280px 1fr 400px;
			overflow: hidden;
		}

		/* Left: Agents Roster */
		.roster-sidebar {
			background: rgba(7, 9, 14, 0.65);
			backdrop-filter: var(--glass-blur);
			border-right: 1px solid var(--glass-border);
			display: flex;
			flex-direction: column;
			overflow: hidden;
		}

		.roster-header {
			padding: 16px 20px;
			border-bottom: 1px solid var(--glass-border);
			display: flex;
			align-items: center;
			justify-content: space-between;
		}

		.roster-title {
			font-family: var(--font-hud);
			font-size: 0.72rem;
			color: #94A3B8;
			letter-spacing: 0.1em;
		}

		.roster-list {
			flex: 1;
			overflow-y: auto;
			padding: 12px;
			display: flex;
			flex-direction: column;
			gap: 8px;
		}

		.roster-item {
			padding: 10px 12px;
			background: var(--glass-bg);
			border: 1px solid transparent;
			border-radius: var(--radius-card);
			cursor: pointer;
			display: flex;
			align-items: center;
			gap: 12px;
			transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		}

		.roster-item:hover {
			background: var(--glass-bg-hover);
			border-color: rgba(255, 255, 255, 0.15);
			transform: translateX(3px);
		}

		.roster-item.active {
			background: var(--glass-bg-active);
			border-color: var(--stellar-cyan);
			box-shadow: 0 0 16px rgba(0, 229, 255, 0.2);
		}

		.roster-thumb {
			width: 42px;
			height: 42px;
			border-radius: 12px;
			background: #030305;
			border: 1px solid var(--glass-border);
			display: flex;
			align-items: center;
			justify-content: center;
			overflow: hidden;
			flex-shrink: 0;
			position: relative;
		}

		.roster-meta {
			flex: 1;
			min-width: 0;
		}

		.roster-name {
			font-weight: 600;
			font-size: 0.88rem;
			color: #F8FAFC;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.roster-role {
			font-family: var(--font-hud);
			font-size: 0.7rem;
			color: #64748B;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		/* Center: Workspace (Natural Language + Clear Sections) */
		.studio-workspace {
			overflow-y: auto;
			padding: 28px 36px;
			display: flex;
			flex-direction: column;
			gap: 24px;
		}

		/* Hero: Natural Language Agent Synthesis */
		.hero-card {
			background: linear-gradient(135deg, rgba(0, 229, 255, 0.08) 0%, rgba(92, 36, 255, 0.05) 100%);
			border: 1px solid rgba(0, 229, 255, 0.25);
			border-radius: var(--radius-glass);
			box-shadow: var(--glass-inner-shadow), 0 20px 40px rgba(0, 0, 0, 0.5);
			padding: 24px;
			display: flex;
			flex-direction: column;
			gap: 16px;
			position: relative;
			overflow: hidden;
		}

		.hero-card::after {
			content: '';
			position: absolute;
			top: -40px;
			right: -40px;
			width: 140px;
			height: 140px;
			background: radial-gradient(circle, rgba(0, 229, 255, 0.25) 0%, transparent 70%);
			pointer-events: none;
		}

		.hero-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
		}

		.hero-title {
			font-family: var(--font-display);
			font-weight: 700;
			font-size: 1.15rem;
			color: #FFFFFF;
			display: flex;
			align-items: center;
			gap: 10px;
		}

		.hero-badge {
			font-family: var(--font-hud);
			font-size: 0.68rem;
			background: rgba(0, 229, 255, 0.15);
			color: var(--stellar-cyan);
			padding: 2px 8px;
			border-radius: var(--radius-pill);
			border: 1px solid rgba(0, 229, 255, 0.3);
		}

		.hero-textarea {
			width: 100%;
			min-height: 85px;
			background: rgba(3, 3, 5, 0.7);
			border: 1px solid var(--glass-border);
			border-radius: var(--radius-card);
			color: #F8FAFC;
			font-family: var(--font-body);
			font-size: 0.92rem;
			line-height: 1.6;
			padding: 14px 18px;
			resize: vertical;
			outline: none;
			transition: all 0.2s ease;
		}

		.hero-textarea:focus {
			border-color: var(--stellar-cyan);
			box-shadow: 0 0 16px rgba(0, 229, 255, 0.25);
		}

		.hero-chips {
			display: flex;
			flex-wrap: wrap;
			gap: 8px;
			align-items: center;
		}

		.hero-chip-hint {
			font-family: var(--font-hud);
			font-size: 0.68rem;
			color: #64748B;
			margin-right: 4px;
		}

		.prompt-chip {
			background: rgba(255, 255, 255, 0.04);
			border: 1px solid var(--glass-border);
			padding: 4px 10px;
			border-radius: var(--radius-pill);
			font-size: 0.75rem;
			color: #94A3B8;
			cursor: pointer;
			transition: all 0.2s ease;
		}

		.prompt-chip:hover {
			border-color: var(--stellar-cyan);
			color: #FFFFFF;
			background: rgba(0, 229, 255, 0.1);
		}

		.hero-actions {
			display: flex;
			justify-content: flex-end;
		}

		/* Structured Section Cards */
		.section-glass {
			background: var(--glass-bg);
			border: 1px solid var(--glass-border);
			border-radius: var(--radius-glass);
			box-shadow: var(--glass-inner-shadow);
			backdrop-filter: var(--glass-blur);
			padding: 22px;
			display: flex;
			flex-direction: column;
			gap: 16px;
		}

		.section-title-bar {
			display: flex;
			align-items: center;
			justify-content: space-between;
			border-bottom: 1px solid rgba(255, 255, 255, 0.06);
			padding-bottom: 12px;
		}

		.section-title {
			font-family: var(--font-display);
			font-weight: 700;
			font-size: 0.98rem;
			color: #F1F5F9;
			display: flex;
			align-items: center;
			gap: 8px;
		}

		.section-step-num {
			width: 22px;
			height: 22px;
			border-radius: 50%;
			background: rgba(0, 229, 255, 0.15);
			color: var(--stellar-cyan);
			font-family: var(--font-hud);
			font-size: 0.72rem;
			display: flex;
			align-items: center;
			justify-content: center;
			border: 1px solid rgba(0, 229, 255, 0.3);
		}

		.form-grid-2 {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 16px;
		}

		.form-field {
			display: flex;
			flex-direction: column;
			gap: 6px;
		}

		.field-label {
			font-family: var(--font-hud);
			font-size: 0.72rem;
			color: #94A3B8;
			letter-spacing: 0.05em;
			text-transform: uppercase;
		}

		.field-input, .field-select, .field-textarea {
			background: rgba(3, 3, 5, 0.6);
			border: 1px solid var(--glass-border);
			border-radius: var(--radius-btn);
			color: #F8FAFC;
			font-family: var(--font-body);
			font-size: 0.88rem;
			padding: 10px 14px;
			outline: none;
			transition: all 0.2s ease;
		}

		.field-textarea {
			min-height: 90px;
			resize: vertical;
			line-height: 1.5;
			font-family: var(--font-hud);
			font-size: 0.82rem;
		}

		.field-input:focus, .field-select:focus, .field-textarea:focus {
			border-color: var(--stellar-cyan);
			box-shadow: 0 0 14px rgba(0, 229, 255, 0.2);
		}

		/* Tools Chips */
		.tools-flex {
			display: flex;
			flex-wrap: wrap;
			gap: 8px;
		}

		.tool-chip {
			font-family: var(--font-hud);
			font-size: 0.75rem;
			padding: 6px 12px;
			border-radius: var(--radius-btn);
			background: rgba(255, 255, 255, 0.03);
			border: 1px solid var(--glass-border);
			color: #94A3B8;
			cursor: pointer;
			display: flex;
			align-items: center;
			gap: 6px;
			transition: all 0.15s ease;
		}

		.tool-chip:hover {
			border-color: rgba(255, 255, 255, 0.25);
			color: #FFF;
		}

		.tool-chip.selected {
			background: rgba(0, 229, 255, 0.12);
			border-color: var(--stellar-cyan);
			color: var(--stellar-cyan);
			font-weight: 600;
			box-shadow: 0 0 10px rgba(0, 229, 255, 0.15);
		}

		/* Right Panel: Bible Strong Avatar Studio 100% Full Body */
		.avatar-showcase {
			background: rgba(7, 9, 14, 0.65);
			backdrop-filter: var(--glass-blur);
			border-left: 1px solid var(--glass-border);
			display: flex;
			flex-direction: column;
			overflow-y: auto;
			padding: 24px;
			gap: 20px;
		}

		.showcase-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			border-bottom: 1px solid rgba(255, 255, 255, 0.08);
			padding-bottom: 12px;
		}

		.showcase-title {
			font-family: var(--font-display);
			font-weight: 700;
			font-size: 1rem;
			color: #FFFFFF;
			display: flex;
			align-items: center;
			gap: 8px;
		}

		/* Full Body Viewport */
		.full-body-viewport {
			background: radial-gradient(circle at center 40%, rgba(15, 23, 42, 0.8) 0%, rgba(3, 3, 5, 0.95) 100%);
			border: 1px solid var(--glass-border);
			border-radius: var(--radius-glass);
			box-shadow: var(--glass-inner-shadow), 0 20px 40px rgba(0, 0, 0, 0.6);
			height: 480px;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			position: relative;
			overflow: hidden;
		}

		.svg-canvas-wrapper {
			width: 100%;
			height: 100%;
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.svg-canvas-wrapper svg {
			width: 100%;
			height: 100%;
			max-height: 460px;
			object-fit: contain;
		}

		/* Live Telemetry Pill */
		.telemetry-pill {
			position: absolute;
			bottom: 14px;
			left: 14px;
			right: 14px;
			background: rgba(3, 3, 5, 0.85);
			backdrop-filter: blur(16px);
			border: 1px solid var(--glass-border);
			border-radius: var(--radius-card);
			padding: 8px 12px;
			display: flex;
			flex-direction: column;
			gap: 3px;
		}

		.telemetry-status {
			display: flex;
			align-items: center;
			justify-content: space-between;
			font-family: var(--font-hud);
			font-size: 0.68rem;
		}

		.status-dot {
			width: 6px;
			height: 6px;
			border-radius: 50%;
			background: var(--emerald-code);
			box-shadow: 0 0 8px var(--emerald-code);
			display: inline-block;
			margin-right: 6px;
		}

		.telemetry-mood {
			font-size: 0.74rem;
			color: #CBD5E1;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		/* Avatar Palette & Controls */
		.avatar-settings {
			display: flex;
			flex-direction: column;
			gap: 14px;
		}

		.color-swatches {
			display: grid;
			grid-template-columns: repeat(4, 1fr);
			gap: 10px;
		}

		.swatch-group {
			display: flex;
			flex-direction: column;
			gap: 4px;
		}

		.swatch-label {
			font-family: var(--font-hud);
			font-size: 0.65rem;
			color: #64748B;
			text-transform: uppercase;
		}

		.color-picker {
			width: 100%;
			height: 36px;
			border-radius: var(--radius-btn);
			border: 1px solid var(--glass-border);
			background: transparent;
			cursor: pointer;
			padding: 2px;
		}

		/* ==========================================================================
		   SCREEN 2: COSMIC WEB CHAT WITH DYNAMIC AVATARS
		   ========================================================================== */
		.chat-grid {
			width: 100%;
			height: 100%;
			display: grid;
			grid-template-columns: 280px 1fr 380px;
			overflow: hidden;
		}

		.chat-sidebar {
			background: rgba(7, 9, 14, 0.65);
			backdrop-filter: var(--glass-blur);
			border-right: 1px solid var(--glass-border);
			display: flex;
			flex-direction: column;
			overflow: hidden;
		}

		.chat-roster-item {
			padding: 12px 14px;
			background: var(--glass-bg);
			border: 1px solid transparent;
			border-radius: var(--radius-card);
			cursor: pointer;
			display: flex;
			align-items: center;
			gap: 12px;
			transition: all 0.2s ease;
		}

		.chat-roster-item:hover {
			background: var(--glass-bg-hover);
			border-color: rgba(255, 255, 255, 0.15);
		}

		.chat-roster-item.active {
			background: var(--glass-bg-active);
			border-color: var(--stellar-cyan);
			box-shadow: 0 0 14px rgba(0, 229, 255, 0.2);
		}

		.chat-center {
			display: flex;
			flex-direction: column;
			height: 100%;
			overflow: hidden;
			position: relative;
		}

		.chat-messages {
			flex: 1;
			overflow-y: auto;
			padding: 24px 32px;
			display: flex;
			flex-direction: column;
			gap: 18px;
		}

		.chat-bubble {
			max-width: 80%;
			padding: 16px 20px;
			border-radius: var(--radius-card);
			line-height: 1.6;
			font-size: 0.92rem;
			position: relative;
			animation: messageSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
		}

		@keyframes messageSlideIn {
			from { opacity: 0; transform: translateY(12px); }
			to { opacity: 1; transform: translateY(0); }
		}

		.chat-bubble.user {
			align-self: flex-end;
			background: linear-gradient(135deg, rgba(0, 229, 255, 0.2) 0%, rgba(92, 36, 255, 0.2) 100%);
			border: 1px solid rgba(0, 229, 255, 0.35);
			color: #FFFFFF;
			border-bottom-right-radius: 4px;
		}

		.chat-bubble.agent {
			align-self: flex-start;
			background: var(--glass-bg);
			backdrop-filter: var(--glass-blur);
			border: 1px solid var(--glass-border);
			box-shadow: var(--glass-inner-shadow);
			color: #E2E8F0;
			border-bottom-left-radius: 4px;
		}

		.chat-meta {
			font-family: var(--font-hud);
			font-size: 0.68rem;
			color: #64748B;
			margin-top: 8px;
			display: flex;
			gap: 12px;
			align-items: center;
		}

		.chat-composer {
			padding: 20px 32px;
			background: rgba(3, 3, 5, 0.8);
			backdrop-filter: var(--glass-blur);
			border-top: 1px solid var(--glass-border);
			display: flex;
			gap: 12px;
			align-items: center;
		}

		.chat-input {
			flex: 1;
			background: rgba(255, 255, 255, 0.04);
			border: 1px solid var(--glass-border);
			border-radius: var(--radius-btn);
			color: #F8FAFC;
			font-family: var(--font-body);
			font-size: 0.92rem;
			padding: 12px 18px;
			outline: none;
			transition: all 0.2s ease;
		}

		.chat-input:focus {
			border-color: var(--stellar-cyan);
			box-shadow: 0 0 16px rgba(0, 229, 255, 0.25);
		}

		.chat-avatar-panel {
			background: rgba(7, 9, 14, 0.65);
			backdrop-filter: var(--glass-blur);
			border-left: 1px solid var(--glass-border);
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			padding: 24px;
			overflow: hidden;
		}

		/* Modal AGENTS.md */
		.modal-backdrop {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: rgba(3, 3, 5, 0.85);
			backdrop-filter: blur(12px);
			display: none;
			align-items: center;
			justify-content: center;
			z-index: 100;
		}

		.modal-card {
			background: rgba(13, 15, 24, 0.95);
			border: 1px solid var(--glass-border);
			box-shadow: 0 0 50px rgba(0, 0, 0, 0.8);
			border-radius: var(--radius-glass);
			width: 840px;
			max-width: 92vw;
			height: 82vh;
			display: flex;
			flex-direction: column;
			overflow: hidden;
		}

		.modal-header {
			padding: 18px 24px;
			border-bottom: 1px solid var(--glass-border);
			display: flex;
			justify-content: space-between;
			align-items: center;
		}

		.modal-body {
			flex: 1;
			padding: 20px 24px;
			overflow-y: auto;
		}

		/* Toast */
		.hud-toast {
			position: fixed;
			bottom: 24px;
			right: 24px;
			background: rgba(13, 15, 24, 0.92);
			border: 1px solid var(--stellar-cyan);
			box-shadow: 0 0 24px rgba(0, 229, 255, 0.35);
			padding: 12px 20px;
			border-radius: var(--radius-btn);
			font-family: var(--font-body);
			font-size: 0.88rem;
			font-weight: 600;
			color: #F8FAFC;
			display: none;
			z-index: 200;
			animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
		}

		@keyframes slideUp {
			from { transform: translateY(20px); opacity: 0; }
			to { transform: translateY(0); opacity: 1; }
		}

		/* Responsive Adaptation */
		@media (max-width: 1200px) {
			.studio-grid {
				grid-template-columns: 240px 1fr 340px;
			}
			.chat-grid {
				grid-template-columns: 240px 1fr 320px;
			}
		}
		@media (max-width: 900px) {
			.studio-grid, .chat-grid {
				grid-template-columns: 1fr;
				overflow-y: auto;
			}
			.roster-sidebar, .avatar-showcase, .chat-avatar-panel {
				display: none;
			}
		}
	</style>
</head>
<body>
	<!-- ==========================================================================
	     COSMIC REFRACTION & GALACTIC CARTOGRAPHY SVG VIEWPORT (DESIGN.md)
	     ========================================================================== -->
	<div class="cosmic-viewport" aria-hidden="true">
		<svg viewBox="-1000 -500 2000 1000" xmlns="http://www.w3.org/2000/svg">
			<defs>
				<!-- Galactic Core Fire Gradient -->
				<radialGradient id="cosmic-core" cx="50%" cy="50%" r="50%">
					<stop offset="0%" stop-color="#FFFFFF" stop-opacity="1" />
					<stop offset="20%" stop-color="#FFF0B3" stop-opacity="0.8" />
					<stop offset="50%" stop-color="#FF5500" stop-opacity="0.35" />
					<stop offset="100%" stop-color="#030305" stop-opacity="0" />
				</radialGradient>

				<!-- Orbit Line Gradient Fade -->
				<linearGradient id="orbit-stream" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stop-color="#00E5FF" stop-opacity="0.0" />
					<stop offset="50%" stop-color="#00E5FF" stop-opacity="0.35" />
					<stop offset="100%" stop-color="#5C24FF" stop-opacity="0.0" />
				</linearGradient>

				<!-- Spectrum Prism Rays Gradient -->
				<linearGradient id="prism-beam" x1="0%" y1="100%" x2="100%" y2="0%">
					<stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.8" />
					<stop offset="40%" stop-color="#00E5FF" stop-opacity="0.4" />
					<stop offset="100%" stop-color="#030305" stop-opacity="0.0" />
				</linearGradient>

				<!-- Noise Filter for Atmosphere -->
				<filter id="cosmic-noise" x="-20%" y="-20%" width="140%" height="140%">
					<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" result="noise" />
					<feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0.08 0" in="noise" result="coloredNoise" />
					<feComposite operator="in" in="coloredNoise" in2="SourceGraphic" />
				</filter>
			</defs>

			<!-- Void Background -->
			<rect x="-1000" y="-500" width="2000" height="1000" fill="#030305" />

			<!-- Layer 1: Spectrum Light Beams (Fast Design Prism Refraction) -->
			<g transform="translate(-400, 200) rotate(-35)" style="mix-blend-mode: plus-lighter; opacity: 0.25;">
				<polygon points="0,0 800,-300 1000,-260 0,40" fill="#FF0040" />
				<polygon points="0,40 1000,-260 1000,-180 0,80" fill="#FF8C00" />
				<polygon points="0,80 1000,-180 1000,-100 0,120" fill="#FFEA00" />
				<polygon points="0,120 1000,-100 1000,-20 0,160" fill="#00FF44" />
				<polygon points="0,160 1000,-20 1000,60 0,200" fill="#00E5FF" />
				<polygon points="0,200 1000,60 1000,140 0,240" fill="#5C24FF" />
			</g>

			<!-- Layer 2: Concentric Elliptical 3D Orbits & Stellar Cartography -->
			<g transform="rotate(-6) scale(1, 0.36)">
				<circle cx="0" cy="0" r="320" fill="none" stroke="url(#orbit-stream)" stroke-width="1.5" />
				<circle cx="0" cy="0" r="540" fill="none" stroke="url(#orbit-stream)" stroke-width="1" stroke-dasharray="8 6" />
				<circle cx="0" cy="0" r="820" fill="none" stroke="url(#orbit-stream)" stroke-width="0.75" />

				<!-- Sector Grid Lines -->
				<line x1="0" y1="0" x2="850" y2="-320" stroke="#FFFFFF" stroke-width="0.5" stroke-opacity="0.15" stroke-dasharray="4,4" />
				<line x1="0" y1="0" x2="-800" y2="-360" stroke="#FFFFFF" stroke-width="0.5" stroke-opacity="0.15" stroke-dasharray="4,4" />
				<line x1="0" y1="0" x2="200" y2="780" stroke="#FFFFFF" stroke-width="0.5" stroke-opacity="0.15" stroke-dasharray="4,4" />

				<!-- Stellar Nodes -->
				<circle cx="340" cy="120" r="5" fill="#00E5FF" />
				<circle cx="-420" cy="-180" r="4" fill="#D4AF37" />
				<circle cx="580" cy="-280" r="4" fill="#FF5500" />
				<circle cx="-250" cy="400" r="3" fill="#10B981" />
			</g>

			<!-- Galactic Core -->
			<circle cx="0" cy="0" r="220" fill="url(#cosmic-core)" style="mix-blend-mode: screen;" />

			<!-- Data Labels -->
			<text x="360" y="40" fill="#00E5FF" font-family="JetBrains Mono" font-size="11" letter-spacing="1">SECTOR // SHARK-PRIME</text>
			<text x="-480" y="-80" fill="#D4AF37" font-family="JetBrains Mono" font-size="11" letter-spacing="1">LOGOS // SCHOLAR-GRID</text>
		</svg>
	</div>

	<!-- ==========================================================================
	     HUD TOP BAR
	     ========================================================================== -->
	<header class="hud-header">
		<div class="hud-brand">
			<div class="brand-gem">🦈</div>
			<div class="brand-info">
				<div class="brand-title">Oh My Shark</div>
				<div class="brand-hud">Agent Sandbox · Bible Strong Avatar Studio</div>
			</div>
		</div>

		<!-- Nav Switcher: Studio vs Chat -->
		<div class="nav-tabs" role="tablist">
			<button class="tab-btn active" id="btnTabStudio" onclick="switchView('studio')">
				🌌 Studio de Agentes
			</button>
			<button class="tab-btn" id="btnTabChat" onclick="switchView('chat')">
				💬 Cosmic Chat
			</button>
		</div>

		<div class="hud-actions">
			<button class="btn btn-gold" onclick="generateAndSaveAgentsMd()">
				📄 Gerar AGENTS.md
			</button>
			<button class="btn btn-primary" onclick="createNewAgent()">
				+ Novo Agente
			</button>
		</div>
	</header>

	<!-- ==========================================================================
	     APPLICATION CONTAINER
	     ========================================================================== -->
	<div class="app-container">
		<!-- ======================================================================
		     SCREEN 1: AGENT SANDBOX STUDIO
		     ====================================================================== -->
		<section class="screen-view active" id="viewStudio">
			<div class="studio-grid">
				<!-- Left: Agents Roster -->
				<aside class="roster-sidebar">
					<div class="roster-header">
						<span class="roster-title">ROSTER DE AGENTES</span>
						<span class="hero-badge" id="rosterCount">0 AGENTES</span>
					</div>
					<div class="roster-list" id="agentsList">
						<!-- Injected by JS -->
					</div>
				</aside>

				<!-- Center: Workspace -->
				<main class="studio-workspace">
					<!-- Hero: Natural Language Creation -->
					<div class="hero-card">
						<div class="hero-header">
							<div class="hero-title">
								✨ Criar ou Evoluir com Linguagem Natural
							</div>
							<span class="hero-badge">IA INTERPRETATIVA NATIVA</span>
						</div>
						<p style="font-size: 0.85rem; color: #94A3B8; line-height: 1.5;">
							Descreva seu agente em suas próprias palavras. O sistema interpretará personalidade, postura corporal, roupas, acessórios, ferramentas e criará a identidade visual completa e nativa do avatar.
						</p>
						<textarea class="hero-textarea" id="naturalLanguageInput" placeholder="Ex: Um professor paciente de computação quântica, postura serena, estilo acadêmico futurista com túnica azul estelar e óculos analíticos..."></textarea>
						
						<div class="hero-chips">
							<span class="hero-chip-hint">Sugestões rápidas:</span>
							<span class="prompt-chip" onclick="applyPresetPrompt('Engenheiro de Sistemas Críticos, extremamente técnico e focado, zero-overhead, terno escuro com detalhes esmeralda')">Engenheiro de Sistemas</span>
							<span class="prompt-chip" onclick="applyPresetPrompt('Professor erudito paciente, especializado em originais grego e hebraico, túnica nobre dourada e postura reflexiva')">Professor Scholar</span>
							<span class="prompt-chip" onclick="applyPresetPrompt('Auditor de segurança cibernética vigilante e cético, armadura tática vermelha com insígnia de defesa')">Auditor Sentinel</span>
							<span class="prompt-chip" onclick="applyPresetPrompt('Orquestrador estratégico confiante e predatório, flutuando no vácuo com visor holográfico ciano')">Orquestrador Shark</span>
						</div>

						<div class="hero-actions">
							<button class="btn btn-primary" id="btnInterpret" onclick="interpretFromNaturalLanguage()">
								✨ Interpretar & Gerar com IA
							</button>
						</div>
					</div>

					<!-- Section 1: Essencial -->
					<div class="section-glass">
						<div class="section-title-bar">
							<div class="section-title">
								<span class="section-step-num">1</span>
								Essencial · Quem é o Agente?
							</div>
						</div>
						<div class="form-grid-2">
							<div class="form-field">
								<label class="field-label">Nome do Agente</label>
								<input type="text" class="field-input" id="agentName" oninput="onFieldChange()" placeholder="Ex: Code Architect" />
							</div>
							<div class="form-field">
								<label class="field-label">Título / Especialidade</label>
								<input type="text" class="field-input" id="agentTitle" oninput="onFieldChange()" placeholder="Ex: Engenheiro de Implementação" />
							</div>
						</div>
						<div class="form-grid-2">
							<div class="form-field">
								<label class="field-label">ID Único (Slug)</label>
								<input type="text" class="field-input" id="agentId" placeholder="code-architect" />
							</div>
							<div class="form-field">
								<label class="field-label">Categoria Estrutural</label>
								<select class="field-select" id="agentCategory" onchange="onFieldChange()">
									<option value="specialist">Especialista (Specialist)</option>
									<option value="orchestrator">Orquestrador (Orchestrator)</option>
									<option value="critic">Auditor / Crítico (Critic)</option>
									<option value="scholar">Pesquisador / Teólogo (Scholar)</option>
									<option value="reviewer">Revisor de Código (Reviewer)</option>
									<option value="executor">Executor Rápido (Executor)</option>
								</select>
							</div>
						</div>
						<div class="form-field">
							<label class="field-label">Prompt de Identidade Primária (System Prompt)</label>
							<textarea class="field-textarea" id="agentSystemPrompt" placeholder="Você é o Code Architect. Você escreve código limpo, sem alocações inúteis..."></textarea>
						</div>
					</div>

					<!-- Section 2: Personalidade & Identidade -->
					<div class="section-glass">
						<div class="section-title-bar">
							<div class="section-title">
								<span class="section-step-num">2</span>
								Personalidade & Como ele age?
							</div>
						</div>
						<div class="form-grid-2">
							<div class="form-field">
								<label class="field-label">Tom de Comunicação</label>
								<input type="text" class="field-input" id="agentTone" oninput="onFieldChange()" placeholder="Técnico, rigoroso e refinado" />
							</div>
							<div class="form-field">
								<label class="field-label">Lema / Catchphrase</label>
								<input type="text" class="field-input" id="agentCatchphrase" placeholder="Zero overhead, máxima elegância." />
							</div>
						</div>
						<div class="form-field">
							<label class="field-label">Traços Marcantes (separados por vírgula)</label>
							<input type="text" class="field-input" id="agentTraits" oninput="onFieldChange()" placeholder="Precisão, Taste apurado, Sem abstrações inúteis" />
						</div>
						<div class="form-field">
							<label class="field-label">Regras de Conduta e Comportamento (uma por linha)</label>
							<textarea class="field-textarea" id="agentBehaviorRules" placeholder="Nunca usar any\nBun APIs nativas como primeira escolha"></textarea>
						</div>
					</div>

					<!-- Section 3: Engenharia Avançada -->
					<div class="section-glass">
						<div class="section-title-bar">
							<div class="section-title">
								<span class="section-step-num">3</span>
								Engenharia Avançada & Ferramentas
							</div>
						</div>
						<div class="form-field">
							<label class="field-label">Ferramentas & Funções Autorizadas</label>
							<div class="tools-flex" id="toolsContainer">
								<!-- Injected by JS -->
							</div>
						</div>
						<div class="form-grid-2">
							<div class="form-field">
								<label class="field-label">Modelo Primário</label>
								<input type="text" class="field-input" id="agentPrimaryModel" value="default" />
							</div>
							<div class="form-field">
								<label class="field-label">Nível de Thinking</label>
								<select class="field-select" id="agentThinkingLevel">
									<option value="off">Off (Desativado)</option>
									<option value="low">Low (Rápido)</option>
									<option value="medium">Medium (Equilibrado)</option>
									<option value="high" selected>High (Máxima Profundidade)</option>
								</select>
							</div>
						</div>
						<div class="form-grid-2">
							<div class="form-field">
								<label class="field-label">Modelos de Fallback (vírgula)</label>
								<input type="text" class="field-input" id="agentFallbacks" value="smol, slow" />
							</div>
							<div class="form-field">
								<label class="field-label">Estratégia de Falha</label>
								<select class="field-select" id="agentFallbackStrategy">
									<option value="fallback-model">Tentar Próximo Modelo</option>
									<option value="downgrade-effort">Reduzir Esforço de Raciocínio</option>
									<option value="next-provider">Alternar Provedor</option>
								</select>
							</div>
						</div>
					</div>

					<div style="display: flex; gap: 12px; justify-content: flex-end; padding-bottom: 24px;">
						<button class="btn btn-danger" onclick="deleteCurrentAgent()">🗑️ Excluir Agente</button>
						<button class="btn btn-primary" onclick="saveCurrentAgent()">💾 Salvar Alterações</button>
					</div>
				</main>

				<!-- Right: Bible Strong Avatar Studio 100% Full Body -->
				<aside class="avatar-showcase">
					<div class="showcase-header">
						<div class="showcase-title">
							<span>👤 Bible Strong Avatar</span>
						</div>
						<span class="hero-badge" id="avatarSurfaceBadge">CUBE</span>
					</div>

					<!-- 100% Full Body Live Viewport -->
					<div class="full-body-viewport" id="avatarViewport">
						<div class="svg-canvas-wrapper" id="avatarSvgContainer">
							<!-- Procedural Full Body SVG rendered by JS -->
						</div>
						
						<!-- Live Telemetry Pill -->
						<div class="telemetry-pill">
							<div class="telemetry-status">
								<span><span class="status-dot"></span>PREVIEW VIVO INTEGRAL</span>
								<span id="telemetryStyleLabel" style="color: var(--stellar-cyan);">MINIMALIST SUIT</span>
							</div>
							<div class="telemetry-mood" id="telemetryMoodLabel">
								Interpretado: Foco Técnico & Rigor
							</div>
						</div>
					</div>

					<!-- Visual Style & Identity Controls -->
					<div class="avatar-settings">
						<div class="form-field">
							<label class="field-label">Superfície Geométrica 3D</label>
							<select class="field-select" id="avatarSurfaceType" onchange="onVisualChange()">
								<option value="sphere">Sphère (Esfera Fluida)</option>
								<option value="cube">Cube (Cubo Tecnológico)</option>
								<option value="capsule">Capsule (Cápsula Orgânica / Scholar)</option>
								<option value="cylinder">Cylindre (Cilindro Robótico / Tático)</option>
								<option value="diamond">Diamant (Diamante / Cristal)</option>
								<option value="cone">Cône (Cone de Foco)</option>
								<option value="mickey">Mickey (Superfície Dupla)</option>
							</select>
						</div>

						<div class="form-grid-2">
							<div class="form-field">
								<label class="field-label">Estilo Visual</label>
								<select class="field-select" id="avatarStyle" onchange="onVisualChange()">
									<option value="futuristic">Futurista Cósmico</option>
									<option value="minimalist">Minimalista</option>
									<option value="scholar">Scholar / Teológico</option>
									<option value="tactical">Tático / Segurança</option>
									<option value="scientific">Científico</option>
									<option value="corporate">Corporativo</option>
									<option value="cyber">Cyber / Rede</option>
									<option value="casual">Casual</option>
								</select>
							</div>
							<div class="form-field">
								<label class="field-label">Vestimenta</label>
								<select class="field-select" id="avatarClothing" onchange="onVisualChange()">
									<option value="suit">Terno Tecnológico</option>
									<option value="armor">Armadura Cósmica</option>
									<option value="robe">Robe / Manto Nobre</option>
									<option value="lab_coat">Jaleco Científico</option>
									<option value="hoodie">Capuz Cyber</option>
									<option value="vest">Colete Moderno</option>
								</select>
							</div>
						</div>

						<!-- Color Swatches -->
						<div class="color-swatches">
							<div class="swatch-group">
								<span class="swatch-label">Corpo</span>
								<input type="color" class="color-picker" id="colBody" value="#10B981" onchange="onVisualChange()" />
							</div>
							<div class="swatch-group">
								<span class="swatch-label">Olhos</span>
								<input type="color" class="color-picker" id="colEyes" value="#0B0F19" onchange="onVisualChange()" />
							</div>
							<div class="swatch-group">
								<span class="swatch-label">Glow</span>
								<input type="color" class="color-picker" id="colGlow" value="#10B981" onchange="onVisualChange()" />
							</div>
							<div class="swatch-group">
								<span class="swatch-label">Accent</span>
								<input type="color" class="color-picker" id="colAccent" value="#00E5FF" onchange="onVisualChange()" />
							</div>
						</div>
					</div>
				</aside>
			</div>
		</section>

		<!-- ======================================================================
		     SCREEN 2: COSMIC WEB CHAT WITH DYNAMIC AVATARS
		     ====================================================================== -->
		<section class="screen-view" id="viewChat">
			<div class="chat-grid">
				<!-- Left: Agent Selector -->
				<aside class="chat-sidebar">
					<div class="roster-header">
						<span class="roster-title">INTERLOCUTOR</span>
					</div>
					<div class="roster-list" id="chatRosterList">
						<!-- Injected by JS -->
					</div>
				</aside>

				<!-- Center: Messages Area -->
				<main class="chat-center">
					<div class="chat-messages" id="chatMessages">
						<div class="chat-bubble agent">
							<strong>🌌 Cosmic Chat Ativado</strong>
							<p style="margin-top: 6px; font-size: 0.88rem; color: #94A3B8;">
								Converse em tempo real com qualquer agente do ecossistema. O avatar ao lado reagirá dinamicamente com escuta, raciocínio, fala e postura corporal compatíveis com sua identidade.
							</p>
						</div>
					</div>

					<div class="chat-composer">
						<input type="text" class="chat-input" id="chatInput" placeholder="Envie uma mensagem ou comando para o agente..." onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendChatMessage();}" oninput="onUserTyping()" />
						<button class="btn btn-primary" onclick="sendChatMessage()">
							Enviar ↵
						</button>
					</div>
				</main>

				<!-- Right: Dynamic Full Body Avatar for Active Chat Partner -->
				<aside class="chat-avatar-panel">
					<div class="full-body-viewport" style="width: 100%; height: 520px;">
						<div class="svg-canvas-wrapper" id="chatAvatarSvgContainer">
							<!-- Dynamic Chat Avatar Rendered by JS -->
						</div>
						<div class="telemetry-pill">
							<div class="telemetry-status">
								<span id="chatAvatarStatusDot"><span class="status-dot"></span>IDLE · OBSERVANDO</span>
								<span id="chatAgentModelTag" style="color: var(--stellar-cyan);">DEFAULT // HIGH</span>
							</div>
							<div class="telemetry-mood" id="chatAvatarMoodTag">
								Conectado: Shark Lead
							</div>
						</div>
					</div>
				</aside>
			</div>
		</section>
	</div>

	<!-- ==========================================================================
	     MODAL AGENTS.MD
	     ========================================================================== -->
	<div class="modal-backdrop" id="modalBackdrop">
		<div class="modal-card">
			<div class="modal-header">
				<h3 style="font-family: var(--font-display); font-size: 1.1rem; color: var(--stellar-cyan);">
					AGENTS.md Gerado para o Projeto
				</h3>
				<button class="btn" onclick="closeAgentsMdModal()">Fechar</button>
			</div>
			<div class="modal-body">
				<textarea class="field-textarea" id="agentsMdContent" style="height: 100%; width: 100%; font-size: 0.85rem;"></textarea>
			</div>
		</div>
	</div>

	<div class="hud-toast" id="toast"></div>

	<!-- ==========================================================================
	     CLIENT RUNTIME SCRIPT
	     ========================================================================== -->
	<script>
		let allAgents = [];
		let currentAgentId = null;
		let chatAgentId = null;
		let currentExpression = 'neutral';
		let chatStatus = 'idle'; // 'idle' | 'listening' | 'thinking' | 'talking'
		let breathPhase = 0;
		let blinkScaleY = 1;
		let talkWavePhase = 0;
		let typingTimer = null;

		const AVAILABLE_TOOLS = ['read', 'write', 'edit', 'bash', 'grep', 'glob', 'lsp', 'ast_edit', 'web_search', 'task', 'hub', 'todo'];

		async function init() {
			renderToolsChips();
			await loadAgents();
			startCosmicLoops();

			// Auto open chat view if requested in URL
			const urlParams = new URLSearchParams(window.location.search);
			if (urlParams.get('view') === 'chat' || window.location.pathname === '/chat') {
				switchView('chat');
			}
		}

		function showToast(msg) {
			const t = document.getElementById('toast');
			t.textContent = msg;
			t.style.display = 'block';
			setTimeout(() => { t.style.display = 'none'; }, 3200);
		}

		function switchView(view) {
			document.querySelectorAll('.screen-view').forEach(v => v.classList.remove('active'));
			document.getElementById('btnTabStudio').classList.remove('active');
			document.getElementById('btnTabChat').classList.remove('active');

			if (view === 'chat') {
				document.getElementById('viewChat').classList.add('active');
				document.getElementById('btnTabChat').classList.add('active');
				if (!chatAgentId && allAgents.length > 0) {
					selectChatAgent(allAgents[0].id);
				} else if (chatAgentId) {
					updateChatAvatarPreview();
				}
			} else {
				document.getElementById('viewStudio').classList.add('active');
				document.getElementById('btnTabStudio').classList.add('active');
			}
		}

		function renderToolsChips() {
			const container = document.getElementById('toolsContainer');
			container.innerHTML = '';
			AVAILABLE_TOOLS.forEach(tool => {
				const chip = document.createElement('div');
				chip.className = 'tool-chip';
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
				renderRosters();
				if (allAgents.length > 0) {
					selectAgent(allAgents[0].id);
					selectChatAgent(allAgents[0].id);
				}
			} catch (err) {
				console.error('Failed to load agents', err);
			}
		}

		function renderRosters() {
			const list = document.getElementById('agentsList');
			const chatList = document.getElementById('chatRosterList');
			list.innerHTML = '';
			chatList.innerHTML = '';

			document.getElementById('rosterCount').textContent = allAgents.length + ' AGENTES';

			allAgents.forEach(a => {
				// Studio item
				const item = document.createElement('div');
				item.className = 'roster-item' + (a.id === currentAgentId ? ' active' : '');
				item.onclick = () => selectAgent(a.id);
				const bodyColor = a.avatar?.colors?.body || '#00E5FF';
				item.innerHTML = \`
					<div class="roster-thumb" style="border-color: \${bodyColor}">
						<div style="width: 22px; height: 22px; border-radius: 6px; background: \${bodyColor}; box-shadow: 0 0 10px \${bodyColor};"></div>
					</div>
					<div class="roster-meta">
						<div class="roster-name">\${a.name}</div>
						<div class="roster-role">\${a.title}</div>
					</div>
				\`;
				list.appendChild(item);

				// Chat item
				const chatItem = document.createElement('div');
				chatItem.className = 'chat-roster-item' + (a.id === chatAgentId ? ' active' : '');
				chatItem.onclick = () => selectChatAgent(a.id);
				chatItem.innerHTML = \`
					<div class="roster-thumb" style="border-color: \${bodyColor}">
						<div style="width: 20px; height: 20px; border-radius: 6px; background: \${bodyColor};"></div>
					</div>
					<div class="roster-meta">
						<div class="roster-name">\${a.name}</div>
						<div class="roster-role">\${a.structure?.role || a.title}</div>
					</div>
				\`;
				chatList.appendChild(chatItem);
			});
		}

		function selectAgent(id) {
			currentAgentId = id;
			const a = allAgents.find(x => x.id === id);
			if (!a) return;

			document.getElementById('agentId').value = a.id;
			document.getElementById('agentName').value = a.name;
			document.getElementById('agentTitle').value = a.title;
			document.getElementById('agentCategory').value = a.structure?.category || 'specialist';
			document.getElementById('agentSystemPrompt').value = a.systemPrompt;
			document.getElementById('agentTone').value = a.personality?.tone || '';
			document.getElementById('agentCatchphrase').value = a.personality?.catchphrase || '';
			document.getElementById('agentTraits').value = (a.personality?.traits || []).join(', ');
			document.getElementById('agentBehaviorRules').value = (a.personality?.behaviorRules || []).join('\\n');

			document.getElementById('agentPrimaryModel').value = a.models?.primary?.model || 'default';
			document.getElementById('agentThinkingLevel').value = a.models?.primary?.thinkingLevel || 'high';
			document.getElementById('agentFallbacks').value = (a.fallbacks?.models || ['smol']).join(', ');
			document.getElementById('agentFallbackStrategy').value = a.fallbacks?.strategy || 'fallback-model';

			AVAILABLE_TOOLS.forEach(tool => {
				const el = document.getElementById('chip-' + tool);
				if (el) {
					if ((a.functions || []).includes(tool)) el.classList.add('selected');
					else el.classList.remove('selected');
				}
			});

			const colors = a.avatar?.colors || { body: '#00E5FF', eyes: '#0B0F19', glow: '#00E5FF', accent: '#8A2BE2' };
			document.getElementById('colBody').value = colors.body;
			document.getElementById('colEyes').value = colors.eyes;
			document.getElementById('colGlow').value = colors.glow || colors.body;
			document.getElementById('colAccent').value = colors.accent || '#8A2BE2';

			document.getElementById('avatarSurfaceType').value = a.avatar?.body?.primary?.type || 'sphere';
			document.getElementById('avatarStyle').value = a.avatar?.fullBody?.style || 'futuristic';
			document.getElementById('avatarClothing').value = a.avatar?.fullBody?.clothing || 'suit';

			renderRosters();
			updateStudioAvatarPreview();
		}

		function selectChatAgent(id) {
			chatAgentId = id;
			renderRosters();
			const a = allAgents.find(x => x.id === id);
			if (a) {
				document.getElementById('chatAgentModelTag').textContent = (a.models?.primary?.model || 'DEFAULT').toUpperCase() + ' // ' + (a.models?.primary?.thinkingLevel || 'HIGH').toUpperCase();
				document.getElementById('chatAvatarMoodTag').textContent = 'Conectado: ' + a.name;
			}
			updateChatAvatarPreview();
		}

		// Interpretive AI: Updates visual profile automatically based on role/tone
		function onFieldChange() {
			const name = document.getElementById('agentName').value;
			const title = document.getElementById('agentTitle').value;
			const tone = document.getElementById('agentTone').value;
			const traits = document.getElementById('agentTraits').value;
			const category = document.getElementById('agentCategory').value;

			const text = (name + ' ' + title + ' ' + tone + ' ' + traits + ' ' + category).toLowerCase();

			let inferredMood = 'Equilíbrio & Prontidão';
			if (text.includes('séri') || text.includes('rigoros') || text.includes('técnic')) {
				inferredMood = 'Rigor Técnico & Concentração Cirúrgica';
			} else if (text.includes('pacient') || text.includes('professor') || text.includes('scholar')) {
				inferredMood = 'Serenidade Pedagógica & Acolhimento';
			} else if (text.includes('seguranç') || text.includes('auditor') || text.includes('cétic')) {
				inferredMood = 'Vigilância Inflexível & Ceticismo Metódico';
			} else if (text.includes('líder') || text.includes('orquestrad') || text.includes('estratégic')) {
				inferredMood = 'Comando Estratégico & Presença Soberana';
			}

			document.getElementById('telemetryMoodLabel').textContent = 'Interpretado: ' + inferredMood;
			updateStudioAvatarPreview();
		}

		function onVisualChange() {
			const surface = document.getElementById('avatarSurfaceType').value;
			document.getElementById('avatarSurfaceBadge').textContent = surface.toUpperCase();
			updateStudioAvatarPreview();
		}

		function applyPresetPrompt(prompt) {
			document.getElementById('naturalLanguageInput').value = prompt;
			interpretFromNaturalLanguage();
		}

		async function interpretFromNaturalLanguage() {
			const prompt = document.getElementById('naturalLanguageInput').value.trim();
			if (!prompt) return alert('Por favor, digite a descrição do agente primeiro.');

			const btn = document.getElementById('btnInterpret');
			btn.textContent = '⏳ Interpretando com IA...';
			btn.disabled = true;

			try {
				const res = await fetch('/api/interpret-agent', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ prompt })
				});
				const data = await res.json();
				if (data.ok && data.agent) {
					// Check if already in roster or add
					const existingIndex = allAgents.findIndex(x => x.id === data.agent.id);
					if (existingIndex >= 0) {
						allAgents[existingIndex] = data.agent;
					} else {
						allAgents.unshift(data.agent);
					}
					renderRosters();
					selectAgent(data.agent.id);
					showToast('✨ Agente e Avatar interpretados com sucesso!');
				}
			} catch (err) {
				alert('Falha ao interpretar agente');
			} finally {
				btn.textContent = '✨ Interpretar & Gerar com IA';
				btn.disabled = false;
			}
		}

		/* ==========================================================================
		   PROCEDURAL FULL BODY BIBLE STRONG AVATAR SVG ENGINE (100% UNCLIPPED)
		   ========================================================================== */
		function generateFullBodySvg(agent, mode = 'studio', statusOverride = null) {
			if (!agent) return '';

			const status = statusOverride || (mode === 'chat' ? chatStatus : 'idle');
			const colors = agent.avatar?.colors || { body: '#00E5FF', eyes: '#0B0F19', glow: '#00E5FF', accent: '#8A2BE2' };
			const fullBody = agent.avatar?.fullBody || {};
			const surface = agent.avatar?.body?.primary?.type || 'sphere';
			const style = fullBody.style || 'futuristic';
			const clothing = fullBody.clothing || 'suit';
			const posture = fullBody.posture || 'upright';
			const accessories = fullBody.accessories || [];
			const limbs = fullBody.limbs || { armsPosition: 'neutral', stance: 'solid' };

			// Animation factors
			const breath = Math.sin(breathPhase) * 3.5;
			const isTalking = status === 'talking';
			const isThinking = status === 'thinking';
			const isListening = status === 'listening';

			// Posture inclinations
			let headRot = 0;
			let torsoLean = 0;
			if (posture === 'tactical') { headRot = 2; torsoLean = 2; }
			else if (posture === 'scholarly') { headRot = -3; torsoLean = -1; }
			else if (posture === 'confident') { headRot = 0; torsoLean = 0; }

			if (isListening) headRot += 4;
			if (isThinking) headRot -= 5;

			const bodyColor = colors.body;
			const eyesColor = colors.eyes;
			const glowColor = colors.glow || bodyColor;
			const accentColor = colors.accent || '#8A2BE2';
			const clothingColor = fullBody.clothingColor || '#0D1117';

			// Eye and eyebrow geometry
			const eyeW = 20;
			const eyeH = isThinking ? 28 : (isListening ? 38 : 34);
			const spacing = 36;
			const leftEyeX = 160 - spacing / 2;
			const rightEyeX = 160 + spacing / 2;
			const eyeY = 88 + (isThinking ? -2 : 0);

			// Eyebrow angle
			let eyebrowAngle = 0;
			if (posture === 'tactical' || isThinking) eyebrowAngle = 10;
			else if (posture === 'scholarly') eyebrowAngle = -4;

			// Talking wave indicator
			const talkWave = isTalking ? Math.sin(talkWavePhase) * 6 : 0;

			return \`
				<svg viewBox="0 0 320 460" width="100%" height="100%" style="overflow: visible;" xmlns="http://www.w3.org/2000/svg">
					<defs>
						<!-- Cosmic Body Glow -->
						<filter id="body-glow-\${mode}" x="-30%" y="-30%" width="160%" height="160%">
							<feDropShadow dx="0" dy="0" stdDeviation="12" flood-color="\${glowColor}" flood-opacity="0.45" />
						</filter>
						<filter id="accent-glow-\${mode}" x="-30%" y="-30%" width="160%" height="160%">
							<feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="\${accentColor}" flood-opacity="0.6" />
						</filter>
						<!-- Soft Back Aura Gradient -->
						<radialGradient id="back-aura-\${mode}" cx="50%" cy="45%" r="55%">
							<stop offset="0%" stop-color="\${glowColor}" stop-opacity="\${isThinking ? 0.45 : 0.25}" />
							<stop offset="60%" stop-color="\${accentColor}" stop-opacity="0.1" />
							<stop offset="100%" stop-color="#000000" stop-opacity="0" />
						</radialGradient>
						<!-- Shading Gradients -->
						<linearGradient id="cloth-shading-\${mode}" x1="0%" y1="0%" x2="100%" y2="100%">
							<stop offset="0%" stop-color="\${clothingColor}" />
							<stop offset="100%" stop-color="#05070B" />
						</linearGradient>
					</defs>

					<!-- LAYER 1: BACK COSMIC AURA -->
					<circle cx="160" cy="220" r="140" fill="url(#back-aura-\${mode})" style="transition: all 0.5s ease;" />

					<!-- LAYER 2: HALO (SE HOUVER) -->
					\${accessories.includes('halo') || posture === 'confident' ? \`
						<g transform="translate(160, 32)">
							<ellipse cx="0" cy="0" rx="48" ry="12" fill="none" stroke="\${accentColor}" stroke-width="2.5" filter="url(#accent-glow-\${mode})" opacity="0.9" />
							<ellipse cx="0" cy="0" rx="44" ry="10" fill="none" stroke="#FFFFFF" stroke-width="1" opacity="0.7" />
						</g>
					\` : ''}

					<!-- LAYER 3: MANTO / CAPA DORSAL (SE ROBE OU TACTICAL) -->
					\${clothing === 'robe' || style === 'scholar' ? \`
						<path d="M 115 180 Q 70 340 60 410 L 260 410 Q 250 340 205 180 Z" fill="#13101C" opacity="0.75" />
					\` : ''}

					<!-- LAYER 4: BASE / PERNAS / CALÇADOS (100% VISÍVEIS) -->
					<g transform="translate(0, \${breath * 0.4})">
						<!-- Pernas -->
						<rect x="122" y="275" width="28" height="110" rx="8" fill="#0C0F17" stroke="\${clothingColor}" stroke-width="1" />
						<rect x="170" y="275" width="28" height="110" rx="8" fill="#0C0F17" stroke="\${clothingColor}" stroke-width="1" />
						<!-- Linhas de Energia nas Pernas -->
						<line x1="136" y1="285" x2="136" y2="375" stroke="\${accentColor}" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.6" />
						<line x1="184" y1="285" x2="184" y2="375" stroke="\${accentColor}" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.6" />

						\${limbs.stance === 'floating' ? \`
							<!-- Propulsores Anti-Gravidade Flutuantes -->
							<ellipse cx="136" cy="392" rx="16" ry="6" fill="\${accentColor}" filter="url(#accent-glow-\${mode})" />
							<ellipse cx="184" cy="392" rx="16" ry="6" fill="\${accentColor}" filter="url(#accent-glow-\${mode})" />
							<line x1="136" y1="392" x2="136" y2="430" stroke="\${glowColor}" stroke-width="3" opacity="0.7" stroke-linecap="round" />
							<line x1="184" y1="392" x2="184" y2="430" stroke="\${glowColor}" stroke-width="3" opacity="0.7" stroke-linecap="round" />
						\` : \`
							<!-- Calçados Tecnológicos -->
							<rect x="114" y="380" width="38" height="22" rx="6" fill="#151922" stroke="\${accentColor}" stroke-width="1.2" />
							<rect x="168" y="380" width="38" height="22" rx="6" fill="#151922" stroke="\${accentColor}" stroke-width="1.2" />
							<line x1="114" y1="400" x2="152" y2="400" stroke="\${accentColor}" stroke-width="2" opacity="0.8" />
							<line x1="168" y1="400" x2="206" y2="400" stroke="\${accentColor}" stroke-width="2" opacity="0.8" />
						\`}
					</g>

					<!-- LAYER 5: TRONCO & VESTIMENTA (COM RESPIRAÇÃO NATURAL) -->
					<g transform="translate(0, \${breath})">
						<!-- Torso Base -->
						<path d="M 104 165 C 104 150, 216 150, 216 165 L 204 285 C 204 290, 116 290, 116 285 Z" fill="url(#cloth-shading-\${mode})" stroke="rgba(255,255,255,0.15)" stroke-width="1" />

						<!-- Detalhes de Roupa por Estilo -->
						\${clothing === 'armor' ? \`
							<!-- Placas de Armadura Cibernética -->
							<path d="M 118 175 L 160 195 L 202 175 L 195 240 L 160 260 L 125 240 Z" fill="#182234" stroke="\${accentColor}" stroke-width="1.5" />
							<!-- Arc Reactor / Núcleo de Energia -->
							<circle cx="160" cy="215" r="14" fill="\${bodyColor}" filter="url(#body-glow-\${mode})" />
							<circle cx="160" cy="215" r="8" fill="#FFFFFF" />
						\` : clothing === 'suit' ? \`
							<!-- Lapelas de Terno Elegante -->
							<polygon points="120,165 160,225 145,280 120,280" fill="#090D14" />
							<polygon points="200,165 160,225 175,280 200,280" fill="#090D14" />
							<!-- Gravata / Fita de Dados -->
							<polygon points="156,180 164,180 162,255 158,255" fill="\${bodyColor}" filter="url(#body-glow-\${mode})" />
						\` : clothing === 'robe' ? \`
							<!-- Dobras de Túnica Teológica -->
							<path d="M 125 165 Q 160 240 125 285" fill="none" stroke="\${accentColor}" stroke-width="2" opacity="0.7" />
							<path d="M 195 165 Q 160 240 195 285" fill="none" stroke="\${accentColor}" stroke-width="2" opacity="0.7" />
							<circle cx="160" cy="185" r="7" fill="\${accentColor}" />
						\` : \`
							<!-- Traje Básico Moderno -->
							<line x1="160" y1="165" x2="160" y2="280" stroke="\${accentColor}" stroke-width="2" opacity="0.6" />
						\`}

						<!-- Braços e Membros -->
						\${limbs.armsPosition === 'folded' ? \`
							<!-- Braços Cruzados Focados -->
							<path d="M 104 175 C 90 205, 110 245, 160 245 C 210 245, 230 205, 216 175" fill="none" stroke="url(#cloth-shading-\${mode})" stroke-width="24" stroke-linecap="round" />
							<path d="M 120 235 L 200 235" stroke="\${accentColor}" stroke-width="1.5" opacity="0.7" />
						\` : limbs.armsPosition === 'hands_joined' ? \`
							<!-- Mãos Unidas Reflexivas -->
							<path d="M 104 175 L 145 235 L 160 240 L 175 235 L 216 175" fill="none" stroke="url(#cloth-shading-\${mode})" stroke-width="22" stroke-linecap="round" stroke-linejoin="round" />
							<circle cx="160" cy="238" r="8" fill="\${bodyColor}" filter="url(#body-glow-\${mode})" />
						\` : isTalking ? \`
							<!-- Braços em Gesticulação Ativa -->
							<path d="M 104 175 Q 80 215 95 245" fill="none" stroke="url(#cloth-shading-\${mode})" stroke-width="22" stroke-linecap="round" />
							<path d="M 216 175 Q 248 200 235 230" fill="none" stroke="url(#cloth-shading-\${mode})" stroke-width="22" stroke-linecap="round" />
							<circle cx="235" cy="230" r="7" fill="\${bodyColor}" />
						\` : \`
							<!-- Braços nas Laterais em Prontidão -->
							<path d="M 104 175 Q 92 225 96 265" fill="none" stroke="url(#cloth-shading-\${mode})" stroke-width="22" stroke-linecap="round" />
							<path d="M 216 175 Q 228 225 224 265" fill="none" stroke="url(#cloth-shading-\${mode})" stroke-width="22" stroke-linecap="round" />
							<circle cx="96" cy="265" r="7" fill="\${bodyColor}" />
							<circle cx="224" cy="265" r="7" fill="\${bodyColor}" />
						\`}

						<!-- Pescoço -->
						<rect x="148" y="132" width="24" height="24" rx="4" fill="#0A0E17" stroke="rgba(255,255,255,0.1)" />
					</g>

					<!-- LAYER 6: CABEÇA 3D NATIVA BIBLE STRONG COM PERSPECTIVA -->
					<g transform="translate(160, 95) rotate(\${headRot}) translate(-160, -95)">
						<!-- Superfície Geométrica da Cabeça -->
						\${surface === 'cube' ? \`
							<rect x="110" y="45" width="100" height="100" rx="20" ry="20" fill="\${bodyColor}" filter="url(#body-glow-\${mode})" />
							<rect x="115" y="50" width="90" height="90" rx="16" ry="16" fill="none" stroke="#FFFFFF" stroke-width="1.2" opacity="0.3" />
						\` : surface === 'capsule' ? \`
							<rect x="115" y="40" width="90" height="110" rx="45" ry="45" fill="\${bodyColor}" filter="url(#body-glow-\${mode})" />
						\` : surface === 'cylinder' ? \`
							<rect x="115" y="45" width="90" height="100" rx="16" ry="16" fill="\${bodyColor}" filter="url(#body-glow-\${mode})" />
							<ellipse cx="160" cy="50" rx="45" ry="14" fill="#FFFFFF" opacity="0.25" />
						\` : surface === 'diamond' ? \`
							<polygon points="160,35 215,95 160,155 105,95" fill="\${bodyColor}" filter="url(#body-glow-\${mode})" />
						\` : surface === 'cone' ? \`
							<polygon points="160,35 215,150 105,150" fill="\${bodyColor}" filter="url(#body-glow-\${mode})" />
						\` : surface === 'mickey' ? \`
							<circle cx="120" cy="50" r="26" fill="\${bodyColor}" filter="url(#body-glow-\${mode})" />
							<circle cx="200" cy="50" r="26" fill="\${bodyColor}" filter="url(#body-glow-\${mode})" />
							<circle cx="160" cy="95" r="48" fill="\${bodyColor}" filter="url(#body-glow-\${mode})" />
						\` : \`
							<!-- Sphere (Default) -->
							<circle cx="160" cy="95" r="48" fill="\${bodyColor}" filter="url(#body-glow-\${mode})" />
							<!-- 3D Spherical Volume Highlight -->
							<ellipse cx="145" cy="80" rx="30" ry="22" fill="#FFFFFF" opacity="0.3" />
						\`}

						<!-- LAYER 7: ROSTO & OLHOS BIBLE STRONG -->
						<!-- Sobrancelhas Dinâmicas -->
						<line x1="\${leftEyeX - 10}" y1="\${eyeY - 22 + eyebrowAngle}" x2="\${leftEyeX + 10}" y2="\${eyeY - 22 - eyebrowAngle}" stroke="\${eyesColor}" stroke-width="3" stroke-linecap="round" />
						<line x1="\${rightEyeX - 10}" y1="\${eyeY - 22 - eyebrowAngle}" x2="\${rightEyeX + 10}" y2="\${eyeY - 22 + eyebrowAngle}" stroke="\${eyesColor}" stroke-width="3" stroke-linecap="round" />

						<!-- Olhos Expressivos com Piscar Orgânico -->
						<g transform="translate(0, 0)">
							<!-- Olho Esquerdo -->
							<g transform="translate(\${leftEyeX}, \${eyeY}) scale(1, \${blinkScaleY}) translate(-\${leftEyeX}, -\${eyeY})">
								<ellipse cx="\${leftEyeX}" cy="\${eyeY}" rx="\${eyeW / 2}" ry="\${eyeH / 2}" fill="\${eyesColor}" />
								<circle cx="\${leftEyeX + 2}" cy="\${eyeY - 4}" r="3" fill="#FFFFFF" opacity="0.9" />
							</g>
							<!-- Olho Direito -->
							<g transform="translate(\${rightEyeX}, \${eyeY}) scale(1, \${blinkScaleY}) translate(-\${rightEyeX}, -\${eyeY})">
								<ellipse cx="\${rightEyeX}" cy="\${eyeY}" rx="\${eyeW / 2}" ry="\${eyeH / 2}" fill="\${eyesColor}" />
								<circle cx="\${rightEyeX + 2}" cy="\${eyeY - 4}" r="3" fill="#FFFFFF" opacity="0.9" />
							</g>
						</g>

						<!-- LAYER 8: ACESSÓRIOS DE ROSTO -->
						\${accessories.includes('hud_visor') ? \`
							<!-- HUD Visor Translúcido -->
							<rect x="116" y="\${eyeY - 14}" width="88" height="28" rx="6" fill="\${accentColor}" opacity="0.45" filter="url(#accent-glow-\${mode})" />
							<rect x="118" y="\${eyeY - 12}" width="84" height="24" rx="4" fill="none" stroke="#FFFFFF" stroke-width="1" opacity="0.8" />
							<line x1="124" y1="\${eyeY}" x2="196" y2="\${eyeY}" stroke="#FFFFFF" stroke-width="0.75" stroke-dasharray="3 3" opacity="0.7" />
						\` : accessories.includes('glasses') ? \`
							<!-- Óculos Acadêmicos Eruditos -->
							<circle cx="\${leftEyeX}" cy="\${eyeY}" r="17" fill="none" stroke="\${accentColor}" stroke-width="2.5" />
							<circle cx="\${rightEyeX}" cy="\${eyeY}" r="17" fill="none" stroke="\${accentColor}" stroke-width="2.5" />
							<line x1="\${leftEyeX + 17}" y1="\${eyeY}" x2="\${rightEyeX - 17}" y2="\${eyeY}" stroke="\${accentColor}" stroke-width="2.5" />
						\` : ''}

						<!-- Boca / Indicador de Fala -->
						\${isTalking ? \`
							<!-- Onda de Fala Ativa -->
							<path d="M 148 \${122 + talkWave} Q 160 \${128 - talkWave} 172 \${122 + talkWave}" fill="none" stroke="\${eyesColor}" stroke-width="3" stroke-linecap="round" />
						\` : \`
							<!-- Boca Neutra Firme -->
							<line x1="152" y1="122" x2="168" y2="122" stroke="\${eyesColor}" stroke-width="2.5" stroke-linecap="round" />
						\`}
					</g>
				</svg>
			\`;
		}

		function updateStudioAvatarPreview() {
			const a = allAgents.find(x => x.id === currentAgentId);
			if (!a) return;

			// Mirror controls to agent state
			a.avatar.body.primary.type = document.getElementById('avatarSurfaceType').value;
			a.avatar.fullBody.style = document.getElementById('avatarStyle').value;
			a.avatar.fullBody.clothing = document.getElementById('avatarClothing').value;
			a.avatar.colors.body = document.getElementById('colBody').value;
			a.avatar.colors.eyes = document.getElementById('colEyes').value;
			a.avatar.colors.glow = document.getElementById('colGlow').value;
			a.avatar.colors.accent = document.getElementById('colAccent').value;

			document.getElementById('telemetryStyleLabel').textContent = (a.avatar.fullBody.style + ' ' + a.avatar.fullBody.clothing).toUpperCase();

			const container = document.getElementById('avatarSvgContainer');
			container.innerHTML = generateFullBodySvg(a, 'studio');
		}

		function updateChatAvatarPreview() {
			const a = allAgents.find(x => x.id === chatAgentId);
			if (!a) return;

			const container = document.getElementById('chatAvatarSvgContainer');
			container.innerHTML = generateFullBodySvg(a, 'chat', chatStatus);

			const dot = document.getElementById('chatAvatarStatusDot');
			if (chatStatus === 'thinking') {
				dot.innerHTML = '<span class="status-dot" style="background:#00E5FF; box-shadow:0 0 10px #00E5FF;"></span>RACIOCINANDO // THINKING';
			} else if (chatStatus === 'talking') {
				dot.innerHTML = '<span class="status-dot" style="background:#FF5500; box-shadow:0 0 10px #FF5500;"></span>RESPONDENDO // TALKING';
			} else if (chatStatus === 'listening') {
				dot.innerHTML = '<span class="status-dot" style="background:#D4AF37; box-shadow:0 0 10px #D4AF37;"></span>ESCUTANDO // LISTENING';
			} else {
				dot.innerHTML = '<span class="status-dot"></span>IDLE // OBSERVANDO';
			}
		}

		function startCosmicLoops() {
			// Continuous smooth breathing loop (~3.8s period)
			setInterval(() => {
				breathPhase += 0.08;
				if (chatStatus === 'talking') {
					talkWavePhase += 0.25;
				}
				updateStudioAvatarPreview();
				if (document.getElementById('viewChat').classList.contains('active')) {
					updateChatAvatarPreview();
				}
			}, 50);

			// Natural blinking loop (every 3.8s to 5.5s)
			function scheduleBlink() {
				const nextDelay = 3500 + Math.random() * 2000;
				setTimeout(() => {
					blinkScaleY = 0.08;
					updateStudioAvatarPreview();
					updateChatAvatarPreview();
					setTimeout(() => {
						blinkScaleY = 1;
						updateStudioAvatarPreview();
						updateChatAvatarPreview();
						scheduleBlink();
					}, 150);
				}, nextDelay);
			}
			scheduleBlink();
		}

		function onUserTyping() {
			if (chatStatus !== 'thinking' && chatStatus !== 'talking') {
				chatStatus = 'listening';
				updateChatAvatarPreview();
				clearTimeout(typingTimer);
				typingTimer = setTimeout(() => {
					chatStatus = 'idle';
					updateChatAvatarPreview();
				}, 1800);
			}
		}

		/* ==========================================================================
		   CHAT ENGINE
		   ========================================================================== */
		async function sendChatMessage() {
			const input = document.getElementById('chatInput');
			const message = input.value.trim();
			if (!message) return;

			input.value = '';

			// Append User Bubble
			const chatContainer = document.getElementById('chatMessages');
			const userBubble = document.createElement('div');
			userBubble.className = 'chat-bubble user';
			userBubble.innerHTML = \`<div>\${escapeHtml(message)}</div>\`;
			chatContainer.appendChild(userBubble);
			chatContainer.scrollTop = chatContainer.scrollHeight;

			// Switch avatar to thinking state
			chatStatus = 'thinking';
			updateChatAvatarPreview();

			try {
				const res = await fetch('/api/chat', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ agentId: chatAgentId, message })
				});
				const data = await res.json();

				// Switch to talking state
				chatStatus = 'talking';
				updateChatAvatarPreview();

				const agentBubble = document.createElement('div');
				agentBubble.className = 'chat-bubble agent';
				const formattedText = formatMarkdownBasic(data.reply || 'Processado com sucesso.');
				agentBubble.innerHTML = \`
					<div>\${formattedText}</div>
					<div class="chat-meta">
						<span>MODELO: \${data.telemetry?.model || 'default'}</span>
						<span>THINKING: \${data.telemetry?.thinkingLevel || 'HIGH'}</span>
						<span>LATÊNCIA: \${data.telemetry?.latencyMs || 240}ms</span>
					</div>
				\`;
				chatContainer.appendChild(agentBubble);
				chatContainer.scrollTop = chatContainer.scrollHeight;

				// Return to idle after speech duration
				setTimeout(() => {
					chatStatus = 'idle';
					updateChatAvatarPreview();
				}, 2400);

			} catch (err) {
				chatStatus = 'idle';
				updateChatAvatarPreview();
				const errBubble = document.createElement('div');
				errBubble.className = 'chat-bubble agent';
				errBubble.textContent = 'Erro ao processar mensagem com o agente.';
				chatContainer.appendChild(errBubble);
			}
		}

		function escapeHtml(text) {
			const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
			return text.replace(/[&<>"']/g, m => map[m]);
		}

		function formatMarkdownBasic(md) {
			return md
				.replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
				.replace(/\\*(.+?)\\*/g, '<em>$1</em>')
				.replace(/\`\`\`ts([\\s\\S]*?)\`\`\`/g, '<pre style="background:rgba(0,0,0,0.6); padding:10px; border-radius:8px; margin:8px 0; overflow-x:auto;"><code>$1</code></pre>')
				.replace(/\`\`\`([\\s\\S]*?)\`\`\`/g, '<pre style="background:rgba(0,0,0,0.6); padding:10px; border-radius:8px; margin:8px 0; overflow-x:auto;"><code>$1</code></pre>')
				.replace(/\`(.+?)\`/g, '<code style="background:rgba(255,255,255,0.1); padding:2px 4px; border-radius:4px;">$1</code>')
				.replace(/\\n/g, '<br/>');
		}

		/* ==========================================================================
		   AGENT CRUD OPERATIONS
		   ========================================================================== */
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
					catchphrase: 'Pronto para executar.',
					behaviorRules: ['Sempre responder com precisão técnica']
				},
				functions: ['read', 'write', 'bash'],
				models: { primary: { model: 'default', thinkingLevel: 'high' } },
				fallbacks: { models: ['smol'], strategy: 'fallback-model' },
				structure: { role: 'Especialista', category: 'specialist' },
				avatar: {
					schema: 'bible-strong/avatar-definition',
					schemaVersion: 1,
					body: { primary: { type: 'sphere', width: 240, height: 240, depth: 240, roundness: 1 }, nodes: [] },
					colors: { body: '#00E5FF', eyes: '#0B0F19', glow: '#00E5FF', accent: '#8A2BE2' },
					expressions: {
						neutral: { head: {x:0, y:0, z:0}, eyes: { left: {width:22, height:48, x:0, y:0, angle:0}, right: {width:22, height:48, x:0, y:0, angle:0}, spacing:42 }, perspective: 1, motion: {eyes:'microSaccades', body:'slowDrift'} }
					},
					expressionOrder: ['neutral'],
					animations: { idle: { playbackMode: 'loop', steps: [{expression:'neutral', holdMs:2000, transitionMs:500, transition:'smooth'}], blink: {enabled:true, initialDelayMs:2000, minIntervalMs:2500, maxIntervalMs:6000, durationMs:180} } },
					animationOrder: ['idle'],
					fullBody: {
						style: 'futuristic',
						clothing: 'suit',
						clothingColor: '#0A1424',
						accentColor: '#8A2BE2',
						accessories: ['hud_visor'],
						posture: 'upright',
						limbs: { armsPosition: 'neutral', stance: 'solid' },
						interpretedMood: 'Equilíbrio & Prontidão'
					}
				},
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			};
			allAgents.push(newA);
			renderRosters();
			selectAgent(id);
			showToast('Novo agente criado!');
		}

		async function saveCurrentAgent() {
			const id = document.getElementById('agentId').value.trim();
			if (!id) return alert('ID é obrigatório');

			const selectedTools = [];
			document.querySelectorAll('.tool-chip.selected').forEach(c => {
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
						body: document.getElementById('colBody').value,
						eyes: document.getElementById('colEyes').value,
						glow: document.getElementById('colGlow').value,
						accent: document.getElementById('colAccent').value
					},
					expressions: {
						neutral: {
							head: { x: 0, y: 0, z: 0 },
							eyes: {
								left: { width: 22, height: 48, x: 0, y: 0, angle: 0 },
								right: { width: 22, height: 48, x: 0, y: 0, angle: 0 },
								spacing: 42
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
					animationOrder: ['idle'],
					fullBody: {
						style: document.getElementById('avatarStyle').value,
						clothing: document.getElementById('avatarClothing').value,
						clothingColor: '#0A1424',
						accentColor: document.getElementById('colAccent').value,
						accessories: ['hud_visor'],
						posture: 'upright',
						limbs: { armsPosition: 'neutral', stance: 'solid' },
						interpretedMood: document.getElementById('telemetryMoodLabel').textContent.replace('Interpretado: ', '')
					}
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
