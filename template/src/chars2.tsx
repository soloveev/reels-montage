// Персонажи и значки для ролика 2 «Анимированная схема».
// Стиль — как в меме «Don't be a meat proxy»: толстый чёрный контур, плоская заливка.
import React from 'react';
import {C} from './lib';

const K = '#111';
const SW = 6;

/** Робот-ИИ. blink — 0..1 (1 = глаза закрыты), glow — свечение экрана. */
export const Robot: React.FC<{w?: number; blink?: number; mouth?: number; style?: React.CSSProperties}> = ({w = 240, blink = 0, mouth = 0, style}) => (
	<svg width={w} height={w * 1.15} viewBox="0 0 200 230" style={{overflow: 'visible', ...style}}>
		<line x1={100} y1={38} x2={100} y2={12} stroke={K} strokeWidth={SW} />
		<circle cx={100} cy={10} r={10} fill={C.red} stroke={K} strokeWidth={SW - 1} />
		<rect x={22} y={38} width={156} height={118} rx={30} fill="#B9C3D0" stroke={K} strokeWidth={SW} />
		<rect x={40} y={56} width={120} height={80} rx={18} fill="#1E2733" stroke={K} strokeWidth={SW - 2} />
		<rect x={62} y={78 + blink * 12} width={20} height={Math.max(3, 26 * (1 - blink))} rx={8} fill="#5EE6FF" />
		<rect x={118} y={78 + blink * 12} width={20} height={Math.max(3, 26 * (1 - blink))} rx={8} fill="#5EE6FF" />
		<path d={`M 78 ${118} Q 100 ${118 + 8 + mouth * 8} 122 118`} stroke="#5EE6FF" strokeWidth={5} fill="none" strokeLinecap="round" />
		<rect x={8} y={82} width={14} height={34} rx={6} fill="#8E99A8" stroke={K} strokeWidth={SW - 2} />
		<rect x={178} y={82} width={14} height={34} rx={6} fill="#8E99A8" stroke={K} strokeWidth={SW - 2} />
		<rect x={52} y={156} width={96} height={66} rx={16} fill="#B9C3D0" stroke={K} strokeWidth={SW} />
		<circle cx={100} cy={189} r={11} fill={C.yellow} stroke={K} strokeWidth={SW - 2} />
	</svg>
);

/** Мясной человечек. eyes: 'dots' | 'sleep' ; arm — угол руки (0 — опущена, 1 — поднята); ghost — 0..1 прозрачность тела. */
export const Meat: React.FC<{w?: number; eyes?: 'dots' | 'sleep' | 'talk'; arm?: number; ghost?: number; mouth?: number; style?: React.CSSProperties}> = ({w = 260, eyes = 'dots', arm = 0, ghost = 0, mouth = 0, style}) => (
	<svg width={w} height={w * 1.08} viewBox="0 0 240 260" style={{overflow: 'visible', ...style}}>
		{/* рука за телом (левая) */}
		<path d="M 58 170 Q 20 190 30 225" stroke={K} strokeWidth={SW} fill="none" strokeLinecap="round" />
		<path d="M 30 250 C 10 170 30 60 125 44 C 215 60 235 170 212 250 Z" fill={C.meat} fillOpacity={1 - ghost * 0.75} stroke={K} strokeWidth={SW} strokeDasharray={ghost > 0.5 ? '14 10' : undefined} />
		{eyes === 'dots' && <>
			<circle cx={100} cy={128} r={7} fill={K} /><circle cx={148} cy={128} r={7} fill={K} />
		</>}
		{eyes === 'sleep' && <>
			<path d="M 88 130 Q 100 138 112 130" stroke={K} strokeWidth={5} fill="none" strokeLinecap="round" />
			<path d="M 136 130 Q 148 138 160 130" stroke={K} strokeWidth={5} fill="none" strokeLinecap="round" />
		</>}
		{eyes === 'talk' && <>
			<circle cx={100} cy={124} r={7} fill={K} /><circle cx={148} cy={124} r={7} fill={K} />
		</>}
		{eyes === 'talk'
			? <ellipse cx={124} cy={158} rx={14} ry={4 + mouth * 10} fill={K} />
			: <line x1={112} y1={160} x2={138} y2={160} stroke={K} strokeWidth={5} strokeLinecap="round" />}
		{/* рабочая рука (правая), вращается в плече */}
		<g transform={`rotate(${-arm * 110} 196 150)`}>
			<path d="M 196 150 Q 236 175 232 222" stroke={K} strokeWidth={SW} fill="none" strokeLinecap="round" />
			<circle cx={232} cy={226} r={12} fill={C.meat} stroke={K} strokeWidth={SW - 1} />
		</g>
	</svg>
);

