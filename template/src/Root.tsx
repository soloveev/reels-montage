import React from 'react';
import {Composition} from 'remotion';
import {DURATION, FPS} from './lib';
import {VERSIONS} from './versions';
import {Mix} from './Mix';
import project from './project.json';

const frames = Math.round(DURATION * FPS);

export const Root: React.FC = () => (
	<>
		{VERSIONS.map((V, i) => (
			<Composition key={i} id={`V${i}`} component={V} durationInFrames={frames} fps={FPS} width={1080} height={1920} />
		))}
		<Composition id="Mix" component={Mix} durationInFrames={frames} fps={FPS} width={1080} height={1920}
			defaultProps={{choices: Array(project.rows.length).fill(null)}} />
		{/* финал по выбору автора — отдельный Final.tsx, вставки — I*.tsx со своими duration */}
	</>
);
