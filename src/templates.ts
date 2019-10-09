import * as Handlebars from 'handlebars';

export const CHECK_TEXT = Handlebars.compile(
    `
{{#each vulnerabilities}}
## [{{this.advisory.id}}](https://rustsec.org/advisories/{{this.advisory.id}}.html)

> {{this.advisory.title}}

| Details             |                                                |
| ------------------- | ---------------------------------------------- |
{{#if this.advisory.informational}}
| Status              | {{this.advisory.informational}}                |
{{/if}}
| Package             | \`{{this.package.name}}\`                      |
| Version             | \`{{this.package.version}}\`                   |
| URL                 | [{{this.advisory.url}}]({{this.advisory.url}}) |
| Date                | {{this.advisory.date}}                         |
{{#if this.versions.patched.length}}
| Patched versions    | \`{{this.versions.patched}}\`                  |
{{/if}}
{{#if this.versions.unaffected.length}}
| Unaffected versions | \`{{this.versions.unaffected}}\`               |
{{/if}}
{{this.advisory.description}}
{{/each}}
`,
    {
        knownHelpersOnly: true,
        noEscape: true,
        strict: true,
    },
);

export const ISSUE_BODY = Handlebars.compile(
    `
> {{vulnerability.advisory.title}}

| Details             |                                                |
| ------------------- | ---------------------------------------------- |
{{#if vulnerability.advisory.informational}}
| Status              | {{vulnerability.advisory.informational}}                |
{{/if}}
| Package             | \`{{vulnerability.package.name}}\`                      |
| Version             | \`{{vulnerability.package.version}}\`                   |
| URL                 | [{{vulnerability.advisory.url}}]({{vulnerability.advisory.url}}) |
| Date                | {{vulnerability.advisory.date}}                         |
{{#if vulnerability.versions.patched}}
| Patched versions    | \`{{vulnerability.versions.patched}}\`                  |
{{/if}}
{{#if vulnerability.versions.unaffected}}
| Unaffected versions | \`{{vulnerability.versions.unaffected}}\`               |
{{/if}}

{{vulnerability.advisory.description}}

See [advisory page](https://rustsec.org/advisories/{{vulnerability.advisory.id}}.html) for additional details.
`,
    {
        knownHelpersOnly: true,
        noEscape: true,
        strict: true,
    },
);
