/**
 * These types should match to what `cargo-audit` outputs in a JSON format.
 *
 * See `rustsec` crate for structs used for serialization.
 */

export interface Report {
    database: DatabaseInfo;
    lockfile: LockfileInfo;
    vulnerabilities: VulnerabilitiesInfo;
    warnings: Warning[] | { [key: string]: Warning[] };
}

export interface DatabaseInfo {
    'advisory-count': number;
    'last-commit': string;
    'last-updated': string;
}

export interface LockfileInfo {
    'dependency-count': number;
}

export interface VulnerabilitiesInfo {
    found: boolean;
    count: number;
    list: Vulnerability[];
}

export interface Vulnerability {
    advisory: Advisory;
    package: Package;
}

export interface Advisory {
    id: string;
    package: string;
    title: string;
    description: string;
    informational: undefined | string | 'notice' | 'unmaintained';
    url: string;
}

export interface Package {
    name: string;
    version: string;
}

export interface Warning {
    kind: 'unmaintained' | 'informational' | 'yanked' | string;
    advisory: Advisory;
    package: Package;
}
