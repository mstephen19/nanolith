import * as fs from 'fs/promises';
import axios from 'axios';

const REGISTRY_URL = 'https://registry.npmjs.org/nanolith/';

type NPMResponse = {
    'dist-tags': {
        next: string;
        latest: string;
    };
};

type VersionParts = [number, number, number];

const fetchVersion = async () => {
    try {
        const { data: nanolith } = await axios.get<NPMResponse>(REGISTRY_URL);
        return nanolith?.['dist-tags']?.latest || null;
    } catch (error) {
        return null;
    }
};

const bumpVersion = (version: string) => {
    if (!/(\d\.){2}\d(-beta\d+)?/.test(version)) throw new Error(`Invalid version provided: ${version}`);
    if (/-beta\d+$/.test(version)) {
        return version.replace(/-beta\d+$/, '');
    }

    const parts = version.split('.').map(Number) as VersionParts;
    for (let i = parts.length - 1; i >= 0; i--) {
        // Wrap version around if the decimal is already at 9
        if (parts[i] >= 9 && i > 0) {
            parts[i] = 0;
            // then move onto the next decimal place
            continue;
        }

        parts[i]++;
        break;
    }

    return parts.join('.');
};

const pkg = JSON.parse((await fs.readFile('./package.json')).toString('utf-8')) as { version: string };

// Ideally, use the version on NPM, but fall back to the one in the package.json in the
// worst case scenario
const currentVersion = (await fetchVersion()) || pkg.version;

const newVersion = bumpVersion(currentVersion);

pkg.version = newVersion;

await fs.writeFile('./package.json', JSON.stringify(pkg, null, '\t'));
