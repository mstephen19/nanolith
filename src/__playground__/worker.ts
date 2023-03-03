import { createWriteStream } from 'fs';
import { ParentThread, define } from 'nanolith';

export const worker = await define({
    __initializeService() {
        // Receive streams from the parent thread
        ParentThread.onStream((stream) => {
            // Write the data to ./data.txt
            const writeStream = createWriteStream('./data.txt');
            stream.pipe(writeStream);

            // Close the service once the writing has completed
            writeStream.on('finish', process.exit.bind(undefined, 0));
        });
    },
});
