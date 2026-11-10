export type GIPrimitive = string | number | boolean;

/** Line comments are strings. An empty string represents a standalone `//`. */
export type GIComment = string | {style: 'block'; text: string};

/** A null item keeps one blank line between entries or comments. */
export type GICommentLine = GIComment | null;

interface GIEntryBase {
    key: string;
    leadingComments?: GICommentLine[];
    inlineComments?: GIComment[];
}

interface GIValueBase extends GIEntryBase {
    condition?: string;
}

export interface GIValueEntry extends GIValueBase {
    kind: 'value';
    value: GIPrimitive;
    /** Unquoted numeric spelling when the value cannot be stored as a JavaScript number. */
    readonly numberSource?: string;
}

export interface GIBlockEntry extends GIValueBase {
    kind: 'block';
    entries: GIEntry[];
    beforeCloseComments?: GICommentLine[];
}

export interface GIFlagEntry extends GIEntryBase {
    kind: 'flag';
}

export type GIEntry = GIBlockEntry | GIValueEntry | GIFlagEntry;

export interface GIDocument {
    root: GIBlockEntry | GIValueEntry;
    trailingComments?: GICommentLine[];
}

export interface ComposeOptions {
    /** Omit comments from the formatted output. */
    stripComments?: boolean;
}

export const MAX_NESTING = 512;
