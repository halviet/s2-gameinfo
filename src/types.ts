export type KVPrimitive = string | number | boolean;


export type KVCond = [KVPrimitive, string];

export const DuplicateBrand: unique symbol = Symbol('DuplicateBrand');
export type KVDuplicate = KVValue[] & { [DuplicateBrand]: true };

export type KVValue = KVPrimitive | KVObject | KVCond | KVDuplicate;

/**
 * Creates a KVDuplicate from values.
 * Applies the brand to distinguish from KVCond at compile time
 */
export function createDuplicate(values: KVValue[]): KVDuplicate {
    const branded = values as KVDuplicate;
    Object.defineProperty(branded, DuplicateBrand, {
        value: true,
        enumerable: false,
        writable: false,
        configurable: false
    });
    return branded;
}

/**
 * Checks if value is a {@link KVDuplicate}.
 * Works regardless of array length
 */
export function isKVDuplicate(value: KVValue): value is KVDuplicate {
    return Array.isArray(value) &&
        DuplicateBrand in value;
}

/**
 * Checks if value is a KVCond
 */
export function isKVCond(value: KVValue): value is KVCond {
    // Exclude branded arrays
    if (isKVDuplicate(value)) return false;

    return Array.isArray(value) &&
        value.length === 2 &&
        isKVPrimitive(value[0]) &&
        typeof value[1] === 'string';
}


function isKVPrimitive(value: unknown): value is KVPrimitive {
    const type = typeof value;
    return type === 'string' || type === 'number' || type === 'boolean';
}

export interface KVObject {
    [key: string]: KVValue;
}

// Composer options for formatting control
export interface ComposeOptions {
    /**
     * Root key for the main object
     *
     * @default "GameInfo"
     */
    rootKey?: string;

    /**
     * Indentation string
     *
     * @default "\t"
     */
    indent?: string;

    /**
     * Line ending character(s)
     *
     * @default "\n"
     */
    lineEnding?: string;

    /**
     * When to quote object keys
     *
     * - `'auto'` - Quote only keys that contain special characters or whitespace
     * - `'always'` - Quote all keys (safest for compatibility)
     * - `'never'` - Never quote keys (may produce invalid output for some keys)
     *
     * @default "always"
     */
    quoteKeys?: 'auto' | 'always' | 'never';

    /**
     * When to quote string values
     *
     * - `'auto'` - Quote only values that contain special characters or whitespace
     * - `'always'` - Quote all string values (safest for compatibility)
     * - `'never'` - Never quote values (may produce invalid output for some values)
     *
     * @default "always"
     */
    quoteValues?: 'auto' | 'always' | 'never';
}

// Parser options
export interface ParseOptions {
    /**
     * Keeps duplicated keys and their values
     *
     * **Note:** `gameinfo.gi` contains multiple duplicated keys; if you plan
     * to parse the whole `gameinfo.gi`, this option must be `true`
     *
     * @default true
     */
    keepDuplicates?: boolean;

    /**
     * Overrides value on duplicated key
     *
     * **Note:** This option has no effect when {@link ParseOptions.keepDuplicates} is `true`
     *
     * @default false
     */
    overrideDuplicates?: boolean;

    /**
     * Whether to parse conditional statements
     *
     * @default true
     */
    parseConditionals?: boolean;
}