/* eslint-disable no-console */
import { exec as execSync } from 'child_process';
import { promisify } from 'util';
import { writeFile, stat, unlink } from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import axios from 'axios';
import jsonminify from 'jsonminify';

const ACCEPTABLE_ARGUMENTS = ['latest', 'next'];

if (!ACCEPTABLE_ARGUMENTS.includes(process.argv[2])) throw new Error('Invalid option provided!');

const mode = process.argv[2] as 'latest' | 'next';

const DESIRED_PROPERTIES = [
    'name',
    'version',
    'type',
    'author',
    'description',
    'license',
    'repository',
    'homepage',
    'bugs',
    'main',
    'exports',
    'dependencies',
    'keywords',
];

const exec = promisify(execSync);

const exists = async (file: string) => {
    try {
        await stat(file);
        return true;
    } catch (error) {
        return false;
    }
};

// Check if the package.json even exists.
if (!(await exists('./package.json'))) {
    throw new Error('package.json not found!');
}

try {
    let packageJson = '';

    const stream = createReadStream('./package.json');
    stream.pipe(createWriteStream('./package-backup.json'));

    stream.on('data', (data) => {
        packageJson += Buffer.from(data).toString('utf-8');
    });

    await new Promise((resolve) => {
        stream.once('end', resolve);
    });

    const parsed: Record<string, unknown> = JSON.parse(packageJson);

    type NPMResponse = {
        'dist-tags': {
            next: string;
            latest: string;
        };
    };

    const { data: nanolith } = await axios<NPMResponse>('https://registry.npmjs.org/nanolith/');

    if (mode === 'latest' && parsed.version === nanolith['dist-tags'].latest) {
        throw new Error(`Latest version ${parsed.version} has already been published!`);
    }

    if (mode === 'next' && parsed.version === nanolith['dist-tags'].next) {
        throw new Error(`Next version ${parsed.version} has already been published!`);
    }

    const newPackageJson = JSON.stringify(
        DESIRED_PROPERTIES.reduce((acc, prop) => {
            if (parsed[prop]) acc[prop] = parsed[prop];
            return acc;
        }, {} as Record<string, unknown>)
    );
    await writeFile('./package.json', jsonminify(newPackageJson));

    await exec(`npm publish${mode === 'next' ? ' --tag next' : ''}`);

    console.log(`${mode} version published: ${parsed.version}`);
} catch (error) {
    // eslint-disable-next-line no-console
} finally {
    await unlink('./package.json');

    const writeStream = createWriteStream('./package.json');
    createReadStream('./package-backup.json').pipe(writeStream);

    await new Promise((resolve) => {
        writeStream.once('close', resolve);
    });

    await unlink('./package-backup.json');
}
