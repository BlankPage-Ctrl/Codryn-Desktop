import {
    codeBlockPattern,
    dashWithSpacePattern,
    doubleAsteriskPattern,
    doubleTildePattern,
    doubleUnderscorePattern,
    incompleteBracketPattern,
    incompleteLinkTextPattern,
    incompleteTaskListPattern,
    incompleteUrlPattern,
    pipePattern,
    quoteIncompleteTaskListPattern,
    quoteStandaloneDashPattern,
    quoteTaskListPattern,
    separatorPattern,
    singleAsteriskPattern,
    singleBacktickPattern,
    singleUnderscorePattern,
    standaloneBracketPattern,
    standaloneDashPattern,
    tableRowPattern,
    taskListPattern,
    trailingBackticksPattern,
    trailingStandaloneDashWithNewlinesPattern,
    trailingWhitespacePattern,
} from './pattern'
import {
    appendBeforeTrailingWhitespace,
    calculateParagraphOffset,
    findClosedCodeBlockRanges,
    findLastNonEmptyLineIndex,
    getLastParagraphWithIndex,
    isInsideUnclosedCodeBlock,
    isRangeOverlappingRanges,
    isWithinCodeBlock,
    isWithinHtmlTag,
    isWithinLinkOrImageUrl,
    removeUrlsFromText,
} from './utils'

export type TailFixerName =
    | 'fencedCode'
    | 'strong'
    | 'emphasis'
    | 'strikethrough'
    | 'taskMarker'
    | 'linkBracket'
    | 'tablePipe'

export type TailFixer = (content: string) => string

export function fixFencedCode(content: string): string {
    const isInsideCodeBlock = isInsideUnclosedCodeBlock(content)

    const cleaned = removeTrailingIncompleteBackticks(content)
    const wasCleanedUp = cleaned !== content
    content = cleaned

    if (isInsideCodeBlock && wasCleanedUp) {
        content = fixCodeBlock(content)
    } else if (!wasCleanedUp) {
        content = fixCodeBlock(content)
    }

    if (!wasCleanedUp) content = fixInlineCode(content)

    return content
}

function removeTrailingIncompleteBackticks(content: string): string {
    const match = content.match(trailingBackticksPattern)
    if (!match || !match[1]) return content

    const backtickSequence = match[1]
    const backtickPos = content.lastIndexOf(backtickSequence)
    const beforeBackticks = content.substring(0, backtickPos)
    const afterBackticks = content.substring(backtickPos + backtickSequence.length)

    if (backtickSequence.length === 1) {
        const { lastParagraph } = getLastParagraphWithIndex(beforeBackticks)
        const withoutCodeBlocks = lastParagraph.replace(codeBlockPattern, '')
        const backticks = withoutCodeBlocks.match(singleBacktickPattern)
        const count = backticks ? backticks.length : 0
        const isInCodeBlock = isWithinCodeBlock(beforeBackticks, beforeBackticks.length)

        if (count % 2 === 1 && !isInCodeBlock) return content

        return beforeBackticks.replace(trailingWhitespacePattern, '') + afterBackticks
    }

    if (backtickSequence.length === 2) {
        return beforeBackticks.replace(trailingWhitespacePattern, '') + afterBackticks
    }

    if (backtickSequence.length === 3) {
        const isInCodeBlock = isWithinCodeBlock(beforeBackticks, beforeBackticks.length)
        if (isInCodeBlock) return content
        return beforeBackticks.replace(trailingWhitespacePattern, '') + afterBackticks
    }

    return beforeBackticks.replace(trailingWhitespacePattern, '') + afterBackticks
}

function fixCodeBlock(content: string): string {
    if (isInsideUnclosedCodeBlock(content)) {
        const lastFenceIndex = content.lastIndexOf('```')
        const afterFence = content.substring(lastFenceIndex + 3)

        const hasNewline = afterFence.includes('\n')
        const firstLine = hasNewline ? (afterFence.split('\n')[0] ?? '') : afterFence
        const hasLanguage = firstLine.trim().length > 0

        if (hasLanguage || hasNewline) {
            if (!content.endsWith('\n')) return `${content}\n\`\`\``
            return `${content}\`\`\``
        }
    }
    return content
}

