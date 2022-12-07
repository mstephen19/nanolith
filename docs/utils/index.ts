import path from 'path';
import { readdir, readFile } from 'fs/promises';
import matter from 'gray-matter';

const DIRECTORY = 'markdown';

export type Pages = {
    data: { title: string; description: string; slug: string };
    content: string;
}[];

export const getPages = async (): Promise<Pages> => {
    const files = await readdir(DIRECTORY);

    const data = await Promise.all(
        files.map((name) => {
            return (async () => {
                const contents = await readFile(path.join(DIRECTORY, name));

                const { data, content } = matter(contents);

                return {
                    data,
                    content: content.trim(),
                };
            })();
        })
    );

    return data as Pages;
};
