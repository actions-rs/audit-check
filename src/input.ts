/**
 * Parse action input into a some proper thing.
 */

import { input } from '@actions-rs/core';

import stringArgv from "string-argv";

// Parsed action input
export interface Input {
    token: string;
    args: string[];
}

export function get(): Input {
    return {
        token: input.getInput('token', { required: true }),
        args: stringArgv(input.getInput('args')),
    };
}
