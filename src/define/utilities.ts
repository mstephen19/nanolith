import callsites from 'callsites';
import { fileURLToPath } from 'url';

export const getCurrentFile = () => {
    const fileName = callsites()[2].getFileName()!;
    try {
        const filePath = fileURLToPath(fileName);
        return filePath;
    } catch (err) {
        return fileName;
    }
};
