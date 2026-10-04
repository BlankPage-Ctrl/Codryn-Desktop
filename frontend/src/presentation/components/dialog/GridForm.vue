<script setup lang="ts">
import { ref, watch } from 'vue'
import type { DialogGridSchema, DynamicGridDataOutput } from './types.ts'

import BaseInput from './inputs/BaseInput.vue'
import BaseFolderPicker from './inputs/BaseFolderPicker.vue'
import BaseTextarea from './inputs/BaseTextarea.vue'
import BaseSelect from './inputs/BaseSelect.vue'
import BaseRadioGroup from './inputs/BaseRadioGroup.vue'
import BaseCheckbox from './inputs/BaseCheckbox.vue'
import BaseSwitch from './inputs/BaseSwitch.vue'
import BaseDatePicker from './inputs/BaseDatePicker.vue'

type Props = {
    schema: DialogGridSchema
    initialData?: DynamicGridDataOutput
    dense?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    dense: false,
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: DynamicGridDataOutput): void
}>()

const formData = ref<Record<string, Record<string, unknown>>>({})
const errors = ref<Record<string, Record<string, string>>>({})
const revealed = ref<Record<string, Record<string, boolean>>>({})

const initFormData = () => {
    const data: Record<string, Record<string, unknown>> = {}
    const errs: Record<string, Record<string, string>> = {}

    for (const rowKey in props.schema) {
        data[rowKey] = {}
        errs[rowKey] = {}
        revealed.value[rowKey] = {}
        const row = props.schema[rowKey]
        if (!row) continue
        for (const colKey in row.columns) {
            const col = row.columns[colKey]
            if (!col) continue
            const metadata = col.metadata || {}
            errs[rowKey][colKey] = ''

            // 0. Init reveal state (default hidden)
            if (col.reveal) {
                const hasValue =
                    props.initialData?.[rowKey]?.[colKey] !== undefined &&
                    props.initialData[rowKey][colKey] !== ''
                revealed.value[rowKey][colKey] = hasValue
                    ? true
                    : (col.reveal.defaultValue ?? false)
            }

            let val: unknown
            // 1. Prioritize initialData
            if (props.initialData?.[rowKey] && props.initialData[rowKey][colKey] !== undefined) {
                val = props.initialData[rowKey][colKey]
            }
            // 2. Fall back to schema defaultValue
            else if (col.defaultValue !== undefined) {
                val = col.defaultValue
            }
            // 3. Apply standard defaults per field type
            else {
                if (col.type === 'switch') {
                    val = false
                } else if (col.type === 'checkbox') {
                    val = metadata.options && metadata.options.length > 0 ? [] : false
                } else if (col.type === 'number') {
                    val = null
                } else {
                    val = ''
                }
            }
            data[rowKey][colKey] = val
        }
    }

    formData.value = data
    errors.value = errs
    emit('update:modelValue', data)
}

const clearError = (rowKey: string, colKey: string) => {
    if (errors.value[rowKey]?.[colKey]) {
        errors.value[rowKey][colKey] = ''
    }
}

const isColumnVisible = (rowKey: string, colKey: string): boolean => {
    const col = props.schema[rowKey]?.columns[colKey]
    if (!col?.reveal) return true
    const matched = col.reveal.match?.(formData.value[rowKey] ?? {}) ?? false
    return matched || !!revealed.value[rowKey]?.[colKey]
}

const toggleReveal = (rowKey: string, colKey: string) => {
    if (!revealed.value[rowKey]) {
        revealed.value[rowKey] = {}
    }
    revealed.value[rowKey][colKey] = !revealed.value[rowKey][colKey]
}

