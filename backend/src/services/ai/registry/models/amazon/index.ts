// backend/src/services/ai/registry/models/amazon/index.ts
// Standards: docs/STANDARDS.md

/**
 * Amazon Models Registry - Agregador
 * 
 * Este arquivo agrega todos os modelos Amazon de diferentes famílias:
 * - Titan: Modelos Titan Text (Express, Lite, Premier, TG1)
 * - Nova 2.x: Nova geração (Lite, Micro, Pro, Sonic)
 * - Nova 1.x Premier: Linha premium com inference profile
 * - Nova 1.x Core: Linha core (Pro, Lite, Micro, Sonic)
 * 
 * Total: 25 modelos Amazon
 */

import { ModelRegistry } from '../../model-registry';
import { titanModels } from './titan.models';
import { nova2Models } from './nova-2.models';
import { novaPremierModels } from './nova-1-premier.models';
import { novaCoreModels } from './nova-1-core.models';

/**
 * Agregação de todos os modelos Amazon
 */
export const amazonModels = [
  ...titanModels,        // 4 modelos
  ...nova2Models,        // 5 modelos
  ...novaPremierModels,  // 5 modelos
  ...novaCoreModels,     // 11 modelos
];

/**
 * Auto-registro no ModelRegistry
 * Executado automaticamente quando este módulo é importado
 */
ModelRegistry.registerMany(amazonModels);

/**
 * Re-exports individuais para acesso granular (opcional)
 */
export { titanModels, nova2Models, novaPremierModels, novaCoreModels };
