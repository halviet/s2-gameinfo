// Parser
import {parseKeyValues} from "./parser";
import {ComposeOptions, KVObject} from "./types";
import {composeKeyValues} from "./composer";

export { KeyValuesParser, parseKeyValues } from './parser';
export type { ParseOptions } from './types';

// Composer
export { KeyValuesComposer, composeKeyValues } from './composer';
export type { ComposeOptions } from './types';

// Types
export type {
    KVValue,
    KVObject,
    KVCond,
    KVPrimitive
} from './types';

// GameInfo specific helpers
export function parseGameInfo(content: string) {
    return parseKeyValues(content);
}

export function composeGameInfo(
    obj: KVObject,
    options?: ComposeOptions
): string {
    return composeKeyValues(obj, 'GameInfo', options);
}

// Round-trip helper
export function modifyGameInfo(
    content: string,
    modifier: (obj: KVObject) => void
): string {
    const parsed = parseGameInfo(content);
    modifier(parsed);
    return composeGameInfo(parsed);
}