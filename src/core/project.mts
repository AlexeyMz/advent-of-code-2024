import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function getDataPath(dataPath: string): string {
    const dirname = fileURLToPath(import.meta.url);
    return path.join(dirname, path.join('../../../../advent-of-code-2024-data', dataPath));
}
