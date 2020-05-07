import * as process from 'process';

import * as core from '@actions/core';
import * as github from '@actions/github';
import * as nunjucks from 'nunjucks';

import { checks } from '@actions-rs/core';
import * as interfaces from './interfaces';
import * as templates from './templates';

interface Stats {
    critical: number;
    notices: number;
    unmaintained: number;
    other: number;
}

nunjucks.configure({
    trimBlocks: true,
    lstripBlocks: true,
});

function makeReport(
    vulnerabilities: Array<interfaces.Vulnerability>,
    warnings: Array<interfaces.Warning>,
): string {
    const preparedWarnings: Array<templates.ReportWarning> = [];
    for (const warning of warnings) {
        switch (warning.kind) {
            case 'unmaintained':
                preparedWarnings.push({
                    advisory: warning.advisory,
                    package: warning.package,
                });
                break;

            case 'informational':
                preparedWarnings.push({
                    advisory: warning.advisory,
                    package: warning.package,
                });
                break;

            case 'yanked':
                preparedWarnings.push({
                    package: warning.package,
                });
                break;

            default:
                core.warning(
                    `Unknown warning kind ${warning.kind} found, please, file a bug`,
                );
                break;
        }
    }

    return nunjucks.renderString(templates.REPORT, {
        vulnerabilities: vulnerabilities,
        warnings: preparedWarnings,
    });
}

export function plural(value: number, suffix = 's'): string {
    return value == 1 ? '' : suffix;
}

function getStats(
    vulnerabilities: Array<interfaces.Vulnerability>,
    warnings: Array<interfaces.Warning>,
): Stats {
    let critical = 0;
    let notices = 0;
    let unmaintained = 0;
    let other = 0;
    for (const vulnerability of vulnerabilities) {
        switch (vulnerability.advisory.informational) {
            case 'notice':
                notices += 1;
                break;
            case 'unmaintained':
                unmaintained += 1;
                break;
            case null:
                critical += 1;
                break;
            default:
                other += 1;
                break;
        }
    }

    for (const warning of warnings) {
        switch (warning.kind) {
            case 'unmaintained':
                unmaintained += 1;
                break;

            default:
                // Both yanked and informational types of kind
                other += 1;
                break;
        }
    }

    return {
        critical: critical,
        notices: notices,
        unmaintained: unmaintained,
        other: other,
    };
}

function getSummary(stats: Stats): string {
    const blocks: string[] = [];

    if (stats.critical > 0) {
        // TODO: Plural
        blocks.push(`${stats.critical} advisory(ies)`);
    }
    if (stats.notices > 0) {
        blocks.push(`${stats.notices} notice${plural(stats.notices)}`);
    }
    if (stats.unmaintained > 0) {
        blocks.push(`${stats.unmaintained} unmaintained`);
    }
    if (stats.other > 0) {
        blocks.push(`${stats.other} other`);
    }

    return blocks.join(', ');
}

/// Create and publish audit results into the Commit Check.
export async function reportCheck(
    client: github.GitHub,
    vulnerabilities: Array<interfaces.Vulnerability>,
    warnings: Array<interfaces.Warning>,
): Promise<void> {
    const reporter = new checks.CheckReporter(client, 'Security audit');
    const stats = getStats(vulnerabilities, warnings);
    const summary = getSummary(stats);

    core.info(`Found ${summary}`);

    try {
        await reporter.startCheck('queued');
    } catch (error) {
        // `GITHUB_HEAD_REF` is set only for forked repos,
        // so we can check if it is a fork and not a base repo.
        if (process.env.GITHUB_HEAD_REF) {
            core.error(`Unable to publish audit check! Reason: ${error}`);
            core.warning(
                'It seems that this Action is executed from the forked repository.',
            );
            core.warning(`GitHub Actions are not allowed to use Check API, \
when executed for a forked repos. \
See https://github.com/actions-rs/clippy-check/issues/2 for details.`);
            core.info('Posting audit report here instead.');

            core.info(makeReport(vulnerabilities, warnings));
            if (stats.critical > 0) {
                throw new Error(
                    'Critical vulnerabilities were found, marking check as failed',
                );
            } else {
                core.info(
                    'No critical vulnerabilities were found, not marking check as failed',
                );
                return;
            }
        }

        throw error;
    }

    try {
        const body = makeReport(vulnerabilities, warnings);
        const output = {
            title: 'Security advisories found',
            summary: summary,
            text: body,
        };
        const status = stats.critical > 0 ? 'failure' : 'success';
        await reporter.finishCheck(status, output);
    } catch (error) {
        await reporter.cancelCheck();
        throw error;
    }

    if (stats.critical > 0) {
        throw new Error(
            'Critical vulnerabilities were found, marking check as failed',
        );
    } else {
        core.info(
            'No critical vulnerabilities were found, not marking check as failed',
        );
        return;
    }
}

async function alreadyReported(
    client: github.GitHub,
    advisoryId: string,
): Promise<boolean> {
    const { owner, repo } = github.context.repo;
    const results = await client.search.issuesAndPullRequests({
        q: `${advisoryId} in:title repo:${owner}/${repo}`,
        per_page: 1, // eslint-disable-line @typescript-eslint/camelcase
    });

    if (results.data.total_count > 0) {
        core.info(
            `Seems like ${advisoryId} is mentioned already in the issues/PRs, \
will not report an issue against it`,
        );
        return true;
    } else {
        return false;
    }
}

export async function reportIssues(
    client: github.GitHub,
    vulnerabilities: Array<interfaces.Vulnerability>,
    warnings: Array<interfaces.Warning>,
): Promise<void> {
    const { owner, repo } = github.context.repo;

    for (const vulnerability of vulnerabilities) {
        const reported = await alreadyReported(
            client,
            vulnerability.advisory.id,
        );
        if (reported) {
            continue;
        }

        const body = nunjucks.renderString(templates.VULNERABILITY_ISSUE, {
            vulnerability: vulnerability,
        });
        const issue = await client.issues.create({
            owner: owner,
            repo: repo,
            title: `${vulnerability.advisory.id}: ${vulnerability.advisory.title}`,
            body: body,
        });
        core.info(
            `Created an issue for ${vulnerability.advisory.id}: ${issue.data.html_url}`,
        );
    }

    for (const warning of warnings) {
        let advisory: interfaces.Advisory;
        switch (warning.kind) {
            case 'unmaintained':
            case 'informational':
                advisory = warning.advisory;
                break;
            case 'yanked':
                core.warning(
                    `Crate ${warning.package.name} was yanked, but no issue will be reported about it`,
                );
                continue;
            default:
                core.warning(
                    `Unknown warning kind ${warning.kind} found, please, file a bug`,
                );
                continue;
        }

        const reported = await alreadyReported(client, advisory.id);
        if (reported) {
            continue;
        }

        const body = nunjucks.renderString(templates.WARNING_ISSUE, {
            warning: warning,
            advisory: advisory,
        });
        const issue = await client.issues.create({
            owner: owner,
            repo: repo,
            title: `${advisory.id}: ${advisory.title}`,
            body: body,
        });
        core.info(
            `Created an issue for ${advisory.id}: ${issue.data.html_url}`,
        );
    }
}
