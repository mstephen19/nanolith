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