const validate = (): boolean => {
    let isValid = true
    for (const rowKey in props.schema) {
        const row = props.schema[rowKey]
        if (!row) continue
        for (const colKey in row.columns) {
            const col = row.columns[colKey]
            if (!col) continue
            if (!isColumnVisible(rowKey, colKey)) continue
            const val = formData.value[rowKey]?.[colKey]
            const metadata = col.metadata || {}

            let error = ''
            const isRequired = metadata.require || metadata.required || false

            // 1. Required Validation
            if (isRequired) {
                if (col.type === 'checkbox' && Array.isArray(val)) {
                    if (val.length === 0) {
                        error = metadata.errorMessage || 'This field is required'
                    }
                } else if (col.type === 'switch') {
                    if (!val) {
                        error = metadata.errorMessage || 'This field is required'
                    }
                } else if (val === undefined || val === null || String(val).trim() === '') {
                    error = metadata.errorMessage || 'This field is required'
                }
            }

            // 2. Length Validations (only check if value has content)
            if (!error && val !== undefined && val !== null && String(val).trim() !== '') {
                const strVal = String(val)
                if (metadata.maxLength !== undefined && strVal.length > metadata.maxLength) {
                    error = metadata.errorMessage || `Maximum ${metadata.maxLength} characters`
                }
                if (metadata.minLength !== undefined && strVal.length < metadata.minLength) {
                    error = metadata.errorMessage || `Minimum ${metadata.minLength} characters`
                }
            }

            // 3. Numeric Range Validations
            if (
                !error &&
                col.type === 'number' &&
                val !== undefined &&
                val !== null &&
                val !== ''
            ) {
                const numVal = Number(val)
                if (!isNaN(numVal)) {
                    if (metadata.min !== undefined && numVal < metadata.min) {
                        error = metadata.errorMessage || `Minimal bernilai ${metadata.min}`
                    }
                    if (metadata.max !== undefined && numVal > metadata.max) {
                        error = metadata.errorMessage || `Maksimal bernilai ${metadata.max}`
                    }
                }
            }

            // 4. Pattern Regex Validations
            if (
                !error &&
                metadata.pattern &&
                val !== undefined &&
                val !== null &&
                String(val).trim() !== ''
            ) {
                try {
                    const regex = new RegExp(metadata.pattern)
                    if (!regex.test(String(val))) {
                        error = metadata.errorMessage || 'Format tidak valid'
                    }
                } catch (e) {
                    console.error('Invalid regex pattern in schema:', metadata.pattern, e)
                }
            }

            if (error) {
                isValid = false
            }

            if (!errors.value[rowKey]) {
                errors.value[rowKey] = {}
            }
            errors.value[rowKey][colKey] = error
        }
    }
    return isValid
}

// Watchers for reactive props
watch(
    () => props.initialData,
    () => {
        initFormData()
    },
    { deep: true },
)

watch(
    () => props.schema,
    () => {
        initFormData()
    },
    { deep: true },
)

// Deep watch local form state change to emit output
watch(
    formData,
    (newVal) => {
        emit('update:modelValue', newVal)
    },
    { deep: true },
)

initFormData()

// Expose state and validation interface to parent
defineExpose({
    validate,
    formData,
    errors,
})
</script>

