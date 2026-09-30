// Сборка по выбору с монтажного стола: в каждой сцене показывается выбранная версия (null → V0).
// Границы сцен — project.json → rows (те же, что в стол/scenes.json).
import React from 'react';
import {Audio, staticFile} from 'remotion';
import {AudioOff, useT} from './lib';
import {VERSIONS} from './versions';
import project from './project.json';

export type MixProps = {choices: (number | null)[]};

export const Mix: React.FC<MixProps> = ({choices}) => {
	const t = useT();
	const rows: number[] = project.rows;
	let i = rows.length - 1;
	while (i > 0 && t < rows[i]) i--;
	const Comp = VERSIONS[choices[i] ?? 0] ?? VERSIONS[0];
	return (
		<>
			<Audio src={staticFile('voice.m4a')} />
			<AudioOff.Provider value={true}><Comp /></AudioOff.Provider>
		</>
	);
};
