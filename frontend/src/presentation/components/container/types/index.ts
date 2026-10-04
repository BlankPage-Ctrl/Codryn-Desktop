export type SizeValue = string | number

export type ContainerResizeMode = 'edge' | 'split'

export type ContainerCellStyle = {
    readonly padding?: SizeValue
    readonly margin?: SizeValue
    readonly borderColor?: string
    readonly borderWidth?: SizeValue
    readonly borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none'
    readonly radius?: SizeValue
    readonly background?: string
    readonly overflow?: 'visible' | 'hidden' | 'scroll' | 'auto'
    readonly overflowX?: 'visible' | 'hidden' | 'scroll' | 'auto'
    readonly overflowY?: 'visible' | 'hidden' | 'scroll' | 'auto'
}

export type ContainerColumnConfig = {
    readonly id: string
    readonly width?: SizeValue
    readonly visible?: boolean
    readonly resizable?: boolean
    readonly resizeMode?: ContainerResizeMode
    readonly minWidth?: number
    readonly maxWidth?: number
    readonly cell?: ContainerCellStyle
}

export type ContainerSchema = {
    readonly id: string
    readonly height?: SizeValue
    readonly columnGap?: SizeValue
    readonly columns: ReadonlyArray<ContainerColumnConfig>
}