function fixInlineCode(content: string): string {
    const lines = content.split('\n')
    const { lastParagraph, startIndex: paragraphStartIndex } = getLastParagraphWithIndex(content)

    const withoutCodeBlocks = lastParagraph.replace(codeBlockPattern, '')
    const backticks = withoutCodeBlocks.match(singleBacktickPattern)
    const count = backticks ? backticks.length : 0

    if (count % 2 === 1) {
        let lastBacktickPos = -1
        for (let i = 0; i < lastParagraph.length; i++) {
            if (lastParagraph.substring(i).startsWith('```')) {
                const closeIndex = lastParagraph.indexOf('```', i + 3)
                if (closeIndex !== -1) {
                    i = closeIndex + 2
                    continue
                }
            }
            if (lastParagraph[i] === '`') {
                const before = lastParagraph[i - 1] || ''
                const before2 = lastParagraph[i - 2] || ''
                const after = lastParagraph[i + 1] || ''
                const after2 = lastParagraph[i + 2] || ''

                const isPartOfTriple =
                    (before === '`' && before2 === '`') ||
                    (before === '`' && after === '`') ||
                    (after === '`' && after2 === '`')

                if (isPartOfTriple) continue
                lastBacktickPos = i
            }
        }

        if (lastBacktickPos !== -1) {
            const offset = calculateParagraphOffset(paragraphStartIndex, lines)
            const actualPos = offset + lastBacktickPos
            const afterLast = content.substring(actualPos + 1).trim()
            if (afterLast.length > 0) return `${content}\``
        }
    }

    return content
}

