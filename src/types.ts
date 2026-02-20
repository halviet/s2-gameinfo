export type KVPrimitive = string | number | boolean;
// Conditional value type, stored as [value, '[ condition ]']
export type KVCond = [KVPrimitive, string];
export type KVValue = KVPrimitive | KVObject | KVCond;
export interface KVObject {
    [key: string]: KVValue;
}

// Composer options for formatting control
export interface ComposeOptions {
    indent?: string;           // Indentation string (default: '\t')
    lineEnding?: string;       // Line ending (default: '\n')
    quoteKeys?: 'auto' | 'always' | 'never';  // When to quote keys
    quoteValues?: 'auto' | 'always' | 'never'; // When to quote values
}

// Parser options
export interface ParseOptions {
    overrideDuplicates?: boolean;
    parseConditionals?: boolean;
}