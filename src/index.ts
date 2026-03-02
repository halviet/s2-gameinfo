export { parseGI } from './parser';
export { composeGI } from './composer';
export type { ParseOptions, ComposeOptions } from './types';

export type {
    KVPrimitive,
    KVDuplicate,
    DuplicateBrand,
    KVWrappedDuplicate,
    KVCond,
    KVValue,
    KVObject,
} from './types';

export {
    isKVDuplicate,
    isKVWrappedDuplicate,
    isKVCond,
    isKVPrimitive,
    createDuplicate,
    createWrappedDuplicate
} from './types';