export function fixStrong(content: string): string {
    if (content === '*' || content === '_') return ''

    if (isInsideUnclosedCodeBlock(content)) return content

    const lines = content.split('\n')
    const { lastParagraph, startIndex: paragraphStartIndex } = getLastParagraphWithIndex(
        content,
        true,
    )

    const lastParagraphWithoutCodeBlocks = lastParagraph.replace(codeBlockPattern, '')
    const lastParagraphWithoutCodeBlocksAndUrls = removeUrlsFromText(lastParagraphWithoutCodeBlocks)

    const endsWithSingleAsterisk = content.endsWith('*') && !content.endsWith('**')
    const endsWithSingleUnderscore = content.endsWith('_') && !content.endsWith('__')

    const asteriskMatches = lastParagraphWithoutCodeBlocksAndUrls.match(doubleAsteriskPattern)
    const asteriskCount = asteriskMatches ? asteriskMatches.length : 0

    const underscoreMatches = lastParagraphWithoutCodeBlocksAndUrls.match(doubleUnderscorePattern)
    const underscoreCount = underscoreMatches ? underscoreMatches.length : 0

    let needsAsteriskCompletion = false
    let needsUnderscoreCompletion = false
    let needsAsteriskRemoval = false
    let needsUnderscoreRemoval = false

    if (asteriskCount % 2 === 1) {
        let actualLastStarPos = -1
        let inCodeBlock = false
        for (let i = 0; i < lastParagraph.length - 1; i++) {
            if (lastParagraph.substring(i, i + 3) === '```') {
                inCodeBlock = !inCodeBlock
                i += 2
                continue
            }
            if (inCodeBlock) continue
            if (lastParagraph.substring(i, i + 2) === '**') {
                actualLastStarPos = i
                i += 1
            }
        }
        const paragraphOffset = calculateParagraphOffset(paragraphStartIndex, lines)
        const absoluteLastStarPos = paragraphOffset + actualLastStarPos

        if (
            isWithinLinkOrImageUrl(content, absoluteLastStarPos) ||
            isWithinHtmlTag(content, absoluteLastStarPos)
        ) {
            return content
        }

        const afterLast = lastParagraphWithoutCodeBlocksAndUrls
            .substring(lastParagraphWithoutCodeBlocksAndUrls.lastIndexOf('**') + 2)
            .trim()

        if (afterLast.length > 0) {
            needsAsteriskCompletion = true
        } else {
            needsAsteriskRemoval = true
        }
    }

    if (underscoreCount % 2 === 1) {
        let actualLastUnderscorePos = -1
        let inCodeBlock = false
        for (let i = 0; i < lastParagraph.length - 1; i++) {
            if (lastParagraph.substring(i, i + 3) === '```') {
                inCodeBlock = !inCodeBlock
                i += 2
                continue
            }
            if (inCodeBlock) continue
            if (lastParagraph.substring(i, i + 2) === '__') {
                actualLastUnderscorePos = i
                i += 1
            }
        }
        const paragraphOffset = calculateParagraphOffset(paragraphStartIndex, lines)
        const absoluteLastUnderscorePos = paragraphOffset + actualLastUnderscorePos

        if (
            isWithinLinkOrImageUrl(content, absoluteLastUnderscorePos) ||
            isWithinHtmlTag(content, absoluteLastUnderscorePos)
        ) {
            return content
        }

        const afterLast = lastParagraphWithoutCodeBlocksAndUrls
            .substring(lastParagraphWithoutCodeBlocksAndUrls.lastIndexOf('__') + 2)
            .trim()

        if (afterLast.length > 0) {
            needsUnderscoreCompletion = true
        } else {
            needsUnderscoreRemoval = true
        }
    }

    let removedTrailingSingle = false
    if (endsWithSingleAsterisk && (needsAsteriskCompletion || needsAsteriskRemoval)) {
        content = content.slice(0, -1)
        removedTrailingSingle = true
        const { lastParagraph: newLastParagraph } = getLastParagraphWithIndex(content, true)
        const newLastParagraphWithoutCodeBlocks = newLastParagraph.replace(codeBlockPattern, '')
        const newLastParagraphWithoutCodeBlocksAndUrls = removeUrlsFromText(
            newLastParagraphWithoutCodeBlocks,
        )
        const newAsteriskMatches =
            newLastParagraphWithoutCodeBlocksAndUrls.match(doubleAsteriskPattern)
        const newAsteriskCount = newAsteriskMatches ? newAsteriskMatches.length : 0
        if (newAsteriskCount % 2 === 1) {
            const lastStarPos = newLastParagraphWithoutCodeBlocksAndUrls.lastIndexOf('**')
            const afterLast = newLastParagraphWithoutCodeBlocksAndUrls
                .substring(lastStarPos + 2)
                .trim()
            if (afterLast.length > 0) {
                needsAsteriskCompletion = true
                needsAsteriskRemoval = false
            } else {
                needsAsteriskRemoval = true
                needsAsteriskCompletion = false
            }
        }
    }

    if (endsWithSingleUnderscore && (needsUnderscoreCompletion || needsUnderscoreRemoval)) {
        content = content.slice(0, -1)
        removedTrailingSingle = true
        const { lastParagraph: newLastParagraph } = getLastParagraphWithIndex(content, true)
        const newLastParagraphWithoutCodeBlocks = newLastParagraph.replace(codeBlockPattern, '')
        const newLastParagraphWithoutCodeBlocksAndUrls = removeUrlsFromText(
            newLastParagraphWithoutCodeBlocks,
        )
        const newUnderscoreMatches =
            newLastParagraphWithoutCodeBlocksAndUrls.match(doubleUnderscorePattern)
        const newUnderscoreCount = newUnderscoreMatches ? newUnderscoreMatches.length : 0
        if (newUnderscoreCount % 2 === 1) {
            const lastUnderscorePos = newLastParagraphWithoutCodeBlocksAndUrls.lastIndexOf('__')
            const afterLast = newLastParagraphWithoutCodeBlocksAndUrls
                .substring(lastUnderscorePos + 2)
                .trim()
            if (afterLast.length > 0) {
                needsUnderscoreCompletion = true
                needsUnderscoreRemoval = false
            } else {
                needsUnderscoreRemoval = true
                needsUnderscoreCompletion = false
            }
        }
    }

    if (needsAsteriskRemoval) {
        let result = content.slice(0, -2).trimEnd()
        if (trailingStandaloneDashWithNewlinesPattern.test(result)) {
            result = result.replace(trailingStandaloneDashWithNewlinesPattern, '$1')
        }
        return result
    }

    if (needsUnderscoreRemoval) {
        const { lastParagraph: newLastParagraph, startIndex: newParagraphStartIndex } =
            getLastParagraphWithIndex(content)
        const lastUnderscorePos = newLastParagraph.lastIndexOf('__')
        const paragraphOffset = calculateParagraphOffset(
            newParagraphStartIndex,
            content.split('\n'),
        )
        const absoluteLastUnderscorePos = paragraphOffset + lastUnderscorePos
        let result = content.substring(0, absoluteLastUnderscorePos).trimEnd()
        if (trailingStandaloneDashWithNewlinesPattern.test(result)) {
            result = result.replace(trailingStandaloneDashWithNewlinesPattern, '$1')
        }
        return result
    }

    if (needsAsteriskCompletion && needsUnderscoreCompletion) {
        const firstAsteriskPos = lastParagraphWithoutCodeBlocksAndUrls.indexOf('**')
        const firstUnderscorePos = lastParagraphWithoutCodeBlocksAndUrls.indexOf('__')
        if (firstAsteriskPos < firstUnderscorePos) {
            return appendBeforeTrailingWhitespace(content, '__**')
        }
        return appendBeforeTrailingWhitespace(content, '**__')
    }

    if (needsAsteriskCompletion) {
        if (!removedTrailingSingle) {
            const { lastParagraph: currentLastParagraph } = getLastParagraphWithIndex(content, true)
            const currentLastParagraphWithoutCodeBlocks = currentLastParagraph.replace(
                codeBlockPattern,
                '',
            )
            const currentLastParagraphWithoutCodeBlocksAndUrls = removeUrlsFromText(
                currentLastParagraphWithoutCodeBlocks,
            )
            const withoutDoubleAsterisk = currentLastParagraphWithoutCodeBlocksAndUrls.replace(
                doubleAsteriskPattern,
                '',
            )
            const singleAsteriskMatches = withoutDoubleAsterisk.match(singleAsteriskPattern)
            const singleAsteriskCount = singleAsteriskMatches ? singleAsteriskMatches.length : 0
            if (singleAsteriskCount % 2 === 1) {
                return appendBeforeTrailingWhitespace(content, '***')
            }
        }
        return appendBeforeTrailingWhitespace(content, '**')
    }

    if (needsUnderscoreCompletion) {
        if (!removedTrailingSingle) {
            const { lastParagraph: currentLastParagraph } = getLastParagraphWithIndex(content)
            const currentLastParagraphWithoutCodeBlocks = currentLastParagraph.replace(
                codeBlockPattern,
                '',
            )
            const currentLastParagraphWithoutCodeBlocksAndUrls = removeUrlsFromText(
                currentLastParagraphWithoutCodeBlocks,
            )
            const withoutDoubleUnderscore = currentLastParagraphWithoutCodeBlocksAndUrls.replace(
                doubleUnderscorePattern,
                '',
            )
            const singleUnderscoreMatches = withoutDoubleUnderscore.match(singleUnderscorePattern)
            const singleUnderscoreCount = singleUnderscoreMatches
                ? singleUnderscoreMatches.length
                : 0
            if (singleUnderscoreCount % 2 === 1) {
                return appendBeforeTrailingWhitespace(content, '___')
            }
        }
        return appendBeforeTrailingWhitespace(content, '__')
    }

    return content
}

