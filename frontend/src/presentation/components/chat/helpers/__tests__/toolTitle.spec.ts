import { describe, it, expect } from 'vitest'
import {
    countContentLines,
    countDiffLines,
    formatReadWindow,
    parseReadWindow,
    relativizePath,
    splitDirFile,
    truncateCommand,
    truncateHead,
} from '../toolTitle'

describe('toolTitle helpers', () => {
    it('relativizes absolute paths against the workspace root', () => {
        expect(
            relativizePath(
                '/home/wilfredo/Project/Codryn/Codryn-Desktop/frontend/src/a.ts',
                '/home/wilfredo/Project/Codryn',
            ),
        ).toBe('Codryn-Desktop/frontend/src/a.ts')
    })

    it('keeps the path as-is when the root does not match', () => {
        expect(relativizePath('relative/path/a.ts', '/home/other')).toBe('relative/path/a.ts')
    })

    it('truncates long paths keeping the tail', () => {
        const long = 'Codryn-Desktop/frontend/src/presentation/components/plugin/components/RegisterForm.vue'
        const short = truncateHead(long)
        expect(short.startsWith('...')).toBe(true)
        expect(short.endsWith('RegisterForm.vue')).toBe(true)
        expect(short.length).toBeLessThanOrEqual(48)
    })

    it('leaves short paths untouched', () => {
        expect(truncateHead('src/a.ts')).toBe('src/a.ts')
    })

    it('splits dir and file', () => {
        expect(splitDirFile('a/b/c.ts')).toEqual({ dir: 'a/b', file: 'c.ts' })
        expect(splitDirFile('c.ts')).toEqual({ dir: '', file: 'c.ts' })
    })

    it('counts diff lines skipping headers', () => {
        const diff = [
            '--- a/file.ts',
            '+++ b/file.ts',
            '@@ -1,2 +1,2 @@',
            '-old one',
            '-old two',
            '+new one',
            ' context',
        ].join('\n')
        expect(countDiffLines(diff)).toEqual({ added: 1, removed: 2 })
    })

    it('counts content lines', () => {
        expect(countContentLines('')).toBe(0)
        expect(countContentLines('a\nb\nc')).toBe(3)
    })

    it('parses offset/limit windows', () => {
        expect(parseReadWindow({ offset: 93, limit: 8 })).toEqual({ from: 93, to: 100 })
        expect(formatReadWindow({ from: 93, to: 100 })).toEqual(['from: 93 - 100'])
    })

    it('parses legacy startLine/endLine and bare limit', () => {
        expect(parseReadWindow({ startLine: 5, endLine: 9 })).toEqual({ from: 5, to: 9 })
        expect(parseReadWindow({ limit: 10 })).toEqual({ limit: 10 })
        expect(formatReadWindow({ limit: 10 })).toEqual(['limit: 10'])
    })

    it('truncates long commands on the tail', () => {
        const cmd = 'npm run test -- --coverage --watchAll=false --extra-flag-here-to-make-it-long'
        const short = truncateCommand(cmd)
        expect(short.endsWith('...')).toBe(true)
        expect(short.length).toBeLessThanOrEqual(60)
    })
})
