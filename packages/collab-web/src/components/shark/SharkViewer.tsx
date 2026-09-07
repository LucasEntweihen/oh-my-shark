import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

// Declarar THREE global vindo via script tag
declare const THREE: {
	Scene: new () => { add: (obj: unknown) => void };
	PerspectiveCamera: new (
		fov: number,
		aspect: number,
		near: number,
		far: number,
	) => {
		position: { set: (x: number, y: number, z: number) => void };
		aspect: number;
		updateProjectionMatrix: () => void;
	};
	WebGLRenderer: new (params: { canvas: HTMLCanvasElement; antialias: boolean; alpha: boolean }) => {
		domElement: HTMLCanvasElement;
		setSize: (w: number, h: number) => void;
		setPixelRatio: (ratio: number) => void;
		render: (scene: unknown, camera: unknown) => void;
		dispose: () => void;
	};
	OrbitControls: new (
		camera: unknown,
		domElement: HTMLElement,
	) => {
		enableDamping: boolean;
		dampingFactor: number;
		maxDistance: number;
		minDistance: number;
		update: () => void;
	};
	Vector2: new (x: number, y: number) => unknown;
	LatheGeometry: new (points: unknown[], segments: number) => { rotateZ: (rad: number) => void };
	ConeGeometry: new (
		radius: number,
		height: number,
		radialSegments: number,
	) => {
		rotateX: (rad: number) => void;
		rotateZ: (rad: number) => void;
		translate: (x: number, y: number, z: number) => void;
	};
	SphereGeometry: new (
		radius: number,
		widthSegments: number,
		heightSegments: number,
	) => {
		translate: (x: number, y: number, z: number) => void;
	};
	TorusGeometry: new (
		radius: number,
		tube: number,
		radialSegments: number,
		tubularSegments: number,
		arc?: number,
	) => {
		rotateX: (rad: number) => void;
		rotateY: (rad: number) => void;
		rotateZ: (rad: number) => void;
		translate: (x: number, y: number, z: number) => void;
	};
	Group: new () => {
		add: (obj: unknown) => void;
		position: { x: number; y: number; z: number };
		rotation: { x: number; y: number; z: number };
	};
	MeshBasicMaterial: new (params: Record<string, unknown>) => unknown;
	PointsMaterial: new (params: Record<string, unknown>) => { size: number };
	Mesh: new (geometry: unknown, material: unknown) => unknown;
	Points: new (
		geometry: unknown,
		material: unknown,
	) => {
		scale: { set: (x: number, y: number, z: number) => void };
	};
	Clock: new () => { getElapsedTime: () => number };
};

export interface SharkViewerProps {
	lastMessage?: string;
	ttsEnabled?: boolean;
}