export function fixEmphasis(content: string): string {
    if (isInsideUnclosedCodeBlock(content)) return content

    const lines = content.split('\n')
    const { lastParagraph, startIndex: paragraphStartIndex } = getLastParagraphWithIndex(content)

    const lastParagraphWithoutCodeBlocks = lastParagraph.replace(codeBlockPattern, '')
    const lastParagraphWithoutCodeBlocksAndUrls = removeUrlsFromText(lastParagraphWithoutCodeBlocks)

    const withoutDoubleAsterisk = lastParagraphWithoutCodeBlocksAndUrls.replace(
        doubleAsteriskPattern,
        '',
    )
    const asteriskMatches = withoutDoubleAsterisk.match(singleAsteriskPattern)
    const asteriskCount = asteriskMatches ? asteriskMatches.length : 0

    const withoutDoubleUnderscore = lastParagraphWithoutCodeBlocksAndUrls.replace(
        doubleUnderscorePattern,
        '',
    )
    const underscoreMatches = withoutDoubleUnderscore.match(singleUnderscorePattern)
    const underscoreCount = underscoreMatches ? underscoreMatches.length : 0

    let needsAsteriskCompletion = false
    let needsUnderscoreCompletion = false
    let needsAsteriskRemoval = false
    let needsUnderscoreRemoval = false

    if (asteriskCount % 2 === 1) {
        const paragraphOffset = calculateParagraphOffset(paragraphStartIndex, lines)
        let lastStarPos = -1

        for (let i = lastParagraph.length - 1; i >= 0; i--) {
            if (lastParagraph[i] === '*') {
                const absolutePos = paragraphOffset + i
                if (i > 0 && lastParagraph[i - 1] === '*') continue
                if (
                    !isWithinLinkOrImageUrl(content, absolutePos) &&
                    !isWithinHtmlTag(content, absolutePos)
                ) {
                    lastStarPos = i
                    break
                }
            }
        }

        if (lastStarPos === -1) return content

        let hasContentAfter = false
        for (let i = lastStarPos + 1; i < lastParagraph.length; i++) {
            const char = lastParagraph[i]
            if (char !== undefined && char.trim() !== '') {
                hasContentAfter = true
                break
            }
        }

        if (hasContentAfter) {
            needsAsteriskCompletion = true
        } else {
            needsAsteriskRemoval = true
        }
    }

    if (underscoreCount % 2 === 1) {
        const paragraphOffset = calculateParagraphOffset(paragraphStartIndex, lines)
        let lastUnderscorePos = -1

        for (let i = lastParagraph.length - 1; i >= 0; i--) {
            if (lastParagraph[i] === '_') {
                const absolutePos = paragraphOffset + i
                if (i > 0 && lastParagraph[i - 1] === '_') continue
                if (
                    !isWithinLinkOrImageUrl(content, absolutePos) &&
                    !isWithinHtmlTag(content, absolutePos)
                ) {
                    lastUnderscorePos = i
                    break
                }
            }
        }

        if (lastUnderscorePos === -1) return content

        let hasContentAfter = false
        for (let i = lastUnderscorePos + 1; i < lastParagraph.length; i++) {
            const char = lastParagraph[i]
            if (char !== undefined && char.trim() !== '') {
                hasContentAfter = true
                break
            }
        }

        if (hasContentAfter) {
            needsUnderscoreCompletion = true
        } else {
            needsUnderscoreRemoval = true
        }
    }

    if (needsAsteriskRemoval) {
        let result = content.slice(0, -1).trimEnd()
        if (trailingStandaloneDashWithNewlinesPattern.test(result)) {
            result = result.replace(trailingStandaloneDashWithNewlinesPattern, '$1')
        }
        return result
    }

    if (needsUnderscoreRemoval) {
        const paragraphOffset = calculateParagraphOffset(paragraphStartIndex, lines)
        let lastUnderscorePosInOriginal = -1
        for (let i = lastParagraph.length - 1; i >= 0; i--) {
            if (lastParagraph[i] === '_' && (i === 0 || lastParagraph[i - 1] !== '_')) {
                const absolutePos = paragraphOffset + i
                if (
                    !isWithinLinkOrImageUrl(content, absolutePos) &&
                    !isWithinHtmlTag(content, absolutePos)
                ) {
                    lastUnderscorePosInOriginal = absolutePos
                    break
                }
            }
        }
        let result = content.substring(0, lastUnderscorePosInOriginal).trimEnd()
        if (trailingStandaloneDashWithNewlinesPattern.test(result)) {
            result = result.replace(trailingStandaloneDashWithNewlinesPattern, '$1')
        }
        return result
    }

    if (needsAsteriskCompletion && needsUnderscoreCompletion) {
        const firstStarPos = withoutDoubleAsterisk.indexOf('*')
        const firstUnderscorePos = withoutDoubleUnderscore.indexOf('_')
        if (firstStarPos < firstUnderscorePos) {
            return `${content}_*`
        }
        return `${content}*_`
    }

    if (needsAsteriskCompletion) return `${content}*`

    if (needsUnderscoreCompletion) return `${content}_`

    return content
}

