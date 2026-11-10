import {MAX_NESTING, type ComposeOptions, type GICommentLine, type GIDocument, type GIEntry, type GIValueEntry} from './types';
import {conditionHasInvalidCharacters, isNumericToken, readToken} from './tokens';

function quote(text: string): string {
    const escaped = text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\t/g, '\\t');
    return `"${escaped}"`;
}

function formatKey(key: string): string {
    const token = key.startsWith('"') ? undefined : readToken(key, 0);
    return token?.end === key.length ? key : quote(key);
}

function formatValue({value, numberSource}: GIValueEntry): string {
    if (typeof value === 'string') {
        return value === numberSource && isNumericToken(value) ? value : quote(value);
    }
    if (typeof value === 'number' && (!Number.isFinite(value) || (Number.isInteger(value) && !Number.isSafeInteger(value)))) {
        throw new Error('Expected a finite number or a safe integer');
    }
    return String(value);
}

function append(line: string, text: string, indent: string): string {
    return (line ? line + ' ' : indent) + text;
}

export function composeGI(document: GIDocument, options: ComposeOptions = {}): string {
    const lines: string[] = [];
    let afterBackslashComment = false;

    function writeLine(line: string, standaloneComment = false): void {
        // Deadlock can reject an active line immediately after a backslash-ended comment.
        if (line && !standaloneComment && afterBackslashComment) lines.push('');
        lines.push(line);
        afterBackslashComment = false;
    }

    function writeComments(comments: GICommentLine[] | undefined, indent: string, prefix?: string): string {
        let line = prefix ?? '';
        if (comments === undefined) return line;

        for (const comment of comments) {
            if (comment === null) {
                if (line) writeLine(line);
                if (lines.length && lines.at(-1) !== '') writeLine('');
                line = '';
            } else if (options.stripComments) {
                continue;
            } else if (typeof comment === 'string') {
                for (const text of comment.split(/\r\n|\r|\n/)) {
                    const trimmed = text.trim();
                    writeLine(append(line, trimmed ? '// ' + trimmed : '//', indent), !line);
                    afterBackslashComment = trimmed.endsWith('\\');
                    line = '';
                }
            } else {
                if (comment.text.includes('*/')) throw new Error('A block comment cannot contain its closing delimiter');
                const text = comment.text.trim().split(/\r\n|\r|\n/).map(part => part.trim()).join('\n' + indent);
                line = append(line, text ? `/* ${text} */` : '/* */', indent);
                if (prefix === undefined) {
                    writeLine(line);
                    line = '';
                }
            }
        }
        return line;
    }

    function writeEntry(entry: GIEntry, depth: number): void {
        if (depth > MAX_NESTING) throw new Error(`Maximum nesting depth of ${MAX_NESTING} exceeded`);
        const indent = '    '.repeat(depth);
        writeComments(entry.leadingComments, indent);
        let line = indent + formatKey(entry.key);

        if (entry.kind !== 'flag') {
            if (entry.kind === 'block') {
                writeLine(line);
                writeLine(indent + '{');
                for (const child of entry.entries) writeEntry(child, depth + 1);
                writeComments(entry.beforeCloseComments, indent + '    ');
                line = indent + '}';
            } else {
                line = append(line, formatValue(entry), indent);
            }

            if (entry.condition !== undefined) {
                if (conditionHasInvalidCharacters(entry.condition)) throw new Error('Invalid conditional expression');
                line = append(line, `[${entry.condition.trim()}]`, indent);
            }
        }

        line = writeComments(entry.inlineComments, indent, line);
        if (line) writeLine(line);
    }

    writeEntry(document.root, 0);
    writeComments(document.trailingComments, '');
    if (lines.at(-1) === '') lines.pop();
    return lines.join('\n') + '\n';
}
