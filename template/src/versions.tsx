// Версии ролика для монтажного стола и сборки Mix. V0 — «только сайт/скринкаст» без анимаций, дальше — варианты.
// Каждая версия — полный ролик на Base; сцены — <Bottom>/<Full> с глобальным временем (см. pipeline.md).
import React from 'react';
import {Base} from './lib';

export const V0: React.FC = () => <Base />;
// export const V1 = ... (например, «Мемы»), V2 («Схема»), V3 («Чат»)

export const VERSIONS: React.FC[] = [V0];
