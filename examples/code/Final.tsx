// Итоговый монтаж по выбору автора (монтажный стол, 30.09). Номера = сцены стола.
// 1 чат (V3) · 2 сайт-маркер (V1) · 3 мем meat proxy (V1) · 4 робот и труба (V2, внизу, на фоне сцены 3)
// 5 только сайт · 6–7 чат с боссом (V2) → разворачивается простыня → падает мем с обезьянкой
// 8 голосовое (V3) · 9 секундомер (V1) · 10 Дрейк (V1, тексты наоборот — ирония) · 11 сайт + адрес (V1)
import React from 'react';
import {Easing, Img, staticFile} from 'remotion';
import {Avatar, Base, Bottom, Bubble, C, ChatBg, ChatHeader, MONO, MemeTop, SLOP, SiteVideo, lerp, pop, prog, range, useT} from './lib';
import {Reaction, Wave} from './chat3';
import {Colleague, Meat, Paper, Robot} from './chars2';

const MEME_BG = '#F4EFE8'; // фон сцены 3, его же держит сцена 4
const abs = (x: number, y: number, extra?: React.CSSProperties): React.CSSProperties => ({position: 'absolute', left: x, top: y, ...extra});
const bump = (t: number, at: number, w = 0.14) => Math.max(0, 1 - Math.abs(t - at) / w);
const bob = (t: number, speed = 3, amp = 6, ph = 0) => Math.sin(t * speed + ph) * amp;
const VIEW = 1108 - 132;

// 1. Рабочий чат: Вася переслал простыню, грустных реакций больше и крупнее
const SadReaction: React.FC<{at: number; emoji: string; n: number}> = ({at, emoji, n}) => {
	const t = useT();
	if (t < at) return null;
	const p = pop(t, at, 9);
	return (
		<div style={{display: 'inline-flex', alignItems: 'center', gap: 12, padding: '10px 24px', borderRadius: 50, background: '#fff', color: C.blue,
			fontSize: 64, fontWeight: 700, boxShadow: '0 4px 12px rgba(0,0,0,0.14)', transform: `scale(${lerp(0.3, 1, p)})`, opacity: Math.min(1, p * 2)}}>
			<span>{emoji}</span><span style={{fontSize: 40}}>{n}</span>
		</div>
	);
};
const S1: React.FC = () => {
	const t = useT();
	const y = lerp(VIEW, 40, prog(t, 0.05, 0.45)) - Math.max(0, t - 1.0) * 170;
	return (
		<Bottom from={0} to={4.4} enter="cut">
			<ChatBg>
				<ChatHeader title="Рабочий чат" sub="14 участников" />
				<div style={{position: 'relative', flex: 1, overflow: 'hidden'}}>
					<div style={{position: 'absolute', left: 30, top: y}}>
						<Bubble name="Вася" color="#E07A3F" fwd="ChatGPT" width={870}>
							<div style={{fontSize: 34, color: '#222'}}>{SLOP.repeat(3)}</div>
						</Bubble>
					</div>
					{/* плашка под реакциями, чтобы они не лежали на тексте */}
					<div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 170, background: `linear-gradient(to bottom, rgba(231,235,240,0), ${C.tg} 35%)`, opacity: prog(t, 1.8, 0.3)}} />
					<div style={{position: 'absolute', left: 40, right: 40, bottom: 34, display: 'flex', flexWrap: 'wrap', gap: 18}}>
						<SadReaction at={1.9} emoji="😞" n={4} />
						<SadReaction at={2.45} emoji="😩" n={6} />
						<SadReaction at={2.95} emoji="😐" n={3} />
						<SadReaction at={3.4} emoji="🥱" n={8} />
						<SadReaction at={3.85} emoji="😢" n={5} />
					</div>
				</div>
			</ChatBg>
		</Bottom>
	);
};

// 2. Сайт: наезд на заголовок и жёлтый маркер
const S2: React.FC = () => {
	const t = useT();
	const z = lerp(1, 1.35, prog(t, 4.4, 0.7, Easing.inOut(Easing.cubic)));
	const hl = prog(t, 5.35, 0.55, Easing.inOut(Easing.quad));
	return (
		<Bottom from={4.4} to={6.4} enter="cut">
			<div style={{position: 'absolute', inset: 0, transformOrigin: '40px 168px', transform: `scale(${z})`}}>
				<SiteVideo />
				<div style={{position: 'absolute', left: 30, top: 132, height: 70, width: 675 * hl, background: C.yellow, mixBlendMode: 'multiply'}} />
			</div>
		</Bottom>
	);
};

