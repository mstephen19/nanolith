import { ParentThread, define } from 'nanolith';
import fs from 'fs';

export const worker = await define({
    __initializeService() {
        ParentThread.onStream((stream) => {
            const write = fs.createWriteStream('./foo.txt');

            stream.pipe(write);

            write.on('finish', () => {
                ParentThread.sendMessage('ready_to_close');
            });
        });
    },
});
