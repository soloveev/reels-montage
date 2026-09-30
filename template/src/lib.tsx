// Общая раскладка и примитивы монтажа рилса (шаблон скилла reels-montage).
// Кадр 1080×1920: камера сверху (0–811), нижняя зона 1080×1108 (812–1919).
// Время везде в секундах от начала ролика: сцены не оборачиваются в <Sequence>,
// поэтому useT() внутри любой сцены — глобальное время.
import React, {createContext, useContext} from 'react';
import {AbsoluteFill, Audio, Easing, Img, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont as loadGolos} from '@remotion/google-fonts/GolosText';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';
import {loadFont as loadCaveat} from '@remotion/google-fonts/Caveat';

export const GOLOS = loadGolos('normal', {weights: ['400', '500', '700', '800', '900'], subsets: ['cyrillic', 'latin']}).fontFamily;
export const MONO = loadMono('normal', {weights: ['400', '700'], subsets: ['cyrillic', 'latin']}).fontFamily;
export const HAND = loadCaveat('normal', {weights: ['700'], subsets: ['cyrillic', 'latin']}).fontFamily;

export const FPS = 30000 / 1001;
import project from './project.json';
export const DURATION: number = project.duration; // длительность ролика без визитки, секунды
export const W = 1080;
export const CAM_H = 812;
export const BOT_H = 1108;

export const C = {
	paper: '#F7F6F4', ink: '#111111', grey: '#8A8784', line: '#DAD7D2',
	yellow: '#FFD84A', blue: '#4A63C8', red: '#E5484D', green: '#2FA46B',
	meat: '#EFA59B', meatDark: '#D9817A', beige: '#EBCFA9', tg: '#E7EBF0',
};

// ---------- время ----------
export const useT = () => useCurrentFrame() / useVideoConfig().fps;
const clamp = (x: number) => Math.min(1, Math.max(0, x));
/** 0→1 за dur секунд начиная с a */
export const prog = (t: number, a: number, dur = 0.35, ease = Easing.out(Easing.cubic)) => ease(clamp((t - a) / dur));
/** упругое появление 0→1 (с перелётом) */
export const pop = (t: number, a: number, damping = 11) =>
	t < a ? 0 : spring({frame: (t - a) * FPS, fps: FPS, config: {damping, stiffness: 170, mass: 0.7}});
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const range = (n: number) => Array.from({length: n}, (_, i) => i);

// ---------- раскладка ----------
const SceneCtx = createContext<{from: number; to: number}>({from: 0, to: DURATION});
export const useScene = () => useContext(SceneCtx);

type Enter = 'cut' | 'pop' | 'slide' | 'wipe';