// 3. Мем «Don't be a meat proxy» — без подписи и штампов, медленный наезд всей карточки
const S3: React.FC = () => {
	const t = useT();
	const z = lerp(1, 1.05, prog(t, 6.4, 4.6, Easing.linear));
	return (
		<Bottom from={6.4} to={11.0} bg={MEME_BG}>
			<Img src={staticFile('memes/dont-be-meat-proxy.png')} style={abs(40, 177, {width: 1000, height: 754, borderRadius: 24, transform: `scale(${z})`})} />
		</Bottom>
	);
};

// 4. Робот → мясной прокси (становится трубой) → коллега; листы летят насквозь. Без текста, внизу кадра.
const S4: React.FC = () => {
	const t = useT();
	const ghost = prog(t, 12.2, 0.6, Easing.inOut(Easing.cubic));
	const pipe = prog(t, 12.2, 0.5);
	const Y = 330; // вертикальный сдвиг сцены в нижней зоне
	return (
		<Bottom from={11.0} to={15.5} bg={MEME_BG} enter="cut">
			<div style={abs(250, Y + 125, {width: 600 * pipe, height: 120, borderRadius: 60, background: 'rgba(74,99,200,0.10)', border: `6px solid ${C.blue}`})} />
			<Robot w={260} mouth={bump(t % 0.35, 0.1, 0.1)} style={abs(10, Y + bob(t, 4, 5))} />
			<Meat w={340} eyes="sleep" ghost={ghost} arm={ghost > 0.5 ? 0 : bump(t % 0.45, 0.2, 0.16)} style={abs(370, Y - 12 + bob(t, 3, 4))} />
			<Colleague w={240} mood="worried" sweat style={abs(830, Y + 30 + bob(t, 5, 3, 2))} />
			{range(8).map((k) => {
				if (t < 11.25) return null;
				const x = 230 + ((t - 11) * 620 + k * 90) % 640;
				const y = Y + 185 - Math.sin(((x - 230) / 640) * Math.PI) * (1 - ghost) * 220;
				return <Paper key={k} w={82} style={abs(x - 41, y - 52, {transform: `rotate(${(x * 1.2) % 360}deg)`})} />;
			})}
		</Bottom>
	);
};

// 6–7. Чат: босс присылает «гляньте, что ChatGPT пишет» → простыня разворачивается на весь низ →
// сверху падает мем с обезьянкой (меньше, повёрнут на 5°)
const UNROLL = 28.85;
const MONKEY = 29.4;
const S6: React.FC = () => {
	const t = useT();
	const u = prog(t, UNROLL, 0.55, Easing.out(Easing.cubic));
	const fall = pop(t, MONKEY, 12);
	return (
		<Bottom from={22.5} to={35.1}>
			<ChatBg>
				<ChatHeader title="Рабочий чат" sub={t > 26.5 && t < UNROLL ? 'Босс печатает…' : '5 участников'} color={C.red} />
				<div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 26, padding: '0 30px 40px'}}>
					<Bubble name="Серёжа" color={C.green} width={560} time="10:31">Всем доброе утро!</Bubble>
					<Bubble name="Аня" color={C.blue} width={560} time="10:33">Созвон в 12 в силе?</Bubble>
					{t > 26.55 && <div style={{opacity: prog(t, 26.55, 0.2), transform: `translateY(${(1 - prog(t, 26.55, 0.25)) * 40}px)`}}>
						<Bubble name="Босс" color={C.red} width={800} time="10:42">Коллеги, гляньте, что ChatGPT пишет про нашу стратегию 👇</Bubble>
					</div>}
				</div>
			</ChatBg>
			{/* простыня: лист раскрывается из сообщения босса и бесконечно прокручивается крупным текстом */}
			{t > UNROLL && (
				<div style={{position: 'absolute', left: lerp(130, 0, u), right: lerp(70, 0, u), top: lerp(760, 0, u), bottom: lerp(150, 0, u), background: '#fff',
					borderRadius: lerp(30, 0, u), overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.2)'}}>
					<div style={{position: 'absolute', left: 50, right: 50, top: 120 - Math.max(0, t - UNROLL - 0.3) * 150, fontSize: 60, fontWeight: 600, lineHeight: 1.3, color: '#222'}}>{SLOP.repeat(4)}</div>
					<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 104, background: '#fff', borderBottom: `2px solid ${C.line}`, display: 'flex', alignItems: 'center', padding: '0 50px'}}>
						<div style={{fontSize: 32, fontWeight: 700, color: C.blue, borderLeft: `5px solid ${C.blue}`, paddingLeft: 16}}>Переслано от ChatGPT · 12 страниц</div>
					</div>
				</div>
			)}
			{/* мем падает сверху поверх простыни */}
			{t > MONKEY && (
				<div style={{position: 'absolute', left: 150, top: lerp(-760, 250, Math.min(1.04, fall)), width: 780, background: '#fff', borderRadius: 18, overflow: 'hidden',
					boxShadow: '0 28px 60px rgba(0,0,0,0.35)', transform: `rotate(${lerp(-18, -5, Math.min(1, fall))}deg)`}}>
					<MemeTop text="Когда босс скинул в чат 12 страниц из ChatGPT" size={44} />
					<div style={{height: 780 * 488 / 900, overflow: 'hidden', position: 'relative'}}>
						<Img src={staticFile('memes/monkey-puppet.jpg')} style={{position: 'absolute', width: 780 * 923 / 900, left: -10 * 780 / 900, top: -280 * 780 / 900}} />
					</div>
				</div>
			)}
		</Bottom>
	);
};

