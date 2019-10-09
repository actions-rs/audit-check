# Rust `audit-check` Action

![MIT licensed](https://img.shields.io/badge/license-MIT-blue.svg)
[![Gitter](https://badges.gitter.im/actions-rs/community.svg)](https://gitter.im/actions-rs/community)

> Security vulnerabilities audit

This GitHub Action is using [cargo-audit](https://github.com/RustSec/cargo-audit)
to perform an audit for crates with security vulnerabilities.

## Usage

### Audit changes

We can utilize the GitHub Actions ability to execute workflow
only if [specific files were changed](https://help.github.com/en/articles/workflow-syntax-for-github-actions#onpushpull_requestpaths)
and execute this Action to check the changed dependencies only:

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

In that case this Action will create a Check with the advisories found:

![Check screenshot](.github/check_screenshot.png)

#### Limitations

Due to [token permissions](https://help.github.com/en/articles/virtual-environments-for-github-actions#token-permissions),
this Action **WILL NOT** be able to create Checks for Pull Requests from the forked repositories,
see [actions-rs/clippy-check#2](https://github.com/actions-rs/clippy-check/issues/2) for details.\
As a fallback this Action will output all advisories found to the stdout.

## Scheduled audit

Another option is to use [`schedule`](https://help.github.com/en/articles/events-that-trigger-workflows#scheduled-events-schedule) event
and execute this Action periodically against the repository default branch `HEAD`.

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
      - uses: actions-rs/audit-check@alpha
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```

With this workflow Action will be executed at midnight on each day
and check if there any new advisories appear for crate dependencies.\
For each such advisory an issue will be created:

![Issue screenshot](.github/issue_screenshot.png)

## Inputs

| Name        | Required | Description                                                              | Type   | Default |
| ------------| -------- | -------------------------------------------------------------------------| ------ | --------|
| `token`     | ✓        | GitHub token, `${{ secrets.GITHUB_TOKEN }}`                              | string |         |
