// Хелперы ролика 3: мессенджер, клавиши, наклейки.
import React from 'react';
import {C, GOLOS, MONO, lerp, pop, prog, range, useT} from './lib';

/** Три прыгающие точки «печатает…». */
export const Dots: React.FC<{color?: string; size?: number}> = ({color = C.grey, size = 14}) => {
	const t = useT();
	return (
		<span style={{display: 'inline-flex', gap: size * 0.5, alignItems: 'center', verticalAlign: 'middle'}}>
			{range(3).map((i) => (
				<span key={i} style={{width: size, height: size, borderRadius: '50%', background: color,
					transform: `translateY(${Math.sin(t * 9 - i * 0.9) * size * 0.35}px)`, opacity: 0.5 + 0.5 * Math.max(0, Math.sin(t * 9 - i * 0.9))}} />
			))}
		</span>
	);
};

/** Реакция-пилюля, выскакивает в момент at. */
export const Reaction: React.FC<{at: number; emoji: string; n?: number; mine?: boolean}> = ({at, emoji, n, mine}) => {
	const t = useT();
	if (t < at) return null;
	const p = pop(t, at, 9);
	return (
		<div style={{display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 20px', borderRadius: 40, fontSize: 40, fontWeight: 700,
			background: mine ? C.blue : '#fff', color: mine ? '#fff' : C.blue, boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
			transform: `scale(${lerp(0.3, 1, p)})`, opacity: Math.min(1, p * 2)}}>
			<span>{emoji}</span>{n !== undefined && <span style={{fontSize: 32}}>{n}</span>}
		</div>
	);
};

/** Исходящий пузырь (справа, зелёный). */
export const OutBubble: React.FC<{children: React.ReactNode; width?: number; style?: React.CSSProperties}> = ({children, width = 900, style}) => (
	<div style={{marginLeft: 'auto', width, background: '#E2F7D4', borderRadius: '30px 30px 8px 30px', padding: '24px 32px 16px', boxShadow: '0 2px 0 rgba(0,0,0,0.06)', ...style}}>
		{children}
		<div style={{fontSize: 24, color: '#5FA05A', textAlign: 'right', marginTop: 6}}>11:05 ✓✓</div>
	</div>
);

/** Клавиша, нажата при down=true. */
export const Key: React.FC<{label: string; w?: number; down: boolean}> = ({label, w = 150, down}) => (
	<div style={{width: w, height: 150, borderRadius: 26, background: down ? '#e9e9e9' : '#fff', border: '5px solid #111',
		boxShadow: down ? '0 3px 0 #111' : '0 16px 0 #111', transform: `translateY(${down ? 13 : 0}px)`, display: 'flex',
		alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontWeight: 700, fontSize: label.length > 2 ? 56 : 80, color: C.ink}}>{label}</div>
);

/** Жёлтая наклейка-подпись, влетает с поворотом. */
export const Sticker: React.FC<{at: number; until?: number; text: string; style?: React.CSSProperties; rot?: number}> = ({at, until = 1e9, text, style, rot = -3}) => {
	const t = useT();
	if (t < at || t >= until) return null;
	const p = pop(t, at, 11);
	const out = prog(t, until - 0.2, 0.2);
	return (
		<div style={{position: 'absolute', background: C.yellow, color: C.ink, fontFamily: GOLOS, fontWeight: 800, fontSize: 48, padding: '16px 30px',
			borderRadius: 18, border: '4px solid #111', boxShadow: '8px 8px 0 #111', whiteSpace: 'nowrap',
			transform: `rotate(${rot}deg) scale(${lerp(0.4, 1, p) * (1 - out)})`, opacity: Math.min(1, p * 2) * (1 - out), ...style}}>{text}</div>
	);
};

/** Волна голосового сообщения. */
export const Wave: React.FC<{progress: number; bars?: number}> = ({progress, bars = 42}) => (
	<div style={{display: 'flex', gap: 6, alignItems: 'center', height: 90}}>
		{range(bars).map((i) => {
			const h = 18 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)) * 70;
			return <div key={i} style={{width: 9, height: h, borderRadius: 5, background: i / bars < progress ? C.blue : '#B9C4D6'}} />;
		})}
	</div>
);
