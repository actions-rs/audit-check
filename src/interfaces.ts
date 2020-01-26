/**
 * These types should match to what `cargo-audit` outputs in a JSON format.
 *
 * See `rustsec` crate for structs used for serialization.
 */

export interface Report {
    database: DatabaseInfo;
    lockfile: LockfileInfo;
    vulnerabilities: VulnerabilitiesInfo;
    warnings: Warning[];
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
    kind: Kind;
    package: Package;
}

// TypeScript types system is weird :(
export interface Kind {
    unmaintained?: KindUnmaintained;
    informational?: KindInformational;
    yanked?: KindYanked;
}

export interface KindUnmaintained {
    advisory: Advisory;
}

export interface KindInformational {
    advisory: Advisory;
}

export interface KindYanked {} // eslint-disable-line @typescript-eslint/no-empty-interface
