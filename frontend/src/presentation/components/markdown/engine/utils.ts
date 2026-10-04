import {
    codeBlockPattern,
    htmlTagPattern,
    incompleteLinkImageUrlPattern,
    incompleteLinkImageUrlSuffixPattern,
    linkImagePattern,
    linkImageUrlSuffixPattern,
    trailingWhitespacePattern,
} from './pattern'

export interface TextRange {
    start: number
    end: number
}

export function findLastParagraphStart(lines: string[], skipTrailingEmpty = false): number {
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i]
        if (line === undefined) continue
        if (skipTrailingEmpty && i === lines.length - 1 && line.trim() === '') continue
        if (line.trim() === '') return i + 1
    }
    return 0
}

export function getLastParagraphWithIndex(
    content: string,
    skipTrailingEmpty = false,
): { lastParagraph: string; startIndex: number } {
    const lines = content.split('\n')
    const startIndex = findLastParagraphStart(lines, skipTrailingEmpty)
    return {
        lastParagraph: lines.slice(startIndex).join('\n'),
        startIndex,
    }
}

export function findLastNonEmptyLineIndex(lines: string[]): number {
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i]
        if (line && line.trim() !== '') return i
    }
    return -1
}

export function calculateParagraphOffset(paragraphStartIndex: number, lines: string[]): number {
    if (paragraphStartIndex === 0) return 0
    const beforeParagraph = lines.slice(0, paragraphStartIndex).join('\n')
    return beforeParagraph.length > 0 ? beforeParagraph.length + 1 : 0
}

export function isWithinCodeBlock(text: string, position: number): boolean {
    let inCodeBlock = false
    for (let i = 0; i < position; i++) {
        if (text[i] === '`' && text[i + 1] === '`' && text[i + 2] === '`') {
            inCodeBlock = !inCodeBlock
            i += 2
        }
    }
    return inCodeBlock
}

export function isInsideUnclosedCodeBlock(content: string): boolean {
    return isWithinCodeBlock(content, content.length)
}

export function findClosedCodeBlockRanges(content: string): TextRange[] {
    const ranges: TextRange[] = []
    let searchStart = 0

    while (true) {
        const start = content.indexOf('```', searchStart)
        if (start === -1) break

        const end = content.indexOf('```', start + 3)
        if (end === -1) break

        ranges.push({ start, end: end + 3 })
        searchStart = end + 3
    }

    return ranges
}

export function isRangeOverlappingRanges(start: number, end: number, ranges: TextRange[]): boolean {
    return ranges.some(
        (range) =>
            (start >= range.start && start < range.end) ||
            (end > range.start && end <= range.end) ||
            (start < range.start && end > range.end),
    )
}

function isBeforeClosingParen(text: string, position: number): boolean {
    for (let j = position; j < text.length; j++) {
        if (text[j] === ')') return true
        if (text[j] === '\n') return false
    }
    return false
}

export function isWithinLinkOrImageUrl(text: string, position: number): boolean {
    for (let i = position - 1; i >= 0; i--) {
        if (text[i] === ')') return false
        if (text[i] === '(') {
            if (i > 0 && text[i - 1] === ']') {
                const hasClosingParen = isBeforeClosingParen(text, position)
                return !hasClosingParen || true
            }
            return false
        }
        if (text[i] === '\n') return false
    }
    return false
}

export function isWithinHtmlTag(text: string, position: number): boolean {
    let inHtmlTag = false
    for (let i = 0; i < position; i++) {
        if (text[i] === '<') {
            if (i === 0 || text[i - 1] !== '\\') inHtmlTag = true
        } else if (text[i] === '>') {
            if (inHtmlTag && i > 0 && text[i - 1] !== '\\') inHtmlTag = false
        }
    }
    return inHtmlTag
}

export function removeUrlsFromText(text: string): string {
    const withoutCodeBlocks = text.replace(codeBlockPattern, '')
    let result = withoutCodeBlocks.replace(htmlTagPattern, '')
    result = result.replace(linkImagePattern, (match) =>
        match.replace(linkImageUrlSuffixPattern, ']()'),
    )
    result = result.replace(incompleteLinkImageUrlPattern, (match) =>
        match.replace(incompleteLinkImageUrlSuffixPattern, ']('),
    )
    return result
}

export function appendBeforeTrailingWhitespace(content: string, suffix: string): string {
    const match = content.match(trailingWhitespacePattern)
    const trailing = match ? match[0] : ''
    const withoutTrailing = trailing.length > 0 ? content.slice(0, -trailing.length) : content
    return `${withoutTrailing}${suffix}${trailing}`
}
