<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

interface Money {
  payments: Record<string, unknown>[]
  bids: Record<string, unknown>[]
  totals: { kind: string, status: string, count: number, amount: number }[]
}

const { data, status, error } = useFetch<Money>('/api/admin/payments', { server: false, lazy: true })

const paymentColumns = [
  { accessorKey: 'created_at', header: 'When', cell: ({ row }: { row: { original: Record<string, unknown> } }) => formatDay(String(row.original.created_at)) },
  { accessorKey: 'kind', header: 'Kind' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'amount', header: 'Amount', cell: ({ row }: { row: { original: Record<string, unknown> } }) => formatPaise(Number(row.original.amount)) },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Account' },
  { accessorKey: 'message', header: 'Message' },
  { accessorKey: 'dodo_payment_id', header: 'Dodo id' }
]

const bidColumns = [
  { accessorKey: 'created_at', header: 'When', cell: ({ row }: { row: { original: Record<string, unknown> } }) => formatDay(String(row.original.created_at)) },
  { accessorKey: 'slot', header: 'Slot' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'amount', header: 'Amount', cell: ({ row }: { row: { original: Record<string, unknown> } }) => formatPaise(Number(row.original.amount)) },
  { accessorKey: 'sponsor_name', header: 'Sponsor' },
  { accessorKey: 'sponsor_url', header: 'Link' },
  { accessorKey: 'email', header: 'Account' }
]

useSeoMeta({ title: 'Money · Admin', robots: 'noindex' })
</script>

<template>
  <AdminShell
    title="Payments and bids"
    description="Read-only. Refunds and disputes are handled in the Dodo Payments dashboard; the webhook updates these rows."
  >
    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      :title="apiError(error)"
    />

    <template v-else>
      <div
        v-if="data?.totals.length"
        class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8"
      >
        <UCard
          v-for="t in data.totals"
          :key="`${t.kind}-${t.status}`"
        >
          <p class="text-xs text-muted">
            {{ t.kind }} · {{ t.status }}
          </p>
          <p class="mt-1 text-xl font-bold tabular-nums text-highlighted">
            {{ formatPaise(t.amount) }}
          </p>
          <p class="text-xs text-muted">
            {{ t.count }} payment{{ t.count === 1 ? '' : 's' }}
          </p>
        </UCard>
      </div>

      <h2 class="text-lg font-semibold text-highlighted mb-3">
        Payments
      </h2>
      <UTable
        :data="data?.payments || []"
        :columns="paymentColumns"
        :loading="status === 'pending'"
        class="border border-default rounded-lg"
      />

      <h2 class="text-lg font-semibold text-highlighted mt-10 mb-3">
        Sponsor bids
      </h2>
      <UTable
        :data="data?.bids || []"
        :columns="bidColumns"
        :loading="status === 'pending'"
        class="border border-default rounded-lg"
      />
    </template>
  </AdminShell>
</template>