export function fixStrikethrough(content: string): string {
    if (isInsideUnclosedCodeBlock(content)) return content

    const { lastParagraph, startIndex: paragraphStartIndex } = getLastParagraphWithIndex(content)

    const lastParagraphWithoutCodeBlocks = lastParagraph.replace(codeBlockPattern, '')
    const lastParagraphWithoutCodeBlocksAndUrls = removeUrlsFromText(lastParagraphWithoutCodeBlocks)

    const matches = lastParagraphWithoutCodeBlocksAndUrls.match(doubleTildePattern)
    const count = matches ? matches.length : 0

    const endsWithSingleTilde = content.endsWith('~') && !content.endsWith('~~')

    if (endsWithSingleTilde) {
        const contentWithoutLastTilde = content.slice(0, -1)
        const lastParagraphWithoutTilde = contentWithoutLastTilde
            .split('\n')
            .slice(paragraphStartIndex)
            .join('\n')
        const lastParagraphWithoutTildeAndCodeBlocks = lastParagraphWithoutTilde.replace(
            codeBlockPattern,
            '',
        )
        const lastParagraphWithoutTildeAndCodeBlocksAndUrls = removeUrlsFromText(
            lastParagraphWithoutTildeAndCodeBlocks,
        )
        const matchesWithoutTilde =
            lastParagraphWithoutTildeAndCodeBlocksAndUrls.match(doubleTildePattern)
        const countWithoutTilde = matchesWithoutTilde ? matchesWithoutTilde.length : 0

        if (countWithoutTilde % 2 === 1) {
            const lastTildePos = lastParagraphWithoutTildeAndCodeBlocksAndUrls.lastIndexOf('~~')
            if (lastTildePos >= 0) {
                const afterLastTilde = lastParagraphWithoutTildeAndCodeBlocksAndUrls.substring(
                    lastTildePos + 2,
                )
                if (afterLastTilde.length > 0) {
                    return `${content}~`
                }
            }
        } else {
            return contentWithoutLastTilde
        }
    }

    if (count % 2 === 1) {
        const lines = content.split('\n')
        let actualLastTildePos = -1
        let inCodeBlock = false
        for (let i = 0; i < lastParagraph.length - 1; i++) {
            if (lastParagraph.substring(i, i + 3) === '```') {
                inCodeBlock = !inCodeBlock
                i += 2
                continue
            }
            if (inCodeBlock) continue
            if (lastParagraph.substring(i, i + 2) === '~~') {
                actualLastTildePos = i
                i += 1
            }
        }
        if (actualLastTildePos === -1) return content

        const paragraphOffset = calculateParagraphOffset(paragraphStartIndex, lines)
        const absoluteLastTildePos = paragraphOffset + actualLastTildePos

        if (
            isWithinLinkOrImageUrl(content, absoluteLastTildePos) ||
            isWithinHtmlTag(content, absoluteLastTildePos)
        ) {
            return content
        }

        const afterLast = lastParagraphWithoutCodeBlocksAndUrls.substring(
            lastParagraphWithoutCodeBlocksAndUrls.lastIndexOf('~~') + 2,
        )
        const afterLastTrimmed = afterLast.trim()

        if (afterLastTrimmed.length > 0) {
            return `${content}~~`
        }
        const beforeTilde = content.substring(0, content.length - afterLast.length - 2)
        return beforeTilde.trimEnd()
    }

    return content
}

