<script setup lang="ts">
/**
 * Share a story. Signed in. The form asks the same questions I would ask over
 * chai: where you started, where you are now, the company and the package if
 * you want to say, and the story itself. Photos or a video are optional; a
 * YouTube link costs nothing to host and plays anywhere.
 */
import { richDocText } from '~/components/StoryEditor.vue'

definePageMeta({ middleware: 'auth' })

interface Media { kind: 'image' | 'video' | 'youtube', url: string, name?: string }

const form = reactive({
  title: '',
  from: '',
  to: '',
  company: '',
  package: ''
})
/** The tiptap JSON document from the editor; the server derives the plain text. */
const bodyDoc = ref<Record<string, unknown> | null>(null)
const bodyLength = computed(() => richDocText(bodyDoc.value).length)
const media = ref<Media[]>([])
const youtube = ref('')
const uploading = ref(false)
const saving = ref(false)
const error = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const IMAGE_MAX = 5 * 1024 * 1024
const VIDEO_MAX = 50 * 1024 * 1024

async function upload(event: Event) {
  const files = [...((event.target as HTMLInputElement).files || [])]
  error.value = ''
  for (const file of files) {
    if (media.value.length >= 6) {
      error.value = 'Six pieces of media at most.'
      break
    }
    const isVideo = file.type.startsWith('video/')
    if (file.size > (isVideo ? VIDEO_MAX : IMAGE_MAX)) {
      error.value = `${file.name} is too large. Images up to 5 MB, videos up to 50 MB. For a longer video, upload it to YouTube and paste the link.`
      continue
    }
    uploading.value = true
    try {
      const result = await $fetch<{ kind: 'image' | 'video', url: string }>('/api/uploads', {
        method: 'POST',
        body: file,
        headers: { 'content-type': file.type || 'application/octet-stream' }
      })
      media.value.push({ ...result, name: file.name })
    } catch (e) {
      error.value = apiError(e, `Could not upload ${file.name}.`)
    } finally {
      uploading.value = false
    }
  }
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function addYoutube() {
  error.value = ''
  if (!youtubeEmbed(youtube.value.trim())) {
    error.value = 'That does not look like a YouTube video link.'
    return
  }
  media.value.push({ kind: 'youtube', url: youtube.value.trim() })
  youtube.value = ''
}

async function submit() {
  error.value = ''
  if (bodyLength.value < 80) {
    error.value = 'Tell it in a little more detail: at least a few sentences (80 characters).'
    return
  }
  saving.value = true
  try {
    const { id } = await $fetch<{ id: number }>('/api/stories', {
      method: 'POST',
      body: {
        title: form.title,
        from: form.from,
        to: form.to,
        company: form.company || undefined,
        package: form.package || undefined,
        bodyRich: bodyDoc.value,
        media: media.value.map(m => ({ kind: m.kind, url: m.url }))
      }
    })
    await navigateTo(`/stories/${id}`)
  } catch (e) {
    error.value = apiError(e)
  } finally {
    saving.value = false
  }
}

useSeoMeta({ title: 'Share your story', robots: 'noindex' })
</script>

<template>
  <CommunityPage
    kicker="Share your story"
    icon="i-lucide-pen-line"
    title="Tell the next person how you did it"
    description="Where you started, where you are now, and what actually made the difference. Somebody sitting in a PG tonight, wondering whether it is worth carrying on, will read it."
  >
    <form
      class="space-y-5"
      @submit.prevent="submit"
    >
      <UFormField
        label="A title"
        hint="One line"
        required
      >
        <UInput
          v-model="form.title"
          maxlength="120"
          placeholder="From a BCom in Patna to a developer job in Pune"
          class="w-full"
        />
      </UFormField>

      <div class="grid gap-5 sm:grid-cols-2">
        <UFormField
          label="Where you started"
          required
        >
          <UInput
            v-model="form.from"
            maxlength="120"
            placeholder="Final year, no offers, Jabalpur"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Where you are now"
          required
        >
          <UInput
            v-model="form.to"
            maxlength="120"
            placeholder="Java developer, Bangalore"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Company"
          hint="Optional"
        >
          <UInput
            v-model="form.company"
            maxlength="80"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Package"
          hint="Optional, as you would say it"
        >
          <UInput
            v-model="form.package"
            maxlength="40"
            placeholder="4.5 LPA"
            class="w-full"
          />
        </UFormField>
      </div>

      <UFormField
        label="The story"
        :hint="`${bodyLength} / 8000`"
        required
      >
        <ClientOnly>
          <template #fallback>
            <USkeleton class="h-72 w-full" />
          </template>
          <StoryEditor
            v-model="bodyDoc"
            placeholder="What was the hardest part? What did you get wrong first? What would you tell yourself on the first day?"
          />
        </ClientOnly>
        <p class="mt-2 text-xs text-muted">
          Headings, lists, quotes and links are there in the toolbar if the
          story wants structure. Plain paragraphs are fine too.
        </p>
      </UFormField>

      <div class="panel">
        <p class="font-medium text-highlighted">
          Photos or a video
          <span class="text-sm font-normal text-muted">(optional)</span>
        </p>
        <p class="mt-1 text-sm text-muted">
          Images up to 5 MB, videos up to 50 MB, six in all. Or paste a YouTube link.
        </p>

        <div class="mt-4 flex flex-wrap gap-2">
          <input
            ref="fileInput"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
            multiple
            class="sr-only"
            @change="upload"
          >
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-image-up"
            :loading="uploading"
            @click="fileInput?.click()"
          >
            Upload
          </UButton>
          <UInput
            v-model="youtube"
            placeholder="https://youtu.be/…"
            class="flex-1 min-w-48"
            @keydown.enter.prevent="addYoutube"
          />
          <UButton
            color="neutral"
            variant="outline"
            icon="i-simple-icons-youtube"
            @click="addYoutube"
          >
            Add
          </UButton>
        </div>

        <ul
          v-if="media.length"
          class="mt-4 grid grid-cols-3 gap-2"
        >
          <li
            v-for="(m, i) in media"
            :key="m.url"
            class="relative aspect-video overflow-hidden bg-elevated"
          >
            <img
              v-if="m.kind === 'image'"
              :src="m.url"
              alt=""
              class="h-full w-full object-cover"
            >
            <img
              v-else-if="m.kind === 'youtube' && youtubeThumb(m.url)"
              :src="youtubeThumb(m.url)!"
              alt=""
              class="h-full w-full object-cover"
            >
            <div
              v-else
              class="flex h-full items-center justify-center text-xs text-muted p-2 text-center"
            >
              {{ m.name || 'Video' }}
            </div>
            <UButton
              icon="i-lucide-x"
              size="xs"
              color="neutral"
              class="absolute top-1 right-1"
              aria-label="Remove"
              @click="media.splice(i, 1)"
            />
          </li>
        </ul>
      </div>

      <p
        v-if="error"
        class="text-sm text-error"
        role="alert"
      >
        {{ error }}
      </p>

      <div class="flex items-center gap-3">
        <UButton
          type="submit"
          size="lg"
          :loading="saving"
          :disabled="uploading"
        >
          Publish my story
        </UButton>
        <span class="text-sm text-muted">It goes live straight away. You can delete it with your account.</span>
      </div>
    </form>
  </CommunityPage>
</template>
