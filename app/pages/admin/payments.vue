<script setup lang="ts">
/** Payments: money in over time, and every payment and sponsor bid. Read-only here. */
definePageMeta({ middleware: 'admin' })

interface Money {
  payments: Record<string, unknown>[]
  bids: Record<string, unknown>[]
  totals: { kind: string, status: string, count: number, amount: number }[]
}

const range = useAdminRange('30d')
const { data: stats, error: statsError } = useAdminAnalytics(range)
const { data, status, error } = useFetch<Money>('/api/admin/payments', { server: false, lazy: true })
const loading = computed(() => !stats.value && !statsError.value)
const cur = computed(() => stats.value?.totals.current)
const prev = computed(() => stats.value?.totals.previous)

const allTime = computed(() => {
  const paid = (data.value?.totals ?? []).filter(t => t.status === 'paid')
  const sum = (kind?: string) => paid.filter(t => !kind || t.kind === kind).reduce((s, t) => s + t.amount, 0)
  return { all: sum(), donations: sum('donation'), bids: sum('bid') }
})

const average = (t?: AdminTotals) => (t?.payments ? t.money / t.payments : 0)
const statusColor = (s: unknown) => (s === 'paid' ? 'success' : s === 'pending' ? 'warning' : s === 'hidden' ? 'neutral' : 'error')
const when = (v: unknown) => (v ? new Date(String(v)).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '')

useSeoMeta({ title: 'Payments · Admin', robots: 'noindex' })
</script>