/** Коллега. mood: worried | happy | sleep | dizzy. sweat — капля пота. */
export const Colleague: React.FC<{w?: number; mood?: 'worried' | 'happy' | 'sleep' | 'dizzy'; sweat?: boolean; spin?: number; style?: React.CSSProperties}> = ({w = 220, mood = 'worried', sweat = false, spin = 0, style}) => {
	const spiral = (cx: number) => (
		<g transform={`rotate(${spin} ${cx} 92)`}>
			<path d={`M ${cx} 92 m -2 0 a 2 2 0 1 1 4 0 a 5 5 0 1 1 -10 0 a 9 9 0 1 1 18 0 a 13 13 0 1 1 -26 0`} stroke={K} strokeWidth={3.5} fill="none" />
		</g>
	);
	return (
		<svg width={w} height={w * 1.3} viewBox="0 0 200 260" style={{overflow: 'visible', ...style}}>
			<path d="M 36 258 C 36 190 58 160 100 160 C 142 160 164 190 164 258 Z" fill={C.beige} stroke={K} strokeWidth={SW} />
			<circle cx={100} cy={92} r={62} fill={C.beige} stroke={K} strokeWidth={SW} />
			{mood === 'worried' && <>
				<path d="M 66 70 L 88 62" stroke={K} strokeWidth={5} strokeLinecap="round" />
				<path d="M 134 70 L 112 62" stroke={K} strokeWidth={5} strokeLinecap="round" />
				<circle cx={80} cy={90} r={6} fill={K} /><circle cx={120} cy={90} r={6} fill={K} />
				<path d="M 78 124 q 7 -8 14 0 q 7 8 14 0 q 7 -8 14 0" stroke={K} strokeWidth={5} fill="none" strokeLinecap="round" />
			</>}
			{mood === 'happy' && <>
				<path d="M 70 92 Q 80 80 90 92" stroke={K} strokeWidth={5} fill="none" strokeLinecap="round" />
				<path d="M 110 92 Q 120 80 130 92" stroke={K} strokeWidth={5} fill="none" strokeLinecap="round" />
				<path d="M 74 114 Q 100 142 126 114 Z" fill={K} />
				<circle cx={66} cy={112} r={9} fill="#F2A08F" opacity={0.7} /><circle cx={134} cy={112} r={9} fill="#F2A08F" opacity={0.7} />
			</>}
			{mood === 'sleep' && <>
				<path d="M 68 92 Q 80 100 92 92" stroke={K} strokeWidth={5} fill="none" strokeLinecap="round" />
				<path d="M 108 92 Q 120 100 132 92" stroke={K} strokeWidth={5} fill="none" strokeLinecap="round" />
				<ellipse cx={100} cy={124} rx={9} ry={11} fill={K} />
			</>}
			{mood === 'dizzy' && <>
				{spiral(80)}{spiral(120)}
				<path d="M 80 126 q 10 -8 20 0 q 10 8 20 0" stroke={K} strokeWidth={5} fill="none" strokeLinecap="round" />
			</>}
			{sweat && <path d="M 160 50 q 10 18 0 26 q -10 -8 0 -26 Z" fill="#7CC7F2" stroke={K} strokeWidth={3} />}
		</svg>
	);
};