/** Сцена нижней зоны: 1080×1108, рендерится только в [from, to). */
export const Bottom: React.FC<{from: number; to: number; bg?: string; enter?: Enter; children: React.ReactNode}> = ({from, to, bg, enter = 'slide', children}) => {
	const t = useT();
	if (t < from || t >= to) return null;
	const p = prog(t, from, 0.28);
	const style: React.CSSProperties = {position: 'absolute', inset: 0, overflow: 'hidden', background: bg};
	if (enter === 'slide') Object.assign(style, {transform: `translateY(${(1 - p) * 70}px)`, opacity: clamp((t - from) / 0.12)});
	if (enter === 'pop') Object.assign(style, {transform: `scale(${lerp(0.9, 1, pop(t, from, 13))})`, opacity: clamp((t - from) / 0.1)});
	if (enter === 'wipe') Object.assign(style, {clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`});
	return <SceneCtx.Provider value={{from, to}}><div style={style}>{children}</div></SceneCtx.Provider>;
};

/** Сцена во весь кадр: раскрывается из нижней зоны вверх и уходит обратно. */
export const Full: React.FC<{from: number; to: number; bg?: string; children: React.ReactNode}> = ({from, to, bg = C.ink, children}) => {
	const t = useT();
	if (t < from || t >= to) return null;
	const pin = prog(t, from, 0.4, Easing.inOut(Easing.cubic));
	const pout = prog(t, to - 0.35, 0.35, Easing.inOut(Easing.cubic));
	const top = CAM_H * (1 - pin) + CAM_H * pout;
	return (
		<SceneCtx.Provider value={{from, to}}>
			<AbsoluteFill style={{clipPath: `inset(${top}px 0 0 0)`, background: bg, overflow: 'hidden'}}>{children}</AbsoluteFill>
		</SceneCtx.Provider>
	);
};

/** Mix кладёт один общий звук сам и выключает звук у версий, которые переключает. */
export const AudioOff = createContext(false);

/** Основа ролика: камера, скринкаст сайта в нижней зоне, звук.
 *  Для вставок: camera=null — без камеры (сцена во весь кадр), site=false — без скринкаста, audio — свой звук. */
export const Base: React.FC<{bottom?: React.ReactNode; full?: React.ReactNode; camera?: string | null; audio?: string; site?: boolean; bg?: string}> = ({bottom, full, camera = 'camera.mp4', audio = 'voice.m4a', site = true, bg = C.paper}) => (
	<AbsoluteFill style={{background: bg, fontFamily: GOLOS}}>
		{!useContext(AudioOff) && <Audio src={staticFile(audio)} />}
		{camera && <OffthreadVideo src={staticFile(camera)} muted style={{position: 'absolute', left: 0, top: 0, width: W, height: CAM_H}} />}
		<div style={{position: 'absolute', left: 0, top: CAM_H, width: W, height: BOT_H, overflow: 'hidden'}}>
			{site && <SiteVideo />}
			{bottom}
		</div>
		{full}
	</AbsoluteFill>
);

/** Скринкаст сайта (1080×1108), можно приблизить: zoom и точка (x, y) в координатах скринкаста. */
export const SiteVideo: React.FC<{zoom?: number; x?: number; y?: number}> = ({zoom = 1, x = 540, y = 554}) => (
	<OffthreadVideo src={staticFile('site.mp4')} muted style={{position: 'absolute', left: 0, top: 0, width: W, height: BOT_H,
		transformOrigin: `${x}px ${y}px`, transform: `scale(${zoom})`}} />
);

// ---------- примитивы ----------
/** Штамп: влетает крупно и «пришлёпывается». */
export const Stamp: React.FC<{at: number; text: string; x: number; y: number; rot?: number; color?: string; size?: number}> = ({at, text, x, y, rot = -8, color = C.red, size = 64}) => {
	const t = useT();
	if (t < at) return null;
	const p = prog(t, at, 0.18, Easing.in(Easing.quad));
	return (
		<div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${lerp(2.4, 1, p)})`, opacity: p,
			border: `8px solid ${color}`, color, borderRadius: 14, padding: '6px 26px', fontFamily: GOLOS, fontWeight: 900, fontSize: size,
			letterSpacing: '0.02em', textTransform: 'uppercase', whiteSpace: 'nowrap', background: 'rgba(255,255,255,0.82)'}}>{text}</div>
	);
};

/** Подпись-мем сверху картинки (современный формат: чёрный текст на белом). */
export const MemeTop: React.FC<{text: React.ReactNode; size?: number; at?: number}> = ({text, size = 52, at}) => {
	const t = useT();
	const {from} = useScene();
	const p = prog(t, at ?? from, 0.3);
	return (
		<div style={{background: '#fff', padding: '34px 44px 30px', fontFamily: GOLOS, fontWeight: 700, fontSize: size, lineHeight: 1.18,
			color: C.ink, opacity: p, transform: `translateY(${(1 - p) * -20}px)`}}>{text}</div>
	);
};

/** Картинка мема с медленным наездом. */
export const MemeImg: React.FC<{src: string; style?: React.CSSProperties; zoom?: [number, number]; origin?: string; pos?: string}> = ({src, style, zoom = [1, 1.06], origin = '50% 50%', pos = '50% 50%'}) => {
	const t = useT();
	const {from, to} = useScene();
	const z = lerp(zoom[0], zoom[1], clamp((t - from) / (to - from)));
	return (
		<div style={{overflow: 'hidden', position: 'relative', ...style}}>
			<Img src={staticFile(`memes/${src}`)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos, transform: `scale(${z})`, transformOrigin: origin}} />
		</div>
	);
};

/** Мем целиком: подпись сверху, картинка занимает остаток нижней зоны. */
export const Meme: React.FC<{caption: React.ReactNode; src: string; size?: number; zoom?: [number, number]; origin?: string; pos?: string; children?: React.ReactNode}> = ({caption, src, size, zoom, origin, pos, children}) => (
	<div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#fff'}}>
		<MemeTop text={caption} size={size} />
		<MemeImg src={src} zoom={zoom} origin={origin} pos={pos} style={{flex: 1}} />
		{children}
	</div>
);