export function fixTaskMarker(content: string): string {
    if (isInsideUnclosedCodeBlock(content)) return content

    const codeBlockRanges = findClosedCodeBlockRanges(content)
    const lines = content.split('\n')

    const lastLine = lines[lines.length - 1]
    if (!lastLine) return content

    let lastLineStartPos = 0
    for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i]
        if (line !== undefined) lastLineStartPos += line.length + 1
    }
    const lastLineEndPos = lastLineStartPos + lastLine.length

    if (isRangeOverlappingRanges(lastLineStartPos, lastLineEndPos, codeBlockRanges)) {
        return content
    }

    if (quoteIncompleteTaskListPattern.test(lastLine)) {
        return lines.slice(0, -1).join('\n')
    }

    if (quoteStandaloneDashPattern.test(lastLine) && !quoteTaskListPattern.test(lastLine)) {
        return lines.slice(0, -1).join('\n')
    }

    if (incompleteTaskListPattern.test(lastLine)) {
        return lines.slice(0, -1).join('\n')
    }

    if (standaloneDashPattern.test(lastLine) && !taskListPattern.test(lastLine)) {
        return lines.slice(0, -1).join('\n')
    }

    if (dashWithSpacePattern.test(lastLine) && !taskListPattern.test(lastLine)) {
        return lines.slice(0, -1).join('\n')
    }

    return content
}

