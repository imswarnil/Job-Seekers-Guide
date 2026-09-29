<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

interface UserRow {
  id: string
  email: string
  name: string
  image: string | null
  createdAt: string
  lastSeen: string
  stories: number
  comments: number
  guestbook: number
  paid: number
  isAdmin: boolean
}

const { data, status, error } = useFetch<{ authUsers: number | null, items: UserRow[] }>('/api/admin/users', { server: false, lazy: true })

const columns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'stories', header: 'Stories' },
  { accessorKey: 'comments', header: 'Comments' },
  { accessorKey: 'guestbook', header: 'Guestbook' },
  { accessorKey: 'paid', header: 'Paid', cell: ({ row }: { row: { original: UserRow } }) => formatPaise(row.original.paid) },
  { accessorKey: 'lastSeen', header: 'Last seen', cell: ({ row }: { row: { original: UserRow } }) => formatAgo(row.original.lastSeen) }
]

useSeoMeta({ title: 'Users · Admin', robots: 'noindex' })
</script>

<template>
  <AdminShell
    title="Users"
    :description="data ? `${data.items.length} who have written something${data.authUsers !== null ? `, ${data.authUsers} accounts in Neon Auth` : ''}.` : undefined"
  >
    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      :title="apiError(error)"
    />
    <UTable
      v-else
      :data="data?.items || []"
      :columns="columns"
      :loading="status === 'pending'"
      class="border border-default rounded-lg"
    />
  </AdminShell>
</template>
