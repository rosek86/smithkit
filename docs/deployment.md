# Demo deployment

This guide is for maintainers of the demo site. Library users do not need to configure GitHub Pages.

Target URL: **https://rosek86.github.io/smithkit/**.
The source, checks, and deployment workflow all live in `rosek86/smithkit`.
GitHub Pages serves the built demo from `dist/demo/`, not the source files on `main`.

## Pipeline

A push to `main` runs `.github/workflows/ci.yml`:

1. Call `.github/workflows/verify.yml` to run source checks, build the library and
   demo, and pack one candidate archive.
2. Download that same build in parallel jobs: Chromium, WebKit, Firefox, and
   package/standalone-consumer verification. All jobs check out the recorded commit.
3. Require every verification job to succeed, then create the release manifest
   and upload `dist/demo/` as the `github-pages` artifact.
4. Require the top-level `check` gate, then deploy that exact artifact with
   `actions/deploy-pages`.

Pull requests run the same checks and upload artifacts without deploying. A new
push cancels older runs of that PR so obsolete checks do not hold up the latest
revision. Runs on `main` and release publication are not automatically cancelled.
You can also select **Actions → Check and publish Smith chart → Run workflow**
on `main` to retry a deployment. Runs on other branches cannot deploy.
Preparing a release archive does not publish the npm package.

The deployment job uses the `github-pages` environment and a short-lived
`GITHUB_TOKEN` with `pages: write` and `id-token: write`. No deployment key,
personal access token, separate repository, or generated Git branch is needed.
The check job retains read-only repository permissions.

## Repository setup

1. In **smithkit → Settings → Pages**, select **GitHub Actions** as the source.
2. In **Settings → Environments → github-pages**, allow deployments from `main`.
3. Merge the workflow into `main`. Its successful run publishes the demo.
4. In the repository's **About** settings, enable **Use your GitHub Pages website**.
   The generated link points to `/smithkit/`.

## Verification

Check that both the `check` and `deploy` jobs succeed. The deployment job exposes
its URL from the Pages action output; open it and verify the chart loads and the
controls work. A successful build alone does not confirm publication.

Vite generates relative asset URLs (`base: './'`). Browser tests serve the built
demo under `/smithkit/`, matching the public site path. The Pages artifact contains
`index.html` at its root, the integration gallery under `examples/`, searchable
API documentation under `api/`, and shared built assets. `build:demo` regenerates
the documentation before Vite copies it into the artifact. No separate hosting
or documentation deployment workflow is needed. Example links and generated asset URLs work under the project path
and on direct navigation to nested pages.

To stop automatic publication temporarily while retaining checks, disable the
`deploy` job in `.github/workflows/ci.yml` through a pull request. To unpublish the
site, use **Settings → Pages → Unpublish site**.

Documentation: [custom GitHub Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages),
[Pages publishing sources](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
