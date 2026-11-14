import {describe, expect, it} from 'vitest';
import {composeGI, findConVar, findGIEntry, findGIValueEntry, parseGI} from './index';

describe('commented-out ConVars', () => {
    const options = {parseCommentedConVars: true};
    const input = [
        'GameInfo {',
        '    // fps_max 30',
        '    ConVars {',
        '        // Frame rate limit',
        '        // "fps_max" "120" [$WIN32] // Optional cap',
        '        // fps_max invalid',
        '        // fps_max 120 extra',
        '        // fps_max "unterminated',
        '        // unknown_cvar 1',
        '        fps_max 60 // sv_cheats true',
        '        // sv_cheats 2',
        '        // sv_cheats 0',
        '    }',
        '}',
    ].join('\n');

    it('looks up exact ConVar names and their source metadata', () => {
        expect(findConVar('fps_max')).toMatchObject({name: 'fps_max', defaultValue: '400', flags: ['a', 'release']});
        expect(findConVar('FPS_MAX')).toBeUndefined();
        expect(findConVar('constructor')).toBeUndefined();
    });

    it('keeps recognized settings in order and round-trips them as comments', () => {
        expect(findGIValueEntry(parseGI(input), 'ConVars', 'sv_cheats')).toBeUndefined();

        const document = parseGI(input, options);
        expect(findGIEntry(document, 'ConVars')).toMatchObject({
            leadingComments: ['fps_max 30'],
            entries: [
                {key: 'fps_max', value: '120', condition: '$WIN32', commentedOut: true,
                    leadingComments: ['Frame rate limit'], inlineComments: ['Optional cap']},
                {key: 'fps_max', value: 'invalid', commentedOut: true},
                {key: 'fps_max', value: 60,
                    leadingComments: ['fps_max 120 extra', 'fps_max "unterminated', 'unknown_cvar 1'],
                    inlineComments: ['sv_cheats true']},
                {key: 'sv_cheats', value: 2, commentedOut: true},
                {key: 'sv_cheats', value: 0, commentedOut: true},
            ],
        });
        expect(parseGI(composeGI(document), options)).toEqual(document);
        expect(composeGI(document, {stripComments: true})).toBe('GameInfo\n{\n    ConVars\n    {\n        fps_max 60\n    }\n}\n');

        const disabled = findGIValueEntry(document, 'ConVars', 'sv_cheats')!;
        disabled.commentedOut = false;
        expect(composeGI(document)).toContain('\n        sv_cheats 2\n');
        expect(composeGI(document, {stripComments: true})).toContain('\n        sv_cheats 2\n');
    });
});
