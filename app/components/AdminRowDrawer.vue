<script setup lang="ts">
/**
 * One row, in full, in a slide-over: every column with its whole value, a form
 * for the columns the server allows to be edited, and delete with a confirm.
 * Only changed columns are sent; the server validates each one again and
 * writes the audit row.
 */
const props = defineProps<{
  table: string
  row: Record<string, unknown> | null
  columns: AdminColumn[]
  rowKey: string | null
  editable: AdminEditField[]
  deletable: boolean
  note: string | null
}>()
const emit = defineEmits<{ close: [], saved: [row: Record<string, unknown>], deleted: [] }>()

const draft = ref<Record<string, unknown>>({})
const saving = ref(false)
const deleting = ref(false)
const confirmOpen = ref(false)
const failure = ref('')
const saved = ref(false)

watch(() => props.row, (row) => {
  failure.value = ''
  saved.value = false
  reset(row)
}, { immediate: true })

function reset(row: Record<string, unknown> | null) {
  draft.value = Object.fromEntries(props.editable.map(f => [f.name, f.input === 'switch' ? Boolean(row?.[f.name]) : (row?.[f.name] ?? '')]))
}

const id = computed(() => (props.row && props.rowKey ? String(props.row[props.rowKey]) : null))
const changes = computed(() => {
  const out: Record<string, unknown> = {}
  if (!props.row) {
    return out
  }
  for (const f of props.editable) {
    const before = f.input === 'switch' ? Boolean(props.row[f.name]) : (props.row[f.name] ?? '')
    if (draft.value[f.name] !== before) {
      out[f.name] = draft.value[f.name]
    }
  }
  return out
})
const dirty = computed(() => Object.keys(changes.value).length > 0)

async function save() {
  if (!id.value || !dirty.value) {
    return
  }
  saving.value = true
  failure.value = ''
  try {
    const result = await $fetch<{ row: Record<string, unknown> }>(`/api/admin/tables/${props.table}/${encodeURIComponent(id.value)}`, {
      method: 'PATCH',
      body: changes.value
    })
    saved.value = true
    emit('saved', result.row)
  } catch (e) {
    failure.value = apiError(e)
  } finally {
    saving.value = false
  }
}

async function remove() {
  if (!id.value) {
    return
  }
  deleting.value = true
  failure.value = ''
  try {
    await $fetch(`/api/admin/tables/${props.table}/${encodeURIComponent(id.value)}`, { method: 'DELETE' })
    confirmOpen.value = false
    emit('deleted')
  } catch (e) {
    failure.value = apiError(e)
    confirmOpen.value = false
  } finally {
    deleting.value = false
  }
}

function full(value: unknown): string {
  if (value === null || value === undefined) {
    return '∅ null'
  }
  return typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
}
</script>

<template>
  <USlideover
    :open="Boolean(row)"
    :title="row ? `${table}${id ? ` #${id}` : ''}` : ''"
    :description="note || (editable.length ? 'Edit the highlighted columns, then save. Every change is audited.' : 'Read-only table.')"
    :ui="{ content: 'max-w-2xl' }"
    @update:open="v => !v && emit('close')"
  >
    <template #body>
      <div
        v-if="row"
        class="space-y-6"
      >
        <UAlert
          v-if="row.sample === true"
          color="warning"
          variant="subtle"
          icon="i-lucide-flask-conical"
          title="Sample row"
          description="Fictional content from the seed script, badged on the site. Removable from Content → Sample data."
        />

        <form
          v-if="editable.length && id"
          class="space-y-4 border border-primary/40 p-4"
          @submit.prevent="save"
        >
          <p class="text-xs font-semibold uppercase tracking-wider text-primary">
            Editable
          </p>
          <UFormField
            v-for="f in editable"
            :key="f.name"
            :label="f.name"
            :hint="f.max ? `${String(draft[f.name] ?? '').length} / ${f.max}` : undefined"
          >
            <USwitch
              v-if="f.input === 'switch'"
              :model-value="Boolean(draft[f.name])"
              @update:model-value="(v: boolean) => (draft[f.name] = v)"
            />
            <USelect
              v-else-if="f.input === 'select'"
              :model-value="String(draft[f.name] ?? '')"
              :items="f.options || []"
              class="w-48"
              @update:model-value="(v: unknown) => (draft[f.name] = v)"
            />
            <UTextarea
              v-else-if="f.input === 'textarea'"
              :model-value="String(draft[f.name] ?? '')"
              :maxlength="f.max || undefined"
              autoresize
              :rows="3"
              class="w-full"
              @update:model-value="(v: unknown) => (draft[f.name] = v)"
            />
            <UInput
              v-else
              :model-value="String(draft[f.name] ?? '')"
              :type="f.input === 'url' ? 'url' : 'text'"
              :maxlength="f.max || undefined"
              class="w-full"
              @update:model-value="(v: unknown) => (draft[f.name] = v)"
            />
          </UFormField>
          <p
            v-if="failure"
            class="text-sm text-error"
            role="alert"
          >
            {{ failure }}
          </p>
          <p
            v-else-if="saved && !dirty"
            class="text-sm text-success"
          >
            Saved.
          </p>
          <div class="flex gap-2">
            <UButton
              type="submit"
              icon="i-lucide-save"
              :loading="saving"
              :disabled="!dirty"
            >
              Save changes
            </UButton>
            <UButton
              v-if="dirty"
              color="neutral"
              variant="ghost"
              @click="reset(row)"
            >
              Discard
            </UButton>
          </div>
        </form>

        <dl class="border border-default divide-y divide-default text-sm">
          <div
            v-for="c in columns"
            :key="c.name"
            class="grid grid-cols-[9rem_1fr] gap-3 px-3 py-2"
          >
            <dt class="min-w-0">
              <span class="block font-mono text-xs text-highlighted truncate">{{ c.name }}</span>
              <span class="block text-[11px] text-dimmed truncate">{{ c.type }}</span>
            </dt>
            <dd
              :class="['min-w-0 whitespace-pre-wrap break-words', row[c.name] === null || row[c.name] === undefined ? 'text-dimmed' : '', c.kind === 'json' ? 'font-mono text-xs' : '']"
            >
              {{ full(row[c.name]) }}
            </dd>
          </div>
        </dl>

        <div
          v-if="deletable && id"
          class="border border-error/40 p-4"
        >
          <p class="text-sm font-semibold text-highlighted">
            Delete this row
          </p>
          <p class="mt-1 text-xs text-muted">
            {{ table === 'stories' ? 'Removes the story, its votes, its media rows and its files in R2.' : 'This cannot be undone. The row as it was is kept in the audit log.' }}
          </p>
          <UButton
            class="mt-3"
            color="error"
            variant="outline"
            icon="i-lucide-trash-2"
            @click="confirmOpen = true"
          >
            Delete…
          </UButton>
        </div>
      </div>

      <UModal
        v-model:open="confirmOpen"
        :title="`Delete ${table} #${id}?`"
        description="This cannot be undone. The row as it was is kept in the audit log."
      >
        <template #footer>
          <div class="flex w-full justify-end gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              @click="confirmOpen = false"
            >
              Cancel
            </UButton>
            <UButton
              color="error"
              icon="i-lucide-trash-2"
              :loading="deleting"
              @click="remove"
            >
              Delete
            </UButton>
          </div>
        </template>
      </UModal>
    </template>
  </USlideover>
</template>
