export interface Report {
    database: DatabaseInfo;
    lockfile: LockfileInfo;
    vulnerabilities: VulnerabilitiesInfo;
    warnings: Vulnerability[];
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
