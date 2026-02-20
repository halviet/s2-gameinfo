// The universal KeyValues node - can be a string, number, boolean, or nested object
export type KVValue = string | number | boolean | KVObject | KVValue[];

// Object with string keys and any KVValue
export interface KVObject {
    [key: string]: KVValue;
}

// Specific GameInfo interface extends the generic structure
export interface GameInfo extends KVObject {
    game: string;
    title: string;
    type?: string;
    // ... you can add known fields for autocomplete, but everything else is caught by index signature
}

// Parser options
export interface ParseOptions {
    preserveDuplicates?: boolean; // If true, duplicate keys become arrays
    preserveComments?: boolean;   // If true, comments are stored in special keys
    parseConditionals?: boolean;  // If true, parse [$LINUX] conditions
}