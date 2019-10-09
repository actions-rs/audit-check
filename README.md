# Rust `audit-check` Action

![MIT licensed](https://img.shields.io/badge/license-MIT-blue.svg)
[![Gitter](https://badges.gitter.im/actions-rs/community.svg)](https://gitter.im/actions-rs/community)

> Security vulnerabilities audit

This GitHub Action is using [cargo-audit](https://github.com/RustSec/cargo-audit)
to perform an audit for crates with security vulnerabilities.

## Usage

### Audit changes

We can utilize the GitHub Actions ability to execute workflow
only if [the specific files were changed](https://help.github.com/en/articles/workflow-syntax-for-github-actions#onpushpull_requestpaths)
and execute this Action to check the changed dependencies:

```yaml
name: Security audit
on:
  push:
    paths: 
      - '**/Cargo.toml'
      - '**/Cargo.lock'
jobs:
  security_audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v1
      - uses: actions-rs/audit-check@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```

It is recommended to add the `paths:` section into the workflow file,
as it would effectively speed up the CI pipeline, since the audit process
will not be performed if no dependencies were changed.


In case of any security advisories found, [status check](https://help.github.com/en/articles/about-status-checks)
created by this Action will be marked as "failed".\
Note that informational advisories are not affecting the check status.

![Check screenshot](.github/check_screenshot.png)

#### Limitations

Due to [token permissions](https://help.github.com/en/articles/virtual-environments-for-github-actions#token-permissions),
this Action **WILL NOT** be able to create Checks for Pull Requests from the forked repositories,
see [actions-rs/clippy-check#2](https://github.com/actions-rs/clippy-check/issues/2) for details.\
As a fallback this Action will output all found advisories to the stdout.\
It is expected that this behavior will be fixed later by GitHub.

## Scheduled audit

Another option is to use [`schedule`](https://help.github.com/en/articles/events-that-trigger-workflows#scheduled-events-schedule) event
and execute this Action periodically against the `HEAD` of repository default branch.

```yaml
name: Security audit
on:
  schedule:
    - cron: '0 0 * * *'
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v1
      - uses: actions-rs/audit-check@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```

With this example Action will be executed periodically at midnight of each day
and check if there any new advisories appear for crate dependencies.\
For each new advisory (including informal) an issue will be created:

![Issue screenshot](.github/issue_screenshot.png)

## Inputs

| Name        | Required | Description                                                              | Type   | Default |
| ------------| -------- | -------------------------------------------------------------------------| ------ | --------|
| `token`     | ✓        | GitHub token, usually a `${{ secrets.GITHUB_TOKEN }}`                    | string |         |
