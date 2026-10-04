export const crlfPattern = /\r\n?/g

export const trailingBackticksPattern = /(`+)\s*$/
export const codeBlockPattern = /```[\s\S]*?```/g
export const singleBacktickPattern = /`/g
export const trailingWhitespacePattern = /\s+$/

export const doubleAsteriskPattern = /\*\*/g
export const singleAsteriskPattern = /\*/g
export const doubleUnderscorePattern = /__/g
export const singleUnderscorePattern = /_/g

export const doubleTildePattern = /~~/g

export const incompleteBracketPattern = /!?\[[^\]]*$/
export const incompleteLinkTextPattern = /!?\[[^\]]*\]\s*$/
export const incompleteUrlPattern = /!?\[[^\]]*\]\([^)]*$/
export const trailingStandaloneBracketPattern = /(\[)\s*$/
export const standaloneBracketPattern = /(!?\[)\s*$/

export const pipePattern = /\|/g
export const tableRowPattern = /^\|.*\|.*\|/
export const separatorPattern = /^\|[\s:]*-{3,}[\s:]*(?:\|[\s:]*-{3,}[\s:]*)+\|?$/

export const standaloneDashPattern = /^\s*-$/
export const dashWithSpacePattern = /^\s*-\s+$/
export const taskListPattern = /^\s*- \[[x ]\]/i
export const incompleteTaskListPattern = /^\s*-\s*\[\s*$/
export const quoteStandaloneDashPattern = /^>\s*-$/
export const quoteTaskListPattern = /^>\s*- \[[x ]\]/i
export const quoteIncompleteTaskListPattern = /^>\s*-\s*\[\s*$/

export const trailingStandaloneDashWithNewlinesPattern = /(\n\n?)-[ \t]*$/

export const linkImagePattern = /!?\[[^\]]*\]\([^)]*\)/g
export const linkImageUrlSuffixPattern = /\]\([^)]*\)/
export const incompleteLinkImageUrlPattern = /!?\[[^\]]*\]\([^)]*$/g
export const incompleteLinkImageUrlSuffixPattern = /\]\([^)]*$/
export const htmlTagPattern = /<[^>]*>/g
