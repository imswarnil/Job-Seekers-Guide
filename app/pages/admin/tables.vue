<script setup lang="ts">
/**
 * Tables: a data manager for the app's own tables. Filter by any column, sort,
 * search, page through, open a row in full, edit the columns the server allows,
 * delete where the server allows, and export the current view as CSV.
 *
 * The client only ever names a table from the server's fixed list and columns
 * the server reported; it never sends SQL. Every write is validated, done by a
 * dedicated endpoint, and recorded in Audit.
 */
definePageMeta({ middleware: 'admin' })

interface Filter { col: string, op: 'contains' | 'eq' | 'gte' | 'lte' | 'null' | 'notnull', value: string }

const route = useRoute()
const router = useRouter()

const table = computed({
  get: () => (typeof route.query.t === 'string' ? route.query.t : 'stories'),
  set: value => router.replace({ query: { t: value } })
})

const page = ref(1)
const size = ref(50)
const sort = ref<string | undefined>()
const dir = ref<'asc' | 'desc'>('desc')
const search = ref('')
const searchDebounced = refDebounced(search, 350)
const filters = ref<Filter[]>([])

watch(table, () => {
  page.value = 1
  sort.value = undefined
  dir.value = 'desc'
  search.value = ''
  filters.value = []
  selected.value = null
})
watch([size, searchDebounced, filters, sort, dir], () => (page.value = 1), { deep: true })

const query = computed(() => ({
  page: page.value,
  size: size.value,
  sort: sort.value,
  dir: dir.value,
  q: searchDebounced.value.trim() || undefined,
  f: filters.value.length ? JSON.stringify(filters.value) : undefined
}))

const { data: list, refresh: refreshList } = useFetch<{ items: AdminTableInfo[] }>('/api/admin/tables', { server: false, lazy: true })
const { data, status, error, refresh } = useFetch<AdminTablePage>(() => `/api/admin/tables/${table.value}`, {
  query,
  server: false,
  lazy: true,
  watch: [query]
})

const csvUrl = computed(() => {
  const params = new URLSearchParams({ format: 'csv', dir: dir.value })
  for (const [k, v] of Object.entries(query.value)) {
    if (v !== undefined && k !== 'page' && k !== 'size' && k !== 'dir') {
      params.set(k, String(v))
    }
  }
  return `/api/admin/tables/${table.value}?${params}`
})

function toggleSort(col: string) {
  if (sort.value === col) {
    dir.value = dir.value === 'desc' ? 'asc' : 'desc'
  } else {
    sort.value = col
    dir.value = 'desc'
  }
}

// --- The filter builder -------------------------------------------------------
const OPS: Record<AdminColumn['kind'], { label: string, value: Filter['op'] }[]> = {
  text: [{ label: 'contains', value: 'contains' }, { label: 'equals', value: 'eq' }, { label: 'is empty', value: 'null' }, { label: 'is not empty', value: 'notnull' }],
  json: [{ label: 'contains', value: 'contains' }, { label: 'is empty', value: 'null' }, { label: 'is not empty', value: 'notnull' }],
  number: [{ label: 'equals', value: 'eq' }, { label: 'at least', value: 'gte' }, { label: 'at most', value: 'lte' }, { label: 'is empty', value: 'null' }],
  date: [{ label: 'from', value: 'gte' }, { label: 'to', value: 'lte' }, { label: 'on', value: 'eq' }, { label: 'is empty', value: 'null' }],
  boolean: [{ label: 'is', value: 'eq' }]
}
const OP_WORDS: Record<Filter['op'], string> = { contains: 'contains', eq: '=', gte: '≥', lte: '≤', null: 'is empty', notnull: 'is not empty' }

const filterOpen = ref(false)
const draft = reactive<Filter>({ col: '', op: 'contains', value: '' })
const draftColumn = computed(() => data.value?.columns.find(c => c.name === draft.col))
const draftOps = computed(() => (draftColumn.value ? OPS[draftColumn.value.kind] : []))
const needsValue = computed(() => draft.op !== 'null' && draft.op !== 'notnull')
watch(() => draft.col, () => {
  draft.op = draftOps.value[0]?.value ?? 'contains'
  draft.value = draftColumn.value?.kind === 'boolean' ? 'true' : ''
})

function addFilter() {
  if (!draft.col || (needsValue.value && !draft.value.trim())) {
    return
  }
  filters.value = [...filters.value, { col: draft.col, op: draft.op, value: needsValue.value ? draft.value.trim() : '' }]
  filterOpen.value = false
  draft.value = ''
}
function removeFilter(i: number) {
  filters.value = filters.value.filter((_, k) => k !== i)
}

// --- Rows and the drawer ------------------------------------------------------
const selected = ref<Record<string, unknown> | null>(null)
const info = computed(() => list.value?.items.find(t => t.name === table.value))

