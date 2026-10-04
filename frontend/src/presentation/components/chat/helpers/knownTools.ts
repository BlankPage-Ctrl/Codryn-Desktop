export const KNOWN_TOOL_NAMES = [
    'list_files',
    'read_file',
    'edit_file',
    'create_file',
    'run_shell',
    'skill',
    'skill_list',
    'insight_search',
    'insight_graph',
    'insight_trace',
    'grep',
] as const

export type KnownToolName = (typeof KNOWN_TOOL_NAMES)[number]

export type ToolName = KnownToolName | (string & {})

export function isKnownToolName(value: string): value is KnownToolName {
    return (KNOWN_TOOL_NAMES as readonly string[]).includes(value)
}

export const HIDDEN_TOOL_NAMES = ['write_plan', 'edit_plan', 'read_plan', 'request_human'] as const

export type HiddenToolName = (typeof HIDDEN_TOOL_NAMES)[number]

export function isHiddenToolName(value: string): boolean {
    return (HIDDEN_TOOL_NAMES as readonly string[]).includes(value)
}

export const TOOL_LABELS: Record<KnownToolName, string> = {
    list_files: 'List Files',
    read_file: 'Read File',
    edit_file: 'Edit File',
    create_file: 'Create File',
    run_shell: 'Run Shell',
    skill: 'Skill',
    skill_list: 'Skill List',
    insight_search: 'Search',
    insight_graph: 'Tree',
    insight_trace: 'Trace',
    grep: 'Grep',
}
