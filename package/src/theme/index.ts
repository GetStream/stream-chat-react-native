import { semantics as darkSemantics } from './generated/dark/StreamTokens';
import { semantics as lightSemantics } from './generated/light/StreamTokens';
// TODO: As these never change across different themes (only per platform),
//       it's safe to do this. It should be handled in the generation phase,
//       though.
export { primitives, foundations, components } from './generated/light/StreamTokens';

export { lightSemantics, darkSemantics };
