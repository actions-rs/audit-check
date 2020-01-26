/**
 * Naive way to bundle the templates in order to skip any build/watch pre-processing steps.
 */

import * as interfaces from './interfaces';

export interface ReportWarning {
    advisory?: interfaces.Advisory;
    package: interfaces.Package;
}

export const REPORT = `
{% if vulnerabilities.length > 0 %}
## Vulnerabilities

{% for v in vulnerabilities %}
### [{{ v.advisory.id }}](https://rustsec.org/advisories/{{ v.advisory.id }}.html)

> {{ v.advisory.title }}

| Details             |                                                |
| ------------------- | ---------------------------------------------- |
{% if v.advisory.informational %}
| Status              | {{ v.advisory.informational }}                |
{% endif %}
| Package             | \`{{ v.package.name }}\`                      |
| Version             | \`{{ v.package.version }}\`                   |
{% if v.advisory.url %}
| URL                 | [{{ v.advisory.url }}]({{ v.advisory.url }}) |
{% endif %}
| Date                | {{ v.advisory.date }}                         |
{% if v.versions.patched.length > 0 %}
| Patched versions    | \`{{ v.versions.patched | safe }}\`                  |
{% endif %}
{% if v.versions.unaffected.length > 0 %}
| Unaffected versions | \`{{ v.versions.unaffected | safe }}\`               |
{% endif %}

{{ v.advisory.description }}
{% endfor %}
{% endif %}

{% if warnings.length > 0 %}
## Warnings

{% for w in warnings %}
{% if w.advisory %}
### [{{ w.advisory.id }}](https://rustsec.org/advisories/{{ w.advisory.id }}.html)

> {{ w.advisory.title }}

| Details             |                                                |
| ------------------- | ---------------------------------------------- |
{% if w.advisory.informational %}
| Status              | {{ w.advisory.informational }}                |
{% endif %}
| Package             | \`{{ w.package.name }}\`                      |
| Version             | \`{{ w.package.version | safe }}\`                   |
{% if w.advisory.url %}
| URL                 | [{{ w.advisory.url }}]({{ w.advisory.url }}) |
{% endif %}
| Date                | {{ w.advisory.date }}                         |
{% if w.versions.patched.length > 0 %}
| Patched versions    | \`{{ w.versions.patched | safe }}\`                  |
{% endif %}
{% if w.versions.unaffected.length > 0 %}
| Unaffected versions | \`{{ w.versions.unaffected | safe }}\`               |
{% endif %}

{{ w.advisory.description }}
{% else %}
### Crate \`{{ w.package.name }}\` is yanked

No extra details provided.

{% endif %}
{% endfor %}
{% endif %}
`;

export const VULNERABILITY_ISSUE = `
> {{ vulnerability.advisory.title }}

| Details             |                                                |
| ------------------- | ---------------------------------------------- |
{% if vulnerability.advisory.informational %}
| Status              | {{ vulnerability.advisory.informational }}                |
{% endif %}
| Package             | \`{{ vulnerability.package.name }}\`                      |
| Version             | \`{{ vulnerability.package.version | safe }}\`                   |
{% if vulnerability.advisory.url %}
| URL                 | [{{ vulnerability.advisory.url }}]({{ vulnerability.advisory.url }}) |
{% endif %}
| Date                | {{ vulnerability.advisory.date }}                         |
{% if vulnerability.versions.patched.length > 0 %}
| Patched versions    | \`{{ vulnerability.versions.patched | safe }}\`                  |
{% endif %}
{% if vulnerability.versions.unaffected.length > 0 %}
| Unaffected versions | \`{{ vulnerability.versions.unaffected | safe }}\`               |
{% endif %}

{{ vulnerability.advisory.description }}

See [advisory page](https://rustsec.org/advisories/{{ vulnerability.advisory.id }}.html) for additional details.
`;

export const WARNING_ISSUE = `
> {{ advisory.title }}

| Details             |                                                |
| ------------------- | ---------------------------------------------- |
{% if advisory.informational %}
| Status              | {{ advisory.informational }}                |
{% endif %}
| Package             | \`{{ warning.package.name }}\`                      |
| Version             | \`{{ warning.package.version | safe }}\`                   |
| URL                 | [{{ advisory.url }}]({{ advisory.url }}) |
| Date                | {{ advisory.date }}                         |

{{ advisory.description }}

See [advisory page](https://rustsec.org/advisories/{{ advisory.id }}.html) for additional details.
`;