// 8. Голосовое 12:47 «Мне сегодня приснилось…» (без штампа)
const S8: React.FC = () => {
	const t = useT();
	const v = prog(t, 36.05, 0.35);
	const el = Math.max(0, Math.floor(t - 36.3));
	return (
		<Bottom from={35.1} to={40.9}>
			<ChatBg>
				<ChatHeader title="Серёжа" sub={t > 36.05 ? 'записывает голосовое…' : 'в сети'} color="#3FA7C9" />
				<div style={{position: 'relative', flex: 1, overflow: 'hidden', padding: '40px 30px'}}>
					<Bubble name="Серёжа" color="#3FA7C9" width={700} time="08:14">Мне сегодня приснилось…</Bubble>
					{t > 36.05 && (
						<div style={{marginTop: 26, opacity: v, transform: `translateY(${(1 - v) * 60}px)`}}>
							<div style={{display: 'flex', gap: 20, alignItems: 'flex-end'}}>
								<Avatar name="С" color="#3FA7C9" size={78} />
								<div style={{background: '#fff', borderRadius: '30px 30px 30px 8px', padding: '26px 30px 18px', width: 880}}>
									<div style={{display: 'flex', alignItems: 'center', gap: 24}}>
										<div style={{width: 110, height: 110, borderRadius: '50%', background: C.blue, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 50, paddingLeft: 8}}>▶</div>
										<Wave progress={(t - 36.3) / 60} />
									</div>
									<div style={{display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 34, color: C.grey}}>
										<span style={{fontFamily: MONO}}>0:{String(el).padStart(2, '0')} / <b style={{color: C.red}}>12:47</b></span><span>08:15</span>
									</div>
								</div>
							</div>
							<div style={{display: 'flex', gap: 16, marginLeft: 100, marginTop: 20}}>
								<Reaction at={39.55} emoji="😴" n={6} />
								<Reaction at={40.05} emoji="🫠" n={4} />
								<Reaction at={40.45} emoji="💀" n={3} />
							</div>
						</div>
					)}
				</div>
			</ChatBg>
		</Bottom>
	);
};

