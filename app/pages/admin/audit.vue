<script setup lang="ts">
/** Audit: every write made through /admin, who made it, and the row before and after. */
definePageMeta({ middleware: 'admin' })

interface AuditItem {
  id: number
  adminEmail: string
  action: string
  table: string | null
  rowId: string | null
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  createdAt: string
}

const page = ref(1)
// Select items cannot carry an empty value, so "all" stands for no filter.
const table = ref('all')
const action = ref('all')
const tableQuery = computed(() => (table.value === 'all' ? undefined : table.value))
const actionQuery = computed(() => (action.value === 'all' ? undefined : action.value))
watch([table, action], () => (page.value = 1))

const { data, status, error } = useFetch<{ items: AuditItem[], actions: string[], page: number, size: number, total: number }>('/api/admin/audit', {
  query: { page, size: 50, table: tableQuery, action: actionQuery },
  server: false,
  lazy: true
})

const tableItems = computed(() => [{ label: 'All tables', value: 'all' }, ...['stories', 'guestbook', 'comments', 'sponsor_bids', 'page_views', 'jobs_got'].map(t => ({ label: t, value: t }))])
const actionItems = computed(() => [{ label: 'All actions', value: 'all' }, ...(data.value?.actions ?? []).map(a => ({ label: a, value: a }))])

const open = ref<AuditItem | null>(null)

/** The columns whose values differ between before and after. */
function changed(item: AuditItem): string[] {
  if (!item.before || !item.after) {
    return []
  }
  const keys = new Set([...Object.keys(item.before), ...Object.keys(item.after)])
  return [...keys].filter(k => JSON.stringify(item.before?.[k]) !== JSON.stringify(item.after?.[k]))
}

const color = (a: string) => (a === 'delete' || a === 'remove-samples' ? 'error' : a === 'update' ? 'info' : 'neutral')

useSeoMeta({ title: 'Audit · Admin', robots: 'noindex' })
</script>

<template>
  <AdminShell
    title="Audit"
    description="Every write made through /admin, newest first. Append-only: nothing in the app edits or removes these rows."
  >
    <template #actions>
      <USelect
        v-model="table"
        :items="tableItems"
        class="w-40"
        aria-label="Filter by table"
      />
      <USelect
        v-model="action"
        :items="actionItems"
        class="w-40"
        aria-label="Filter by action"
      />
    </template>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      :title="apiError(error)"
    />

    <AdminPanel
      v-else
      :title="data ? `${formatCount(data.total)} entr${data.total === 1 ? 'y' : 'ies'}` : 'Entries'"
      :loading="status === 'pending' && !data"
      :empty="data && !data.items.length"
      empty-text="No admin writes recorded yet."
      flush
    >
      <div
        v-if="data"
        class="overflow-x-auto"
      >
        <table class="w-full text-sm">
          <thead class="text-xs text-muted border-y border-default bg-elevated/50">
            <tr>
              <th class="text-left font-medium px-4 py-2">
                When
              </th>
              <th class="text-left font-medium px-2 py-2">
                Admin
              </th>
              <th class="text-left font-medium px-2 py-2">
                Action
              </th>
              <th class="text-left font-medium px-2 py-2">
                Row
              </th>
              <th class="text-left font-medium px-2 py-2">
                Changed
              </th>
              <th class="px-4 py-2">
                <span class="sr-only">Details</span>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr
              v-for="a in data.items"
              :key="a.id"
              class="hover:bg-elevated/50"
            >
              <td class="px-4 py-2 whitespace-nowrap text-muted">
                <time
                  :datetime="a.createdAt"
                  :title="new Date(a.createdAt).toLocaleString('en-GB')"
                >{{ formatAgo(a.createdAt) }}</time>
              </td>
              <td class="px-2 py-2 max-w-[14rem] truncate">
                {{ a.adminEmail }}
              </td>
              <td class="px-2 py-2">
                <UBadge
                  :color="color(a.action)"
                  variant="subtle"
                  size="sm"
                >
                  {{ a.action }}
                </UBadge>
              </td>
              <td class="px-2 py-2 whitespace-nowrap">
                <code
                  v-if="a.table"
                  class="text-xs"
                >{{ a.table }}<template v-if="a.rowId"> #{{ a.rowId }}</template></code>
                <span
                  v-else
                  class="text-muted"
                >–</span>
              </td>
              <td class="px-2 py-2 text-xs text-muted max-w-[16rem] truncate">
                {{ a.action === 'update' ? changed(a).join(', ') : a.action === 'remove-samples' ? cellText(a.after, 60) : '' }}
              </td>
              <td class="px-4 py-2 text-right">
                <UButton
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-panel-right-open"
                  aria-label="Show before and after"
                  @click="open = a"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        v-if="data && data.total > data.size"
        class="flex justify-end border-t border-default px-4 py-3"
      >
        <UPagination
          v-model:page="page"
          :total="data.total"
          :items-per-page="data.size"
        />
      </div>
    </AdminPanel>

    <USlideover
      :open="Boolean(open)"
      :title="open ? `${open.action} · ${open.table || 'no table'}${open.rowId ? ` #${open.rowId}` : ''}` : ''"
      :description="open ? `${open.adminEmail}, ${new Date(open.createdAt).toLocaleString('en-GB')}` : ''"
      :ui="{ content: 'max-w-2xl' }"
      @update:open="v => !v && (open = null)"
    >
      <template #body>
        <div
          v-if="open"
          class="space-y-6 text-sm"
        >
          <div v-if="open.action === 'update' && open.before && open.after">
            <h3 class="font-semibold text-highlighted mb-2">
              Changed columns
            </h3>
            <dl class="border border-default divide-y divide-default">
              <div
                v-for="k in changed(open)"
                :key="k"
                class="grid grid-cols-[8rem_1fr] gap-2 p-2"
              >
                <dt class="font-mono text-xs text-muted">
                  {{ k }}
                </dt>
                <dd class="space-y-1">
                  <p class="text-error line-through whitespace-pre-wrap break-words">
                    {{ cellText(open.before[k], 2000) }}
                  </p>
                  <p class="text-success whitespace-pre-wrap break-words">
                    {{ cellText(open.after[k], 2000) }}
                  </p>
                </dd>
              </div>
            </dl>
          </div>
          <div
            v-for="side in (['before', 'after'] as const)"
            :key="side"
          >
            <template v-if="open[side]">
              <h3 class="font-semibold text-highlighted mb-2 capitalize">
                {{ side }}
              </h3>
              <pre class="text-xs bg-elevated border border-default p-3 overflow-x-auto whitespace-pre-wrap break-words">{{ JSON.stringify(open[side], null, 2) }}</pre>
            </template>
          </div>
        </div>
      </template>
    </USlideover>
  </AdminShell>
</template>
