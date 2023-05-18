# Hello, developer! Welcome to ✨Nanolith✨

This is a short guide on how to navigate the repository and contribute to the project.

## Process

The **main** branch is always the `@latest` release, and the `@next` release lives on a branch named after its version (**v.X.X.X**).

1. [Pick an issue](https://github.com/mstephen19/nanolith/issues) you'd like to address, or [create your own issue](https://github.com/mstephen19/nanolith/issues/new/choose)!
2. Pull down the repository and checkout to the **next** version's branch.
3. Checkout your branch, and give it a descriptive name (ex. **add-launchservice-build-args**).
4. Make your changes, ensuring to commit along the way (following the [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) standard).
5. Write **tests**. We're serious about testing, so write a few unit/integration tests!
6. Add your changes to the **CHANGELOG.md** file.
7. Throw up a PR and request a review from **[mstephen19](https://github.com/mstephen19)**.
8. Receive feedback and get approved!

## Some things to help you

Developer experience is what Nanolith is all about, and that doesn't just include the developers using the library!

### We've got CI

For every commit on your branch for which a PR is open, the build and test scripts will run automatically (using CircleCI). So hey, open that PR up early on and you'll see a cute little green checkmark next to your commits letting you know that you're all good.

### Prettier configuration

If your editor of choice is [VSCode](https://code.visualstudio.com/download), you can automatically format your code contributions to the project's standards by installing the [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) extension and enabling **Format on Save**.

### Playground

Alongside the **\_\_test\_\_** folder sits a **\_\_playground\_\_** folder. This is a place where you can manually test things out, log things, or just play around with the library. Note that when having your PR reviewed, the contents of this folder doesn't really matter (within reason). Use the [`play`](#play) script to automatically run your code within the **\_\_playground\_\_** folder any time a file within **src** changes.

> **Why this folder?** In the beginning of Nanolith's development, I (Matt) was using `npm link` to install the package locally into a separate "test" project. This became cumbersome, as for every change the project needed to be re-linked and re-installed in the "test" project.

### Scripts

While contributing to the project, you'll find these three scripts to be quite useful.

#### `build`

This command will lint, compile, and minify the code. This is the script that is used to build the project for production.

#### `test`

Run tests in watch mode! This means that whenever you update a file, the tests will be run again!

You might not want to run all the tests every time though, as that does take a little bit of time. To just run certain tests, include a matcher string for the name of the suite:

```sh
# only run test suites including "service" in their name
npm run test service
```

> **Tip:** A shortcut for `npm run test` is `npm t`.

#### `play`

Automatically run your code within the [**\_\_playground\_\_** folder](#playground) any time a file within **src** changes.

## Conclusion

Thanks a ton for your interest in contributing to Nanolith, and for keeping the open-source community a healthy environment for everyone!

If you've got any questions about the project, feel free to email **[mstephen19](https://github.com/mstephen19)**.
