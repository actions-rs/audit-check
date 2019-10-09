/**
 * Parse action input into a some proper thing.
 */

import { input } from '@actions-rs/core';

// Parsed action input
export interface Input {
    token: string;
}

export function get(): Input {
    return {
        token: input.getInput('token', { required: true }),
    };
}