<template>
    <div class="dynamic-form">
        <div v-for="(row, rowKey) in schema" :key="rowKey" class="form-row">
            <div
                v-for="(col, colKey) in row.columns"
                :key="colKey"
                class="form-col"
                :style="{ gridColumn: `span ${col.span || 12} / span ${col.span || 12}` }"
            >
                <!-- Reveal trigger (collapsed) -->
                <button
                    v-if="col.reveal && !isColumnVisible(rowKey, colKey)"
                    type="button"
                    class="reveal-trigger"
                    @click="toggleReveal(rowKey, colKey)"
                >
                    <span class="reveal-plus">+</span>{{ col.reveal.label ?? 'Custom' }}
                </button>

                <template v-else>
                    <!-- Text/Number Input -->
                    <BaseInput
                        v-if="col.type === 'text-short' || col.type === 'number'"
                        :type="col.type === 'number' ? 'number' : 'text'"
                        v-model="formData[rowKey]![colKey]"
                        :label="col.label"
                        :placeholder="col.placeholder"
                        :required="col.metadata?.require || col.metadata?.required"
                        :dense="dense"
                        :error="errors[rowKey]?.[colKey]"
                        @input="clearError(rowKey, colKey)"
                    />

                    <!-- Folder Picker -->
                    <BaseFolderPicker
                        v-else-if="col.type === 'folder'"
                        v-model="formData[rowKey]![colKey]"
                        :label="col.label"
                        :placeholder="col.placeholder"
                        :required="col.metadata?.require || col.metadata?.required"
                        :dense="dense"
                        :error="errors[rowKey]?.[colKey]"
                        @input="clearError(rowKey, colKey)"
                    />

                    <!-- Textarea (paragraph) -->
                    <BaseTextarea
                        v-else-if="col.type === 'paragraph'"
                        v-model="formData[rowKey]![colKey]"
                        :label="col.label"
                        :placeholder="col.placeholder"
                        :required="col.metadata?.require || col.metadata?.required"
                        :error="errors[rowKey]?.[colKey]"
                        @input="clearError(rowKey, colKey)"
                    />

                    <!-- Select Dropdown -->
                    <BaseSelect
                        v-else-if="col.type === 'select'"
                        v-model="formData[rowKey]![colKey]"
                        :label="col.label"
                        :placeholder="col.placeholder"
                        :options="col.metadata?.options || []"
                        :required="col.metadata?.require || col.metadata?.required"
                        :dense="dense"
                        :error="errors[rowKey]?.[colKey]"
                        @change="clearError(rowKey, colKey)"
                    />

                    <!-- Radio Group -->
                    <BaseRadioGroup
                        v-else-if="col.type === 'radio'"
                        v-model="formData[rowKey]![colKey]"
                        :label="col.label"
                        :options="col.metadata?.options || []"
                        :required="col.metadata?.require || col.metadata?.required"
                        :error="errors[rowKey]?.[colKey]"
                        @update:model-value="clearError(rowKey, colKey)"
                    />

                    <!-- Checkbox Group or Single -->
                    <BaseCheckbox
                        v-else-if="col.type === 'checkbox'"
                        v-model="formData[rowKey]![colKey]"
                        :label="col.label"
                        :options="col.metadata?.options"
                        :required="col.metadata?.require || col.metadata?.required"
                        :error="errors[rowKey]?.[colKey]"
                        @update:model-value="clearError(rowKey, colKey)"
                    />

                    <!-- Switch Toggle -->
                    <BaseSwitch
                        v-else-if="col.type === 'switch'"
                        v-model="formData[rowKey]![colKey]"
                        :label="col.label"
                        :error="errors[rowKey]?.[colKey]"
                        @update:model-value="clearError(rowKey, colKey)"
                    />

                    <!-- Date Picker -->
                    <BaseDatePicker
                        v-else-if="col.type === 'date'"
                        v-model="formData[rowKey]![colKey]"
                        :label="col.label"
                        :placeholder="col.placeholder"
                        :required="col.metadata?.require || col.metadata?.required"
                        :dense="dense"
                        :error="errors[rowKey]?.[colKey]"
                        @input="clearError(rowKey, colKey)"
                    />
                </template>
            </div>
        </div>
    </div>
</template>

<style scoped>
.dynamic-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
}

.form-row {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    column-gap: 12px;
    row-gap: 8px;
    width: 100%;
}

.form-col {
    width: 100%;
}

.reveal-trigger {
    display: flex;
    align-items: center;
    gap: 4px;
    height: 28px;
    padding: 0;
    border: none;
    background: transparent;
    font-size: var(--type-xs);
    color: var(--text-primary);
    opacity: 0.45;
    cursor: pointer;
    transition: opacity 150ms ease;
    user-select: none;
}

.reveal-trigger:hover {
    opacity: 0.75;
}

.reveal-plus {
    font-size: var(--type-sm);
    line-height: 1;
    color: var(--text-primary);
}
</style>
