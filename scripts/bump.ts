import * as fs from 'fs/promises';

type VersionParts = [number, number, number];

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

const newVersion = bumpVersion(pkg.version);

pkg.version = newVersion;

await fs.writeFile('./package.json', JSON.stringify(pkg, null, '\t'));