function onSaved(row: Record<string, unknown>) {
  selected.value = row
  refresh()
}
function onDeleted() {
  selected.value = null
  refresh()
  refreshList()
}

function cellClass(col: AdminColumn, value: unknown) {
  if (value === null || value === undefined) {
    return 'text-dimmed'
  }
  if (col.kind === 'number') {
    return 'text-right tabular-nums'
  }
  if (col.kind === 'date') {
    return 'whitespace-nowrap text-muted'
  }
  return ''
}
function display(col: AdminColumn, value: unknown) {
  if (col.kind === 'date' && typeof value === 'string') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? value : d.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
  }
  return cellText(value, 60)
}

const sizes = [25, 50, 100, 200].map(n => ({ label: `${n} rows`, value: n }))
const firstRow = computed(() => (data.value && data.value.total ? (data.value.page - 1) * data.value.size + 1 : 0))
const lastRow = computed(() => (data.value ? Math.min(data.value.total, data.value.page * data.value.size) : 0))

useSeoMeta({ title: 'Tables · Admin', robots: 'noindex' })
</script>

<template>
  <AdminShell
    title="Tables"
    description="The app's own tables in Postgres. Reads run in a read-only transaction; edits and deletes are limited to safe columns and tables, validated on the server, and audited."
  >
    <div class="grid gap-4 lg:grid-cols-[14rem_1fr]">
      <nav
        class="border border-default bg-default self-start lg:sticky lg:top-4"
        aria-label="Tables"
      >
        <p class="px-3 pt-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted">
          Tables
        </p>
        <USkeleton
          v-if="!list"
          class="mx-3 mb-3 h-64"
        />
        <ul
          v-else
          class="pb-2 flex lg:block overflow-x-auto"
        >
          <li
            v-for="t in list.items"
            :key="t.name"
          >
            <button
              type="button"
              :disabled="!t.exists"
              :class="[
                'w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left whitespace-nowrap disabled:opacity-40',
                t.name === table ? 'bg-primary/10 text-primary font-semibold border-l-2 border-primary' : 'hover:bg-elevated border-l-2 border-transparent'
              ]"
              :aria-current="t.name === table ? 'page' : undefined"
              @click="table = t.name"
            >
              <span class="font-mono text-xs truncate flex-1">{{ t.name }}</span>
              <UIcon
                v-if="t.editable.length || t.deletable"
                name="i-lucide-pencil"
                class="size-3 text-dimmed"
                aria-label="editable"
              />
              <span class="text-[11px] tabular-nums text-dimmed">~{{ formatCompact(t.rows) }}</span>
            </button>
          </li>
        </ul>
      </nav>

      <section class="min-w-0 border border-default bg-default">
        <div class="flex flex-wrap items-center gap-2 p-3 border-b border-default">
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Search text columns…"
            class="w-full sm:w-64"
            aria-label="Search"
          />

          <UPopover v-model:open="filterOpen">
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-list-filter"
              :disabled="!data"
            >
              Add filter
            </UButton>
            <template #content>
              <form
                class="p-3 w-72 space-y-2"
                @submit.prevent="addFilter"
              >
                <USelect
                  v-model="draft.col"
                  :items="(data?.columns || []).map(c => ({ label: `${c.name} (${c.kind})`, value: c.name }))"
                  placeholder="Column"
                  class="w-full"
                  aria-label="Column"
                />
                <USelect
                  v-if="draftColumn"
                  v-model="draft.op"
                  :items="draftOps"
                  class="w-full"
                  aria-label="Condition"
                />
                <template v-if="draftColumn && needsValue">
                  <USelect
                    v-if="draftColumn.kind === 'boolean'"
                    v-model="draft.value"
                    :items="['true', 'false']"
                    class="w-full"
                    aria-label="Value"
                  />
                  <UInput
                    v-else
                    v-model="draft.value"
                    :type="draftColumn.kind === 'date' ? 'date' : draftColumn.kind === 'number' ? 'number' : 'text'"
                    placeholder="Value"
                    class="w-full"
                    aria-label="Value"
                  />
                </template>
                <UButton
                  type="submit"
                  block
                  :disabled="!draft.col || (needsValue && !draft.value.trim())"
                >
                  Apply filter
                </UButton>
              </form>
            </template>
          </UPopover>

          <div class="ml-auto flex items-center gap-2">
            <USelect
              v-model="size"
              :items="sizes"
              class="w-28"
              aria-label="Rows per page"
            />
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-refresh-cw"
              :loading="status === 'pending'"
              aria-label="Refresh"
              @click="refresh()"
            />
            <UButton
              :to="csvUrl"
              external
              download
              color="neutral"
              variant="outline"
              icon="i-lucide-download"
              :disabled="!data?.total"
            >
              CSV
            </UButton>
          </div>
        </div>

        <div
          v-if="filters.length || searchDebounced"
          class="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-default bg-elevated/40"
        >
          <span class="text-xs text-muted">Showing rows where</span>
          <UBadge
            v-for="(f, i) in filters"
            :key="i"
            color="neutral"
            variant="outline"
            class="gap-1"
          >
            <span class="font-mono">{{ f.col }}</span> {{ OP_WORDS[f.op] }} <strong v-if="f.value">{{ f.value }}</strong>
            <button
              type="button"
              class="ml-1 text-muted hover:text-error"
              :aria-label="`Remove filter on ${f.col}`"
              @click="removeFilter(i)"
            >
              <UIcon
                name="i-lucide-x"
                class="size-3"
              />
            </button>
          </UBadge>
          <UBadge
            v-if="searchDebounced"
            color="neutral"
            variant="outline"
          >
            any text contains <strong>{{ searchDebounced }}</strong>
          </UBadge>
          <UButton
            size="xs"
            color="neutral"
            variant="link"
            @click="() => { filters = []; search = '' }"
          >
            Clear all
          </UButton>
        </div>

        <UAlert
          v-if="error"
          color="error"
          variant="subtle"
          :title="apiError(error)"
          class="m-3"
        />

        <p
          v-if="info?.note"
          class="px-3 py-2 text-xs text-muted border-b border-default flex items-center gap-1.5"
        >
          <UIcon
            name="i-lucide-info"
            class="size-3.5"
          />
          {{ info.note }}
        </p>

        <div
          v-if="!data && !error"
          class="p-3 space-y-2"
        >
          <USkeleton
            v-for="n in 10"
            :key="n"
            class="h-7 w-full"
          />
        </div>

        <div
          v-else-if="data && !data.rows.length"
          class="py-16 text-center"
        >
          <UIcon
            name="i-lucide-table"
            class="size-8 text-dimmed"
          />
          <p class="mt-2 text-sm text-muted">
            {{ filters.length || searchDebounced ? 'No rows match these filters.' : 'This table is empty.' }}
          </p>
        </div>

        <div
          v-else-if="data"
          :class="['overflow-auto max-h-[70vh] transition-opacity', status === 'pending' ? 'opacity-60' : '']"
        >
          <table class="w-full text-xs">
            <thead class="sticky top-0 z-[1] bg-elevated border-b border-default">
              <tr>
                <th
                  v-for="c in data.columns"
                  :key="c.name"
                  scope="col"
                  :aria-sort="sort === c.name ? (dir === 'asc' ? 'ascending' : 'descending') : undefined"
                  class="px-2 py-1.5 text-left font-medium whitespace-nowrap"
                >
                  <button
                    type="button"
                    :class="['inline-flex items-center gap-1 hover:text-highlighted', sort === c.name ? 'text-primary' : 'text-muted', data.editable.some(e => e.name === c.name) ? 'underline decoration-dotted underline-offset-2' : '']"
                    :title="`${c.type}${data.editable.some(e => e.name === c.name) ? ', editable' : ''}. Click to sort.`"
                    @click="toggleSort(c.name)"
                  >
                    <span class="font-mono">{{ c.name }}</span>
                    <UIcon
                      :name="sort === c.name ? (dir === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down') : 'i-lucide-arrow-up-down'"
                      :class="['size-3', sort === c.name ? '' : 'opacity-30']"
                    />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr
                v-for="(r, i) in data.rows"
                :key="data.key ? String(r[data.key]) : i"
                tabindex="0"
                :class="['cursor-pointer hover:bg-elevated/60 focus-visible:bg-elevated focus-visible:outline-none', r.sample === true ? 'bg-warning/5' : '']"
                @click="selected = r"
                @keydown.enter="selected = r"
              >
                <td
                  v-for="c in data.columns"
                  :key="c.name"
                  :class="['px-2 py-1.5 max-w-[22rem] truncate', cellClass(c, r[c.name])]"
                >
                  {{ display(c, r[c.name]) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          v-if="data && data.total"
          class="flex flex-wrap items-center justify-between gap-3 px-3 py-2 border-t border-default"
        >
          <p class="text-xs text-muted tabular-nums">
            {{ formatCount(firstRow) }}–{{ formatCount(lastRow) }} of {{ formatCount(data.total) }}
            <span v-if="filters.length || searchDebounced">matching</span>
            · click a row to open it
          </p>
          <UPagination
            v-if="data.total > data.size"
            v-model:page="page"
            :total="data.total"
            :items-per-page="data.size"
            size="sm"
          />
        </div>
      </section>
    </div>

    <AdminRowDrawer
      :table="table"
      :row="selected"
      :columns="data?.columns || []"
      :row-key="data?.key ?? null"
      :editable="data?.editable || []"
      :deletable="Boolean(data?.deletable)"
      :note="data?.note ?? null"
      @close="selected = null"
      @saved="onSaved"
      @deleted="onDeleted"
    />
  </AdminShell>
</template>
