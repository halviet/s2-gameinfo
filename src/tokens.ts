import type {GIPrimitive} from './types';

interface Token {
    text: string;
    end: number;
    quoted: boolean;
}

export function isWhitespace(char: string): boolean {
    return /[ \t\r\n\uFEFF]/.test(char);
}

export function startsComment(text: string, start: number): boolean {
    return text.startsWith('//', start) || text.startsWith('/*', start);
}

export function readToken(content: string, start: number): Token | undefined {
    let end = start;
    if (content[start] !== '"') {
        if (startsComment(content, start)) return undefined;
        while (end < content.length && !isWhitespace(content[end]!) && !'{}[]"'.includes(content[end]!)) {
            end++;
        }
        if (end === start) return undefined;
        return {text: content.slice(start, end), end, quoted: false};
    }

    end++;
    let text = '';
    while (end < content.length) {
        const char = content[end++];
        if (char === '"') return {text, end, quoted: true};
        if (char === '\\' && end < content.length) {
            const next = content[end++];
            switch (next) {
                case '"': text += '"'; break;
                case '\\': text += '\\'; break;
                case 'n': text += '\n'; break;
                case 't': text += '\t'; break;
                default: text += '\\' + next;
            }
        } else {
            text += char;
        }
    }
    throw new Error(`Unterminated string at position ${start}`);
}

export function scalarValue(token: Token): GIPrimitive {
    const {text, quoted} = token;
    if (quoted) return text;
    if (text === 'true') return true;
    if (text === 'false') return false;
    if (isNumericToken(text)) {
        const number = Number(text);
        if (Number.isFinite(number) && (!Number.isInteger(number) || Number.isSafeInteger(number))) {
            return number === 0 ? 0 : number;
        }
    }
    return text;
}

export function isNumericToken(text: string): boolean {
    return /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(text);
}

export function conditionHasInvalidCharacters(text: string): boolean {
    return /[\r\n}]/.test(text) || text.includes(']');
}
