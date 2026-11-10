import {MAX_NESTING, type GIBlockEntry, type GIComment, type GICommentLine, type GIDocument, type GIEntry, type GIValueEntry} from './types';
import {conditionHasInvalidCharacters, isNumericToken, isWhitespace, readToken, scalarValue} from './tokens';

interface CommentGap {
    inline: GIComment[];
    leading: GICommentLine[];
}

function hasComments(gap: CommentGap): boolean {
    return gap.inline.length > 0 || gap.leading.some(comment => comment !== null);
}

class KeyValuesParser {
    private pos = 0;
    private readonly content: string;

    constructor(content: string) {
        this.content = content;
    }

    parse(): GIDocument {
        const header = this.readGap();
        const leadingComments = [...header.inline, ...header.leading];
        if (leadingComments[0] === null) leadingComments.shift();
        const [root, trailingComments] = this.parseEntry(leadingComments, 0);
        if (this.peek()) throw new Error(`Unexpected trailing content at position ${this.pos}`);
        if (root.kind === 'flag') throw new Error('Expected a root value');
        if (trailingComments.at(-1) === null) trailingComments.pop();
        return trailingComments.length ? {root, trailingComments} : {root};
    }

    private parseEntry(leadingComments: GICommentLine[], depth: number): [GIEntry, GICommentLine[]] {
        if (depth > MAX_NESTING) throw new Error(`Maximum nesting depth of ${MAX_NESTING} exceeded`);

        const key = readToken(this.content, this.pos);
        if (!key) throw new Error(`Expected key at position ${this.pos}`);
        this.pos = key.end;
        const afterKey = this.readGap();
        const base = {key: key.text, ...(leadingComments.length ? {leadingComments} : {})};

        // A final key without a value is a flag (like in hidden_maps).
        if (depth > 0 && this.peek() === '}') {
            const flag: GIEntry = {...base, kind: 'flag'};
            if (afterKey.inline.length) flag.inlineComments = afterKey.inline;
            return [flag, afterKey.leading];
        }

        let entry: GIBlockEntry | GIValueEntry;
        if (this.peek() === '{') {
            this.pos++;
            const gap = this.readGap();
            let comments = [...gap.inline, ...gap.leading];
            const entries: GIEntry[] = [];
            while (this.peek() !== '}') {
                const [child, remaining] = this.parseEntry(comments, depth + 1);
                entries.push(child);
                comments = remaining;
            }
            this.pos++;
            entry = {...base, kind: 'block', entries};
            if (comments.length) entry.beforeCloseComments = comments;
        } else {
            const token = readToken(this.content, this.pos);
            if (!token) throw new Error(`Expected value at position ${this.pos}`);
            this.pos = token.end;
            const value = scalarValue(token);
            const numberSource = !token.quoted && typeof value === 'string' && isNumericToken(value)
                ? value
                : undefined;
            entry = {...base, kind: 'value', value, ...(numberSource === undefined ? {} : {numberSource})};
        }

        if (hasComments(afterKey)) {
            throw new Error(`Comments between a key and its value or block are unsupported near position ${key.end}`);
        }
        let gap = this.readGap();
        if (this.peek() === '[') {
            if (hasComments(gap)) {
                throw new Error(`Comments before a condition are unsupported near position ${this.pos}`);
            }
            entry.condition = this.parseCondition();
            gap = this.readGap();
        }
        if (gap.inline.length) entry.inlineComments = gap.inline;
        return [entry, gap.leading];
    }

    private readGap(): CommentGap {
        const inline: GIComment[] = [];
        const leading: GICommentLine[] = [];
        let ownLine = false;
        let lineBreaks = 0;
        while (this.pos < this.content.length) {
            const start = this.pos;
            const char = this.peek();
            if (isWhitespace(char)) {
                if (char === '\n' || char === '\r') {
                    ownLine = true;
                    if (++lineBreaks === 2) leading.push(null);
                    if (char === '\r' && this.content[this.pos + 1] === '\n') this.pos++;
                }
                this.pos++;
            } else if (this.content.startsWith('//', start)) {
                this.pos += 2;
                while (this.peek() && this.peek() !== '\n' && this.peek() !== '\r') this.pos++;
                (ownLine ? leading : inline).push(this.content.slice(start + 2, this.pos).trim());
                lineBreaks = 0;
            } else if (this.content.startsWith('/*', start)) {
                const end = this.content.indexOf('*/', start + 2);
                if (end === -1) throw new Error(`Unterminated block comment at position ${start}`);
                const text = this.content.slice(start + 2, end);
                (ownLine ? leading : inline).push({
                    style: 'block',
                    text: text.trim().split(/\r\n|\r|\n/).map(part => part.trim()).join('\n'),
                });
                if (/[\r\n]/.test(text)) ownLine = true;
                lineBreaks = 0;
                this.pos = end + 2;
            } else {
                break;
            }
        }
        return {inline, leading};
    }

    private parseCondition(): string {
        const start = ++this.pos;
        while (this.peek() && this.peek() !== ']') {
            if (conditionHasInvalidCharacters(this.peek())) break;
            this.pos++;
        }
        if (this.peek() !== ']') throw new Error(`Expected closing ']' for condition at position ${this.pos}`);
        const condition = this.content.slice(start, this.pos).trim();
        this.pos++;
        return condition;
    }

    private peek(): string {
        return this.content[this.pos] ?? '';
    }
}

export function parseGI(content: string): GIDocument {
    return new KeyValuesParser(content).parse();
}