/** Серые полоски вместо строк текста. */
export const Lines: React.FC<{n: number; w?: number; h?: number; gap?: number; color?: string; seed?: number}> = ({n, w = 900, h = 18, gap = 18, color = '#CFCBC5', seed = 1}) => (
	<div style={{display: 'flex', flexDirection: 'column', gap}}>
		{range(n).map((i) => {
			const r = Math.abs(Math.sin((i + 1) * 12.9898 * seed) * 43758.5453) % 1;
			const lw = i % 6 === 5 ? w * (0.35 + r * 0.3) : w * (0.78 + r * 0.22);
			return <div key={i} style={{width: lw, height: h, borderRadius: h / 2, background: color}} />;
		})}
	</div>
);

/** Текст, который «прошлёпывается» по словам начиная с at. */
export const Words: React.FC<{text: string; at: number; step?: number; style?: React.CSSProperties}> = ({text, at, step = 0.09, style}) => {
	const t = useT();
	return (
		<div style={style}>
			{text.split(' ').map((w, i) => {
				const p = pop(t, at + i * step, 12);
				return <span key={i} style={{display: 'inline-block', marginRight: '0.26em', transform: `translateY(${(1 - p) * 30}px) scale(${lerp(0.6, 1, p)})`, opacity: Math.min(1, p * 1.5)}}>{w}</span>;
			})}
		</div>
	);
};

/** Счётчик: число меняется во времени. */
export const useCount = (t: number, a: number, b: number, from: number, to: number) => Math.round(lerp(from, to, clamp((t - a) / (b - a))));

// ---------- чат ----------
export const Avatar: React.FC<{name: string; color: string; size?: number; emoji?: string}> = ({name, color, size = 84, emoji}) => (
	<div style={{width: size, height: size, borderRadius: '50%', background: color, color: '#fff', display: 'flex', alignItems: 'center',
		justifyContent: 'center', fontWeight: 800, fontSize: size * (emoji ? 0.52 : 0.42), flexShrink: 0}}>{emoji ?? name[0]}</div>
);

export const ChatHeader: React.FC<{title: string; sub: string; color?: string}> = ({title, sub, color = C.blue}) => (
	<div style={{height: 132, background: '#fff', borderBottom: `2px solid ${C.line}`, display: 'flex', alignItems: 'center', gap: 26, padding: '0 40px', flexShrink: 0}}>
		<div style={{fontSize: 56, color: C.grey}}>‹</div>
		<Avatar name={title} color={color} size={80} />
		<div>
			<div style={{fontSize: 42, fontWeight: 700}}>{title}</div>
			<div style={{fontSize: 30, color: C.grey}}>{sub}</div>
		</div>
	</div>
);

/** Пузырь сообщения. */
export const Bubble: React.FC<{name: string; color: string; children: React.ReactNode; fwd?: string; time?: string; width?: number; style?: React.CSSProperties}> = ({name, color, children, fwd, time = '10:42', width = 840, style}) => (
	<div style={{display: 'flex', gap: 20, alignItems: 'flex-end', ...style}}>
		<Avatar name={name} color={color} size={78} />
		<div style={{background: '#fff', borderRadius: '30px 30px 30px 8px', padding: '22px 30px 18px', width, boxShadow: '0 2px 0 rgba(0,0,0,0.06)'}}>
			<div style={{fontSize: 32, fontWeight: 700, color}}>{name}</div>
			{fwd && <div style={{fontSize: 28, color: C.blue, marginTop: 4, borderLeft: `4px solid ${C.blue}`, paddingLeft: 14}}>Переслано от <b>{fwd}</b></div>}
			<div style={{marginTop: 14, fontSize: 36, lineHeight: 1.3}}>{children}</div>
			<div style={{fontSize: 24, color: C.grey, textAlign: 'right', marginTop: 6}}>{time}</div>
		</div>
	</div>
);

/** Фон чата. */
export const ChatBg: React.FC<{children: React.ReactNode}> = ({children}) => (
	<div style={{position: 'absolute', inset: 0, background: C.tg, display: 'flex', flexDirection: 'column'}}>{children}</div>
);

/** Кусок «нейросетевой простыни»: настоящий текст мелко, серым. */
export const SLOP = 'Конечно! Вот подробный разбор вашего вопроса. Во-первых, важно отметить, что данная тема является многогранной и требует комплексного подхода. Рассмотрим ключевые аспекты: 1. Стратегическое видение — это фундамент, на котором строится синергия команды. 2. Операционная эффективность достигается за счёт оптимизации процессов и внедрения лучших практик. 3. Коммуникация между стейкхолдерами обеспечивает прозрачность и вовлечённость. Кроме того, стоит учитывать контекст рынка, динамику изменений и риски. В заключение можно сказать, что успех зависит от множества факторов, каждый из которых заслуживает отдельного внимания. Если хотите, я могу подготовить более детальный план, таблицу или презентацию. ';
