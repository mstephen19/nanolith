import { minify } from 'minify';
import * as fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import type { Dirent } from 'fs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const BLACKLIST = ['__playground__', '__test__'];
const DIST = path.join(__dirname, '../dist');

const getFileType = (item: Dirent): 'dir' | 'file' | undefined => {
    if (item.isDirectory()) return 'dir';
    if (item.isFile()) return 'file';
};

const read = async (dir: string) => {
    return (await fs.readdir(dir, { withFileTypes: true })).reduce((acc, item) => {
        // Ignore the file/folder if it's been blacklisted
        if (BLACKLIST.includes(item.name)) return acc;
        // Ignore the item if it's a file but doesn't end with ".js"
        if (item.isFile() && !item.name.endsWith('.js')) return acc;

        return [
            ...acc,
            {
                item,
                type: getFileType(item)!,
                path: path.join(dir, item.name),
            },
        ];
    }, [] as { item: Dirent; type: 'dir' | 'file'; path: string }[]);
};

const minifyAll = async (directory: string) => {
    const items = await read(directory);

    const promises = items.map((item) => {
        return (async () => {
            if (item.type === 'file') {
                // If the file is just some empty export crap, delete it.
                const contents = Buffer.from(await fs.readFile(item.path)).toString('utf-8');
                if (/^export\s?{};$/.test(contents.trim())) return fs.unlink(item.path);

                const minified = await minify(item.path, {
                    js: {
                        compress: {
                            hoist_funs: true,
                            hoist_vars: true,
                            module: true,
                        },
                    },
                });
                await fs.writeFile(item.path, minified);
                return;
            }

            if (item.type === 'dir') {
                await minifyAll(item.path);
                return;
            }
        })();
    });

    await Promise.all(promises);
};

await minifyAll(DIST);
