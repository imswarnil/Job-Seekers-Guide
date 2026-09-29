<script setup lang="ts">
/** A read-only look at every table the app owns, a page at a time. */
definePageMeta({ middleware: 'admin' })

interface TableList { items: { name: string, rows: number, exists: boolean }[] }
interface TablePage { table: string, columns: string[], rows: Record<string, unknown>[], page: number, size: number, total: number }

const route = useRoute()
const router = useRouter()

const table = computed({
  get: () => (typeof route.query.t === 'string' ? route.query.t : 'page_views'),
  set: value => router.replace({ query: { t: value, p: undefined } })
})
const page = computed({
  get: () => Math.max(1, Number(route.query.p) || 1),
  set: value => router.replace({ query: { ...route.query, p: value > 1 ? value : undefined } })
})

const { data: list } = useFetch<TableList>('/api/admin/tables', { server: false, lazy: true })
const { data, status, error } = useFetch<TablePage>(() => `/api/admin/tables/${table.value}`, {
  query: { page, size: 50 },
  server: false,
  lazy: true
})

const columns = computed(() => (data.value?.columns || []).map(name => ({
  accessorKey: name,
  header: name,
  cell: ({ row }: { row: { original: Record<string, unknown> } }) => {
    const value = row.original[name]
    if (value === null || value === undefined) {
      return '∅'
    }
    const text = typeof value === 'object' ? JSON.stringify(value) : String(value)
    return text.length > 120 ? `${text.slice(0, 120)}…` : text
  }
})))

useSeoMeta({ title: 'Tables · Admin', robots: 'noindex' })
</script>

<template>
  <AdminShell
    title="Tables"
    description="Read-only. Every query runs in a read-only transaction."
  >
    <div class="flex flex-wrap gap-2 mb-6">
      <UButton
        v-for="t in list?.items || []"
        :key="t.name"
        size="sm"
        :color="t.name === table ? 'primary' : 'neutral'"
        :variant="t.name === table ? 'solid' : 'outline'"
        :disabled="!t.exists"
        @click="table = t.name"
      >
        {{ t.name }}
        <span class="text-xs opacity-70 tabular-nums">~{{ formatCount(t.rows) }}</span>
      </UButton>
    </div>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      :title="apiError(error)"
    />

    <template v-else>
      <UTable
        :data="data?.rows || []"
        :columns="columns"
        :loading="status === 'pending'"
        class="border border-default rounded-lg text-xs"
      />
      <div
        v-if="data && data.total > data.size"
        class="mt-4 flex justify-end"
      >
        <UPagination
          v-model:page="page"
          :total="data.total"
          :items-per-page="data.size"
        />
      </div>
    </template>
  </AdminShell>
</template>