export function SharkViewer({ lastMessage, ttsEnabled }: SharkViewerProps): ReactNode {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const isSpeakingRef = useRef(false);
	const [speaking, setSpeaking] = useState(false);
	const [coords, setCoords] = useState({ x: 0, y: 0 });
	const lastSpokenRef = useRef<string>("");

	useEffect(() => {
		let cleanupScene: (() => void) | undefined;

		const init = () => {
			if (typeof THREE === "undefined" || !canvasRef.current || !containerRef.current) return;
			const container = containerRef.current;
			const canvas = canvasRef.current;

			const scene = new THREE.Scene();
			const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
			camera.position.set(0, 0, 9);

			const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
			renderer.setSize(container.clientWidth, container.clientHeight);
			renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

			const controls = new THREE.OrbitControls(camera, renderer.domElement);
			controls.enableDamping = true;
			controls.dampingFactor = 0.05;
			controls.maxDistance = 20;
			controls.minDistance = 3;

			// Geometria Procedural do Tubarão
			const profilePoints = [
				new THREE.Vector2(0.001, -2.8),
				new THREE.Vector2(0.25, -2.5),
				new THREE.Vector2(0.55, -2.0),
				new THREE.Vector2(0.85, -1.2),
				new THREE.Vector2(0.98, -0.2),
				new THREE.Vector2(0.92, 0.6),
				new THREE.Vector2(0.7, 1.4),
				new THREE.Vector2(0.42, 2.1),
				new THREE.Vector2(0.2, 2.7),
				new THREE.Vector2(0.05, 3.1),
				new THREE.Vector2(0.001, 3.2),
			];

			const bodyGeo = new THREE.LatheGeometry(profilePoints, 22);
			bodyGeo.rotateZ(Math.PI / 2);

			const dorsalGeo = new THREE.ConeGeometry(0.7, 1.3, 4);
			dorsalGeo.rotateX(Math.PI / 8);
			dorsalGeo.rotateZ(-Math.PI / 12);
			dorsalGeo.translate(0.1, 1.1, 0);

			const pecLeftGeo = new THREE.ConeGeometry(0.5, 1.6, 4);
			pecLeftGeo.rotateZ(-Math.PI / 3);
			pecLeftGeo.rotateX(Math.PI / 4);
			pecLeftGeo.translate(-0.8, -0.4, 0.9);

			const pecRightGeo = new THREE.ConeGeometry(0.5, 1.6, 4);
			pecRightGeo.rotateZ(-Math.PI / 3);
			pecRightGeo.rotateX(-Math.PI / 4);
			pecRightGeo.translate(-0.8, -0.4, -0.9);

			const tailUpperGeo = new THREE.ConeGeometry(0.4, 1.6, 4);
			tailUpperGeo.rotateZ(-Math.PI / 3.5);
			tailUpperGeo.translate(3.5, 0.8, 0);

			const tailLowerGeo = new THREE.ConeGeometry(0.3, 1.0, 4);
			tailLowerGeo.rotateZ(Math.PI / 3.5);
			tailLowerGeo.translate(3.3, -0.5, 0);

			const eyeLeftGeo = new THREE.SphereGeometry(0.12, 8, 8);
			eyeLeftGeo.translate(-1.8, 0.22, 0.52);

			const eyeRightGeo = new THREE.SphereGeometry(0.12, 8, 8);
			eyeRightGeo.translate(-1.8, 0.22, -0.52);

			const jawGeo = new THREE.TorusGeometry(0.38, 0.035, 4, 8, Math.PI * 0.9);
			jawGeo.rotateX(Math.PI / 2);
			jawGeo.rotateZ(Math.PI * 0.05);
			jawGeo.translate(-1.6, -0.25, 0);

			const gillGeoLeft = new THREE.TorusGeometry(0.28, 0.02, 4, 6, Math.PI * 0.6);
			gillGeoLeft.rotateY(Math.PI / 2);
			gillGeoLeft.rotateZ(-Math.PI / 8);
			gillGeoLeft.translate(-1.1, 0.05, 0.76);

			const gillGeoRight = new THREE.TorusGeometry(0.28, 0.02, 4, 6, Math.PI * 0.6);
			gillGeoRight.rotateY(-Math.PI / 2);
			gillGeoRight.rotateZ(-Math.PI / 8);
			gillGeoRight.translate(-1.1, 0.05, -0.76);

			const sharkGroup = new THREE.Group();
			scene.add(sharkGroup);

			const wireframeMaterial = new THREE.MeshBasicMaterial({
				color: 0x3b5998,
				wireframe: true,
				transparent: true,
				opacity: 0.7,
			});

			const particleMaterial = new THREE.PointsMaterial({
				color: 0x82ccdd,
				size: 0.055,
				transparent: true,
				opacity: 0.9,
			});

			const jawMesh = new THREE.Mesh(jawGeo, wireframeMaterial);
			const jawPoints = new THREE.Points(jawGeo, particleMaterial);
			const jawGroup = new THREE.Group();
			jawGroup.add(jawMesh);
			jawGroup.add(jawPoints);
			sharkGroup.add(jawGroup);

			[
				bodyGeo,
				dorsalGeo,
				pecLeftGeo,
				pecRightGeo,
				tailUpperGeo,
				tailLowerGeo,
				eyeLeftGeo,
				eyeRightGeo,
				gillGeoLeft,
				gillGeoRight,
			].forEach(geo => {
				sharkGroup.add(new THREE.Mesh(geo, wireframeMaterial));
				sharkGroup.add(new THREE.Points(geo, particleMaterial));
			});

			const eyeGlowMaterial = new THREE.PointsMaterial({
				color: 0x00f0ff,
				size: 0.08,
				transparent: true,
				opacity: 1.0,
			});
			const eyeLeftPoints = new THREE.Points(eyeLeftGeo, eyeGlowMaterial);
			const eyeRightPoints = new THREE.Points(eyeRightGeo, eyeGlowMaterial);
			sharkGroup.add(eyeLeftPoints);
			sharkGroup.add(eyeRightPoints);

			const BASE_ROTATION_Y = Math.PI * 0.32;
			const BASE_ROTATION_X = 0.12;
			sharkGroup.rotation.y = BASE_ROTATION_Y;
			sharkGroup.rotation.x = BASE_ROTATION_X;

			const targetRotation = { x: BASE_ROTATION_X, y: BASE_ROTATION_Y };

			const onMouseMove = (event: MouseEvent) => {
				const normX = (event.clientX / window.innerWidth) * 2 - 1;
				const normY = -(event.clientY / window.innerHeight) * 2 + 1;
				targetRotation.y = BASE_ROTATION_Y + normX * 0.22;
				targetRotation.x = BASE_ROTATION_X - normY * 0.12;
				setCoords({ x: Number(normX.toFixed(2)), y: Number(normY.toFixed(2)) });
			};

			const onResize = () => {
				if (!containerRef.current) return;
				const w = containerRef.current.clientWidth;
				const h = containerRef.current.clientHeight;
				camera.aspect = w / h;
				camera.updateProjectionMatrix();
				renderer.setSize(w, h);
			};

			window.addEventListener("mousemove", onMouseMove);
			window.addEventListener("resize", onResize);

			let reqId: number;
			const clock = new THREE.Clock();

			const animate = () => {
				reqId = requestAnimationFrame(animate);
				const elapsedTime = clock.getElapsedTime();

				if (isSpeakingRef.current) {
					const mouthOpen = Math.sin(elapsedTime * 18) * 0.18 + 0.18;
					jawGroup.position.y = -mouthOpen * 0.4;
					jawGroup.rotation.z = Math.sin(elapsedTime * 18) * 0.08;
					const eyeScale = 1.0 + Math.sin(elapsedTime * 24) * 0.35;
					eyeLeftPoints.scale.set(eyeScale, eyeScale, eyeScale);
					eyeRightPoints.scale.set(eyeScale, eyeScale, eyeScale);
					eyeGlowMaterial.size = 0.08 + Math.sin(elapsedTime * 20) * 0.03;
					sharkGroup.rotation.z = Math.sin(elapsedTime * 6) * 0.04;
				} else {
					jawGroup.position.y = 0;
					jawGroup.rotation.z = 0;
					eyeLeftPoints.scale.set(1, 1, 1);
					eyeRightPoints.scale.set(1, 1, 1);
					eyeGlowMaterial.size = 0.08;
					sharkGroup.rotation.z = Math.sin(elapsedTime * 0.8) * 0.02;
				}

				sharkGroup.rotation.y += (targetRotation.y - sharkGroup.rotation.y) * 0.025;
				sharkGroup.rotation.x += (targetRotation.x - sharkGroup.rotation.x) * 0.025;
				sharkGroup.position.y = Math.sin(elapsedTime * 0.8) * 0.06;

				controls.update();
				renderer.render(scene, camera);
			};

			animate();

			cleanupScene = () => {
				cancelAnimationFrame(reqId);
				window.removeEventListener("mousemove", onMouseMove);
				window.removeEventListener("resize", onResize);
				renderer.dispose();
			};
		};

		init();

		return () => {
			if (cleanupScene) cleanupScene();
		};
	}, []);

	// Executa Text-to-Speech se habilitado e houver nova mensagem
	useEffect(() => {
		if (!ttsEnabled || !lastMessage || !("speechSynthesis" in window)) return;

		const cleanText = lastMessage
			.replace(/\[.*?\]/g, "")
			.replace(/<[^>]*>/g, "")
			.replace(/[⠀-⣿]/g, "")
			.trim();

		if (!cleanText || cleanText === lastSpokenRef.current) return;
		lastSpokenRef.current = cleanText;

		window.speechSynthesis.cancel();

		const utterance = new SpeechSynthesisUtterance(cleanText);
		utterance.lang = "pt-BR";
		utterance.rate = 1.05;
		utterance.pitch = 0.85;

		utterance.onstart = () => {
			isSpeakingRef.current = true;
			setSpeaking(true);
		};

		const stopSpeak = () => {
			isSpeakingRef.current = false;
			setSpeaking(false);
		};

		utterance.onend = stopSpeak;
		utterance.onerror = stopSpeak;

		window.speechSynthesis.speak(utterance);
	}, [lastMessage, ttsEnabled]);

	return (
		<div
			ref={containerRef}
			style={{
				position: "relative",
				width: "100%",
				height: "100%",
				background: "radial-gradient(circle at 60% 50%, #0d1e38 0%, #050a12 100%)",
				overflow: "hidden",
				borderLeft: "1px solid rgba(74, 105, 189, 0.3)",
			}}
		>
			<div
				style={{
					position: "absolute",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					width: "280px",
					height: "280px",
					border: "1px dashed rgba(74, 105, 189, 0.25)",
					borderRadius: "50%",
					pointerEvents: "none",
				}}
			/>

			{/* HUD Overlays */}
			<div style={{ position: "absolute", top: 12, left: 16, pointerEvents: "none", zIndex: 10 }}>
				<div style={{ fontSize: "12px", fontWeight: "bold", letterSpacing: "1px", color: "#82ccdd" }}>
					BIOMETRIA MARINHA 3D
				</div>
				<div style={{ fontSize: "10px", color: "#3b5998", marginTop: "2px" }}>
					TARGET: NEURON-SHARK // {speaking ? "FALANDO [VOICE_ON]" : "STANDBY"}
				</div>
			</div>

			<div style={{ position: "absolute", bottom: 12, left: 16, pointerEvents: "none", zIndex: 10 }}>
				<div style={{ fontSize: "10px", color: "#82ccdd" }}>
					COORD: X={coords.x} | Y={coords.y}
				</div>
			</div>

			<canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
		</div>
	);
}
