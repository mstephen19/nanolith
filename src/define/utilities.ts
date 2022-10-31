import callsites from 'callsites';
import { fileURLToPath } from 'url';

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
