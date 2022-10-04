/** @returns {Promise<import('jest').Config>} */
export default async () => {
    return {
        verbose: true,
        coverageDirectory: './__test__coverage__',
        rootDir: './dist/__test__',
    };
};