<template>
  <AdminShell
    title="Payments"
    description="Money in through Dodo Payments. Only the signed webhook marks a payment paid; refunds and disputes are handled in the Dodo dashboard. Sponsor bids can be hidden from Tables → sponsor_bids."
  >
    <template #actions>
      <AdminRangePicker v-model="range" />
    </template>

    <UAlert
      v-if="statsError || error"
      color="error"
      variant="subtle"
      :title="apiError(statsError || error)"
      class="mb-6"
    />

    <div class="grid gap-3 grid-cols-2 lg:grid-cols-4">
      <AdminStat
        label="Money in"
        icon="i-lucide-indian-rupee"
        :value="formatPaise(cur?.money)"
        :current="cur?.money"
        :previous="prev?.money"
        :loading="loading"
      />
      <AdminStat
        label="Paid payments"
        icon="i-lucide-receipt"
        :value="formatCount(cur?.payments)"
        :current="cur?.payments"
        :previous="prev?.payments"
        :loading="loading"
      />
      <AdminStat
        label="Average payment"
        icon="i-lucide-divide"
        :value="formatPaise(average(cur))"
        :current="average(cur)"
        :previous="average(prev)"
        :loading="loading"
      />
      <AdminStat
        label="Raised, all time"
        icon="i-lucide-piggy-bank"
        :value="formatPaise(allTime.all)"
        :hint="`${formatPaise(allTime.donations)} donations · ${formatPaise(allTime.bids)} bids`"
        :loading="!data && status === 'pending'"
      />
    </div>

    <AdminPanel
      title="Money in"
      :description="stats ? `Paid payments per ${stats.unit}, in rupees` : undefined"
      :loading="loading"
      class="mt-4"
    >
      <AdminTrendChart
        v-if="stats"
        :points="stats.series"
        :series="[{ key: 'money', label: 'Money in' }]"
        :unit="stats.unit"
        :format="formatPaise"
        :label="`Money in per ${stats.unit}, ${RANGE_WORDS[range]}`"
      />
    </AdminPanel>

    <AdminPanel
      title="Payments"
      description="The latest 500, newest first"
      :loading="!data && status === 'pending'"
      :empty="data && !data.payments.length"
      empty-text="No payments yet."
      flush
      class="mt-4"
    >
      <div
        v-if="data"
        class="overflow-auto max-h-[32rem]"
      >
        <table class="w-full text-sm">
          <thead class="sticky top-0 text-xs text-muted border-y border-default bg-elevated">
            <tr>
              <th class="text-left font-medium px-4 py-2">
                When
              </th>
              <th class="text-left font-medium px-2 py-2">
                Kind
              </th>
              <th class="text-left font-medium px-2 py-2">
                Status
              </th>
              <th class="text-right font-medium px-2 py-2">
                Amount
              </th>
              <th class="text-left font-medium px-2 py-2">
                Name
              </th>
              <th class="text-left font-medium px-2 py-2">
                Account
              </th>
              <th class="text-left font-medium px-4 py-2">
                Message
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr
              v-for="p in data.payments"
              :key="String(p.id)"
            >
              <td class="px-4 py-2 whitespace-nowrap text-muted">
                {{ when(p.created_at) }}
              </td>
              <td class="px-2 py-2">
                {{ p.kind }}
              </td>
              <td class="px-2 py-2">
                <UBadge
                  :color="statusColor(p.status)"
                  variant="subtle"
                  size="sm"
                >
                  {{ p.status }}
                </UBadge>
              </td>
              <td class="px-2 py-2 text-right tabular-nums font-medium">
                {{ formatPaise(Number(p.amount)) }}
              </td>
              <td class="px-2 py-2 max-w-[10rem] truncate">
                {{ p.name || '–' }}
              </td>
              <td class="px-2 py-2 max-w-[12rem] truncate text-muted">
                {{ p.email || '–' }}
              </td>
              <td class="px-4 py-2 max-w-[18rem] truncate text-muted">
                {{ p.message || '' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AdminPanel>

    <AdminPanel
      title="Sponsor bids"
      description="The latest 500. To hide one or fix its name, link or tagline, open it in Tables."
      :loading="!data && status === 'pending'"
      :empty="data && !data.bids.length"
      empty-text="No bids yet."
      flush
      class="mt-4"
    >
      <template #actions>
        <UButton
          to="/admin/tables?t=sponsor_bids"
          size="xs"
          color="neutral"
          variant="outline"
          icon="i-lucide-table"
        >
          Edit in Tables
        </UButton>
      </template>
      <div
        v-if="data"
        class="overflow-auto max-h-[32rem]"
      >
        <table class="w-full text-sm">
          <thead class="sticky top-0 text-xs text-muted border-y border-default bg-elevated">
            <tr>
              <th class="text-left font-medium px-4 py-2">
                When
              </th>
              <th class="text-left font-medium px-2 py-2">
                Slot
              </th>
              <th class="text-left font-medium px-2 py-2">
                Status
              </th>
              <th class="text-right font-medium px-2 py-2">
                Amount
              </th>
              <th class="text-left font-medium px-2 py-2">
                Sponsor
              </th>
              <th class="text-left font-medium px-4 py-2">
                Account
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr
              v-for="b in data.bids"
              :key="String(b.id)"
            >
              <td class="px-4 py-2 whitespace-nowrap text-muted">
                {{ when(b.created_at) }}
              </td>
              <td class="px-2 py-2 font-mono text-xs">
                {{ b.slot }}
              </td>
              <td class="px-2 py-2">
                <UBadge
                  :color="statusColor(b.status)"
                  variant="subtle"
                  size="sm"
                >
                  {{ b.status }}
                </UBadge>
              </td>
              <td class="px-2 py-2 text-right tabular-nums font-medium">
                {{ formatPaise(Number(b.amount)) }}
              </td>
              <td class="px-2 py-2 max-w-[16rem] truncate">
                <a
                  :href="String(b.sponsor_url)"
                  target="_blank"
                  rel="noopener nofollow"
                  class="hover:text-primary"
                >{{ b.sponsor_name }}</a>
              </td>
              <td class="px-4 py-2 max-w-[12rem] truncate text-muted">
                {{ b.email || '–' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AdminPanel>
  </AdminShell>
</template>