export function fixLinkBracket(content: string): string {
    if (isInsideUnclosedCodeBlock(content)) return content

    const lines = content.split('\n')
    const { lastParagraph } = getLastParagraphWithIndex(content)
    const lastParagraphWithoutCodeBlocks = lastParagraph.replace(codeBlockPattern, '')

    const lastNonEmptyLineIndex = findLastNonEmptyLineIndex(lines)

    if (lastNonEmptyLineIndex >= 0) {
        const lastLine = lines[lastNonEmptyLineIndex] ?? ''

        const standaloneBracketMatch = lastLine.match(standaloneBracketPattern)
        if (standaloneBracketMatch && standaloneBracketMatch[1]) {
            const bracket = standaloneBracketMatch[1]
            const bracketPos = lastLine.lastIndexOf(bracket)
            const beforeBracket = lastLine.substring(0, bracketPos).trimEnd()
            const newLines = [...lines]
            newLines[lastNonEmptyLineIndex] = beforeBracket

            if (lastNonEmptyLineIndex + 1 < newLines.length) {
                const nextLine = newLines[lastNonEmptyLineIndex + 1] as string
                if (nextLine.trim() === '') newLines.splice(lastNonEmptyLineIndex + 1, 1)
            }

            return newLines.join('\n')
        }
    }

    if (incompleteBracketPattern.test(lastParagraphWithoutCodeBlocks)) {
        return `${content}]()`
    }

    if (incompleteLinkTextPattern.test(lastParagraphWithoutCodeBlocks)) {
        return `${content}()`
    }

    if (incompleteUrlPattern.test(lastParagraphWithoutCodeBlocks)) {
        return `${content})`
    }

    return content
}

