import type {GIBlockEntry, GIDocument, GIEntry, GIValueEntry} from './types';

type Scope = GIDocument | GIBlockEntry;

/** Find every match in source order, starting at the scope's children. */
export function findGIEntries(scope: Scope, key: string, ...path: string[]): GIEntry[] {
    let matches: GIEntry[] = ['root' in scope ? scope.root : scope];
    for (const segment of [key, ...path]) {
        matches = matches.flatMap(entry => entry.kind === 'block'
            ? entry.entries.filter(child => child.key === segment)
            : []);
    }
    return matches;
}

/** Find the first matching entry in source order. */
export function findGIEntry(scope: Scope, key: string, ...path: string[]): GIEntry | undefined {
    return findGIEntries(scope, key, ...path)[0];
}

/** Find the first matching scalar entry in source order. */
export function findGIValueEntry(scope: Scope, key: string, ...path: string[]): GIValueEntry | undefined {
    return findGIEntries(scope, key, ...path).find(entry => entry.kind === 'value');
}
