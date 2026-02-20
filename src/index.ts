import {parseKeyValues} from "./parser";
import {GameInfo, KVObject, KVValue} from "./types";

export { KeyValuesParser, parseKeyValues } from './parser';
export type { KVValue, KVObject, ParseOptions, GameInfo } from './types';

// Convenience for GameInfo specifically
export function parseGameInfo(content: string): GameInfo {
    return parseKeyValues(content) as GameInfo;
}

// Helper to access nested values safely
export function getPath(obj: KVObject, path: string): KVValue | undefined {
    return path.split('.').reduce((curr: any, key) => {
        if (curr === undefined || curr === null) return undefined;
        return curr[key];
    }, obj);
}