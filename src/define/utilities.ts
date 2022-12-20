import { fileURLToPath } from 'url';
import callsites from 'callsites';

import type { TaskDefinitions } from '@typing/definitions.js';

export const getCurrentFile = (index?: number) => {
    const fileName = callsites()[index ?? 2].getFileName()!;
    try {
        const filePath = fileURLToPath(fileName);
        return filePath;
    } catch (err) {
        return fileName;
    }
};

export const assertCurrentFileNotEqual = (file: string) => {
    if (getCurrentFile(3) === file) {
        throw new Error('Cannot run workers from the same file from which their tasks were defined!');
    }
};

/**
 * Automatically generate an identifier for a set of definitions based on its method keys.
 */
export const getAutoIdentifier = (definitions: TaskDefinitions) => Object.keys(definitions).join('&');
