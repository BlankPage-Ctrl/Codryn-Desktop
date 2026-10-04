export type FieldType =
    | 'text-short'
    | 'paragraph'
    | 'number'
    | 'select'
    | 'radio'
    | 'checkbox'
    | 'switch'
    | 'date'
    | 'folder'

export interface OptionItem {
    label: string
    value: string | number
}

export interface FieldMetadata {
    require?: boolean // user spelling
    required?: boolean // standard spelling helper
    maxLength?: number
    minLength?: number
    min?: number
    max?: number
    pattern?: string
    errorMessage?: string
    options?: OptionItem[] // For select, radio, checkbox
}

export interface RevealConfig {
    label?: string // Small muted caption for the reveal toggle. Default: 'Custom'
    defaultValue?: boolean // Default: false (hidden)
    match?: (values: Record<string, unknown>) => boolean
}

export interface ColumnSchema {
    type: FieldType
    label: string
    span?: number // 1 to 12. Default is 12 (full-width)
    placeholder?: string
    metadata?: FieldMetadata
    defaultValue?: unknown
    reveal?: RevealConfig
}

export interface RowSchema {
    columns: Record<string, ColumnSchema>
}

export type DialogGridSchema = Record<string, RowSchema>

export type DynamicGridDataOutput = Record<string, Record<string, unknown>>
