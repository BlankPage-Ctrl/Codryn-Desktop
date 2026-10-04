import type { Component } from 'vue'
import MarkdownBlockquote from './MarkdownBlockquote.vue'
import MarkdownBreak from './MarkdownBreak.vue'
import MarkdownCodeBlock from './MarkdownCodeBlock.vue'
import MarkdownDelete from './MarkdownDelete.vue'
import MarkdownEmphasis from './MarkdownEmphasis.vue'
import MarkdownHeading from './MarkdownHeading.vue'
import MarkdownImage from './MarkdownImage.vue'
import MarkdownInlineCode from './MarkdownInlineCode.vue'
import MarkdownLink from './MarkdownLink.vue'
import MarkdownList from './MarkdownList.vue'
import MarkdownListItem from './MarkdownListItem.vue'
import MarkdownParagraph from './MarkdownParagraph.vue'
import MarkdownStrong from './MarkdownStrong.vue'
import MarkdownTable from './MarkdownTable.vue'
import MarkdownTableCell from './MarkdownTableCell.vue'
import MarkdownTableRow from './MarkdownTableRow.vue'
import MarkdownText from './MarkdownText.vue'
import MarkdownThematicBreak from './MarkdownThematicBreak.vue'

export const defaultRendererRegistry: Record<string, Component> = {
    blockquote: MarkdownBlockquote,
    break: MarkdownBreak,
    code: MarkdownCodeBlock,
    delete: MarkdownDelete,
    emphasis: MarkdownEmphasis,
    heading: MarkdownHeading,
    image: MarkdownImage,
    inlineCode: MarkdownInlineCode,
    link: MarkdownLink,
    list: MarkdownList,
    listItem: MarkdownListItem,
    paragraph: MarkdownParagraph,
    strong: MarkdownStrong,
    table: MarkdownTable,
    tableCell: MarkdownTableCell,
    tableRow: MarkdownTableRow,
    text: MarkdownText,
    thematicBreak: MarkdownThematicBreak,
}
