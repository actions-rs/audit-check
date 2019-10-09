import * as process from 'process';

import * as core from '@actions/core';
import * as github from '@actions/github';

import { checks } from '@actions-rs/core';
import * as interfaces from './interfaces';
import * as templates from './templates';

interface Stats {
    critical: number;
    notices: number;
    unmaintained: number;
    other: number;
}

function dumpVulnerabilities(
    vulnerabilities: Array<interfaces.Vulnerability>,
): void {
    const render = templates.CHECK_TEXT({
        vulnerabilities: vulnerabilities,
    });

    core.info(render);
}

export function plural(value: number, suffix = 's'): string {
    return value == 1 ? '' : suffix;
}

function getStats(vulnerabilities: Array<interfaces.Vulnerability>): Stats {
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
): Promise<void> {
    const reporter = new checks.CheckReporter(client, 'Security audit');
    const stats = getStats(vulnerabilities);
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

            dumpVulnerabilities(vulnerabilities);
            if (stats.critical > 0) {
                throw new Error(
                    'Critical vulnerabilities were found, marking check as failed',
                );
            }
        }

        throw error;
    }

    try {
        const output = {
            title: 'Security advisories found',
            summary: summary,
            text: templates.CHECK_TEXT({
                vulnerabilities: vulnerabilities,
            }),
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
    }
}

export async function reportIssues(
    client: github.GitHub,
    vulnerabilities: Array<interfaces.Vulnerability>,
): Promise<void> {
    const { owner, repo } = github.context.repo;
    for (const vulnerability of vulnerabilities) {
        const results = await client.search.issuesAndPullRequests({
            q: `${vulnerability.advisory.id} in:title repo:${owner}/${repo}`,
            per_page: 1, // eslint-disable-line @typescript-eslint/camelcase
        });

        if (results.data.total_count > 0) {
            core.info(
                `Seems like ${vulnerability.advisory.id} is mentioned already in the issues/PRs, \
will not report an issue against it`,
            );
            continue;
        }

        const issue = await client.issues.create({
            owner: owner,
            repo: repo,
            title: `${vulnerability.advisory.id}: ${vulnerability.advisory.title}`,
            body: templates.ISSUE_BODY({
                vulnerability: vulnerability,
            }),
        });
        core.info(
            `Created an issue for ${vulnerability.advisory.id}: ${issue.data.html_url}`,
        );
    }
}
