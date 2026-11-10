import {assert, describe, expect, it} from 'vitest';
import {composeGI, findGIEntries, findGIEntry, findGIValueEntry, parseGI} from './index';

describe('document navigation', () => {
    it('finds an editable value through a nested path', () => {
        const document = parseGI('GameInfo { ConVars { fps_max 400 // FPS cap\n } }');
        const fps = findGIValueEntry(document, 'ConVars', 'fps_max');
        assert(fps);
        expect(fps.value).toBe(400);
        fps.value = 120;
        fps.inlineComments = ['Test cap'];

        expect(composeGI(document)).toContain('fps_max 120 // Test cap');
    });

    it('returns every match through repeated blocks in source order', () => {
        const document = parseGI('GameInfo { Paths { Game first Other x Game second } Paths ignored Paths { Game third } }');
        const matches = findGIEntries(document, 'Paths', 'Game');
        expect(matches).toMatchObject([{value: 'first'}, {value: 'second'}, {value: 'third'}]);
        expect(findGIEntry(document, 'Paths', 'Game')).toBe(matches[0]);
    });

    it('can start from an existing block and uses literal, case-sensitive keys', () => {
        const document = parseGI('GameInfo { ConVars { "fps.max" 60 } }');
        const conVars = findGIEntry(document, 'ConVars');
        assert(conVars?.kind === 'block');
        expect(findGIValueEntry(conVars, 'fps.max')?.value).toBe(60);
        expect(findGIEntry(conVars, 'FPS.MAX')).toBeUndefined();
        expect(findGIEntry(conVars, 'fps', 'max')).toBeUndefined();
    });

    it('finds the first scalar even when an earlier matching entry is a block', () => {
        const document = parseGI('GameInfo { setting {} setting 0 flag }');
        expect(findGIEntry(document, 'setting')?.kind).toBe('block');
        expect(findGIValueEntry(document, 'setting')?.value).toBe(0);
        expect(findGIValueEntry(document, 'flag')).toBeUndefined();
    });

    it('returns empty results for missing paths and roots without children', () => {
        const document = parseGI('GameInfo { title citadel }');
        expect(findGIEntries(document, 'missing', 'child')).toEqual([]);
        expect(findGIEntries(document, 'title', 'child')).toEqual([]);
        expect(findGIEntries(parseGI('title citadel'), 'title')).toEqual([]);
    });
});