// 9. Секундомер: только часы и таймер 0:00 — подписи дублировали бы голос
const S9: React.FC = () => {
	const t = useT();
	const jitter = Math.sin(t * 18) > 0.6 ? 6 : 0; // стрелка дёргается и возвращается
	return (
		<Bottom from={40.9} to={50.4} bg={C.ink}>
			<svg width={560} height={600} viewBox="0 0 560 600" style={{position: 'absolute', left: 260, top: 110}}>
				<rect x={250} y={10} width={60} height={46} rx={10} fill="#fff" />
				<circle cx={280} cy={330} r={250} fill="none" stroke="#fff" strokeWidth={22} />
				{range(12).map((i) => {
					const a = (i / 12) * Math.PI * 2;
					return <line key={i} x1={280 + Math.sin(a) * 205} y1={330 - Math.cos(a) * 205} x2={280 + Math.sin(a) * 228} y2={330 - Math.cos(a) * 228} stroke="#fff" strokeWidth={10} strokeLinecap="round" />;
				})}
				<line x1={280} y1={330} x2={280} y2={130} stroke={C.red} strokeWidth={14} strokeLinecap="round" transform={`rotate(${jitter} 280 330)`} />
				<circle cx={280} cy={330} r={20} fill={C.red} />
			</svg>
			<div style={{position: 'absolute', left: 0, right: 0, top: 760, textAlign: 'center', color: '#fff', fontFamily: MONO, fontWeight: 700, fontSize: 150}}>0:00</div>
		</Bottom>
	);
};

// 10. Дрейк с иронией: картинки как в оригинале (сверху отворачивается, снизу одобряет),
// а тексты наоборот: сверху «как надо», снизу «переслать портянку». Сначала верх, потом низ.
const BOTTOM_ROW = 55.8;
const S10: React.FC = () => {
	const t = useT();
	const items: [string, number][] = [['summary в три строки', 53.45], ['абзац: зачем это читать', 54.35], ['ссылка на чат', 58.0]];
	const reveal = prog(t, BOTTOM_ROW, 0.3);
	const panel = (row: 0 | 1) => (
		<div style={{position: 'absolute', left: 0, width: 520, top: 0, height: 554, overflow: 'hidden'}}>
			<Img src={staticFile('memes/drake.jpg')} style={{position: 'absolute', left: -46, top: row === 1 ? -554 : 0, width: 1108, height: 1108}} />
		</div>
	);
	return (
		<Bottom from={50.4} to={59.9} bg="#fff">
			{/* верх: Дрейк отворачивается — от «как надо» */}
			<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 554}}>
				{panel(0)}
				<div style={{position: 'absolute', left: 520, right: 0, top: 0, bottom: 0, padding: '70px 40px 0'}}>
					{items.map(([s, a]) => {
						const p = pop(t, a, 12);
						return (
							<div key={s} style={{display: 'flex', gap: 18, alignItems: 'flex-start', marginBottom: 34, opacity: Math.min(1, p * 2), transform: `translateX(${(1 - p) * 40}px)`}}>
								<div style={{fontSize: 52, color: C.green, fontWeight: 900, lineHeight: 1}}>✓</div>
								<div style={{fontSize: 50, fontWeight: 800, lineHeight: 1.08}}>{s}</div>
							</div>
						);
					})}
				</div>
			</div>
			{/* низ: Дрейк одобряет — портянку; появляется после верха */}
			<div style={{position: 'absolute', left: 0, right: 0, top: 554, height: 554, opacity: reveal, transform: `translateY(${(1 - reveal) * 40}px)`}}>
				{panel(1)}
				<div style={{position: 'absolute', left: 520, right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', padding: '0 40px'}}>
					<div style={{fontSize: 60, fontWeight: 800, lineHeight: 1.1}}>Переслать портянку как есть</div>
				</div>
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: 552, height: 4, background: '#eee'}} />
		</Bottom>
	);
};

// 11. Сайт до конца + плашка адреса
const S11: React.FC = () => {
	const t = useT();
	if (t < 61.2) return null;
	const p = pop(t, 61.2, 13);
	return (
		<div style={{position: 'absolute', right: 36, bottom: 60, background: C.ink, color: '#fff', fontFamily: MONO, fontWeight: 700, fontSize: 40,
			padding: '18px 30px', borderRadius: 60, transform: `scale(${lerp(0.5, 1, p)})`, opacity: Math.min(1, p * 2), boxShadow: '0 10px 30px rgba(0,0,0,0.25)'}}>
			slovo.soloveev.com
		</div>
	);
};

// 5 — «только сайт»: сцены нет, виден скринкаст из Base
export const Final: React.FC = () => (
	<Base bottom={<><S1 /><S2 /><S3 /><S4 /><S6 /><S8 /><S9 /><S10 /><S11 /></>} />
);