/** Лист бумаги со строками. */
export const Paper: React.FC<{w?: number; style?: React.CSSProperties}> = ({w = 90, style}) => (
	<svg width={w} height={w * 1.3} viewBox="0 0 100 130" style={{overflow: 'visible', ...style}}>
		<rect x={4} y={4} width={92} height={122} rx={6} fill="#fff" stroke={K} strokeWidth={5} />
		{[26, 42, 58, 74, 90, 106].map((y, i) => <line key={y} x1={18} y1={y} x2={i % 3 === 2 ? 60 : 82} y2={y} stroke="#9a9a9a" strokeWidth={5} strokeLinecap="round" />)}
	</svg>
);

/** Стейк. */
export const Steak: React.FC<{w?: number; style?: React.CSSProperties}> = ({w = 200, style}) => (
	<svg width={w} height={w * 0.8} viewBox="0 0 200 160" style={{overflow: 'visible', ...style}}>
		<path d="M 30 70 C 20 20 120 0 170 40 C 205 70 185 140 120 145 C 60 150 40 120 30 70 Z" fill="#D9534F" stroke={K} strokeWidth={SW} />
		<path d="M 52 72 C 50 40 118 26 152 52 C 175 72 160 118 118 122 C 76 126 56 104 52 72 Z" fill="#F08A80" />
		<path d="M 80 60 Q 110 80 140 70 M 75 95 Q 110 105 135 98" stroke="#fff" strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.85} />
		<circle cx={150} cy={96} r={14} fill="#fff" stroke={K} strokeWidth={4} />
	</svg>
);

/** Сервер/прокси. blink — фаза мигания лампочек. */
export const Server: React.FC<{w?: number; blink?: number; style?: React.CSSProperties}> = ({w = 180, blink = 0, style}) => (
	<svg width={w} height={w * 1.05} viewBox="0 0 180 190" style={{overflow: 'visible', ...style}}>
		{[10, 70, 130].map((y, i) => (
			<g key={y}>
				<rect x={10} y={y} width={160} height={50} rx={10} fill="#3B4A63" stroke={K} strokeWidth={SW} />
				<circle cx={40} cy={y + 25} r={8} fill={(Math.floor(blink * 3) + i) % 3 === 0 ? '#5EF08A' : '#2C7A47'} />
				<circle cx={66} cy={y + 25} r={8} fill={(Math.floor(blink * 3) + i) % 3 === 1 ? C.yellow : '#8A7A2C'} />
				<line x1={96} y1={y + 25} x2={150} y2={y + 25} stroke="#9FB0CC" strokeWidth={6} strokeLinecap="round" />
			</g>
		))}
	</svg>
);

/** Граната с надписью SLOP. */
export const Grenade: React.FC<{w?: number; pin?: number; style?: React.CSSProperties}> = ({w = 200, pin = 0, style}) => (
	<svg width={w} height={w * 1.25} viewBox="0 0 200 250" style={{overflow: 'visible', ...style}}>
		<rect x={78} y={30} width={44} height={36} rx={6} fill="#6B7280" stroke={K} strokeWidth={SW} />
		<path d="M 122 44 L 160 30 L 160 70" stroke={K} strokeWidth={SW} fill="none" strokeLinecap="round" />
		<g transform={`translate(${pin * 60} ${-pin * 70}) rotate(${pin * 40} 70 30)`}>
			<circle cx={62} cy={30} r={18} fill="none" stroke={C.yellow} strokeWidth={7} />
		</g>
		<ellipse cx={100} cy={156} rx={78} ry={90} fill="#4E7A3A" stroke={K} strokeWidth={SW} />
		<path d="M 30 130 H 170 M 26 175 H 174 M 70 72 V 240 M 130 72 V 240" stroke="#34552A" strokeWidth={5} opacity={0.7} />
		<rect x={36} y={134} width={128} height={48} rx={10} fill={C.yellow} stroke={K} strokeWidth={5} />
		<text x={100} y={172} textAnchor="middle" fontFamily="Arial Black, Arial" fontWeight={900} fontSize={38} fill={K}>SLOP</text>
	</svg>
);