export function fixTablePipe(content: string): string {
    if (isInsideUnclosedCodeBlock(content)) return content

    const codeBlockRanges = findClosedCodeBlockRanges(content)
    const { lastParagraph } = getLastParagraphWithIndex(content, true)
    const paragraphLines = lastParagraph.split('\n').filter((line) => line.trim() !== '')

    if (paragraphLines.length === 0) return content

    let headerRowIndex = -1
    let headerRow = ''

    for (let i = 0; i < paragraphLines.length; i++) {
        const line = paragraphLines[i]
        const trimmedLine = (line || '').trim()
        if (
            tableRowPattern.test(trimmedLine) ||
            (trimmedLine.startsWith('|') && trimmedLine.length > 1)
        ) {
            headerRowIndex = i
            headerRow = trimmedLine
            break
        }
    }

    if (headerRowIndex === -1) return content

    const headerRowPos = content.lastIndexOf(headerRow)
    if (headerRowPos !== -1) {
        const headerRowEndPos = headerRowPos + headerRow.length
        const isHeaderRowInCodeBlock = isRangeOverlappingRanges(
            headerRowPos,
            headerRowEndPos,
            codeBlockRanges,
        )
        if (isHeaderRowInCodeBlock) return content
    }

    const trimmedHeader = headerRow.trim()
    const isHeaderComplete = trimmedHeader.endsWith('|')

    let completedHeaderRow = headerRow
    if (!isHeaderComplete) completedHeaderRow = `${trimmedHeader} |`

    const headerColumns = (completedHeaderRow.match(pipePattern) || []).length - 1
    const separator = generateSeparator(headerColumns)

    const beforeHeaderRow = content.substring(0, headerRowPos)
    const afterHeaderRow = content.substring(headerRowPos + headerRow.length)

    if (headerRowIndex === paragraphLines.length - 1) {
        const newContent = isHeaderComplete
            ? content
            : `${beforeHeaderRow}${completedHeaderRow}${afterHeaderRow}`
        if (newContent.endsWith('\n')) return `${newContent}${separator}`
        return `${newContent}\n${separator}`
    }

    const nextLineRaw = paragraphLines[headerRowIndex + 1]
    const nextLine = (nextLineRaw || '').trim()

    if (separatorPattern.test(nextLine)) {
        const separatorColumns = (nextLine.match(pipePattern) || []).length - 1
        if (separatorColumns === headerColumns) {
            if (!isHeaderComplete) return `${beforeHeaderRow}${completedHeaderRow}${afterHeaderRow}`
            return content
        }
    }

    const afterLines = afterHeaderRow.split('\n')
    const nextLineInContent = afterLines[1] || ''
    const newHeader = isHeaderComplete ? headerRow : completedHeaderRow

    if (nextLineInContent.startsWith('|') && nextLineInContent.includes('-')) {
        const remainingLines = afterLines.slice(2).join('\n')
        if (remainingLines.length > 0) {
            return `${beforeHeaderRow}${newHeader}\n${separator}\n${remainingLines}`
        }
        return `${beforeHeaderRow}${newHeader}\n${separator}`
    }

    const remainingContent = afterLines.slice(1).join('\n')
    return `${beforeHeaderRow}${newHeader}\n${separator}\n${remainingContent}`
}

function generateSeparator(columns: number): string {
    const parts: string[] = []
    for (let i = 0; i < columns; i++) parts.push(' --- ')
    return `|${parts.join('|')}|`
}

export const DEFAULT_TAIL_FIXERS: Record<TailFixerName, TailFixer> = {
    fencedCode: fixFencedCode,
    strong: fixStrong,
    emphasis: fixEmphasis,
    strikethrough: fixStrikethrough,
    taskMarker: fixTaskMarker,
    linkBracket: fixLinkBracket,
    tablePipe: fixTablePipe,
}

export const DEFAULT_TAIL_FIXER_ORDER: TailFixerName[] = [
    'fencedCode',
    'strong',
    'emphasis',
    'strikethrough',
    'taskMarker',
    'linkBracket',
    'tablePipe',
]

export function patchStreamingTail(
    content: string,
    names: TailFixerName[] = DEFAULT_TAIL_FIXER_ORDER,
): string {
    return names.reduce((result, name) => DEFAULT_TAIL_FIXERS[name](result), content)
}
