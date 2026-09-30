<script setup lang="ts">
/**
 * The video behind the home headline, when `hero.youtubeId` is set in
 * app.config.ts. Muted, looping, no controls, from the no-cookie domain.
 *
 * Wide screens only: on a phone the hero stays the plain page, because a
 * background video there costs data a job seeker may be paying for by the
 * megabyte. With reduced motion on, the video's own still is shown instead
 * and nothing plays.
 */
const props = defineProps<{
  id: string
}>()

const wide = useMediaQuery('(min-width: 768px)')
const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')

const play = computed(() => wide.value && !reduced.value)

const src = computed(() => {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    // Always from the first frame, never wherever the video was last left.
    start: '0',
    loop: '1',
    // YouTube only loops an embed when the video is also its own playlist.
    playlist: props.id,
    controls: '0',
    disablekb: '1',
    fs: '0',
    iv_load_policy: '3',
    modestbranding: '1',
    playsinline: '1',
    rel: '0',
    // So the frame posts its state and `shown` can wait for real playback.
    enablejsapi: '1'
  })
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(props.id)}?${params}`
})

/**
 * The frame stays invisible until the embed reports it is actually playing
 * (state 1 over the postMessage API, switched on by `enablejsapi`). That skips
 * YouTube's title bar, which it draws over the first seconds, and it means a
 * blocked autoplay (data saver, low battery mode) leaves the calm poster up
 * instead of a grey title card across the headline.
 */
const shown = ref(false)
const frame = useTemplateRef<HTMLIFrameElement>('frame')

const timers: ReturnType<typeof setTimeout>[] = []

/** The embed only posts its state once somebody says they are listening. */
function handshake() {
  const send = () => frame.value?.contentWindow?.postMessage(
    JSON.stringify({ event: 'listening', id: 'hero', channel: 'widget' }), '*')
  send()
  // The player is not always ready for the first hello.
  timers.push(setTimeout(send, 1000), setTimeout(send, 3000))
}

function onMessage(event: MessageEvent) {
  if (typeof event.data !== 'string' || !/youtube(-nocookie)?\.com$/.test(event.origin)) {
    return
  }
  try {
    const data = JSON.parse(event.data)
    const state = data.event === 'onStateChange' ? data.info : data.info?.playerState
    if (state === 1) {
      shown.value = true
    }
  } catch {
    // Someone else's message.
  }
}

onMounted(() => window.addEventListener('message', onMessage))
onBeforeUnmount(() => {
  window.removeEventListener('message', onMessage)
  timers.forEach(clearTimeout)
})

const poster = computed(() => `https://i.ytimg.com/vi/${encodeURIComponent(props.id)}/hqdefault.jpg`)
</script>

<template>
  <div
    class="media"
    aria-hidden="true"
  >
    <div
      class="media__poster"
      :style="{ backgroundImage: `url(${poster})` }"
    />
    <ClientOnly>
      <iframe
        v-if="play"
        ref="frame"
        :src="src"
        class="media__frame"
        :class="shown && 'media__frame--shown'"
        title="Background video"
        tabindex="-1"
        allow="autoplay; encrypted-media; picture-in-picture"
        loading="lazy"
        referrerpolicy="strict-origin-when-cross-origin"
        @load="handshake"
      />
    </ClientOnly>
    <div class="media__shade" />
  </div>
</template>

<style scoped>
.media {
  display: none;
}

@media (min-width: 768px) {
  .media {
    display: block;
    position: absolute;
    inset: 0;
    overflow: hidden;
    z-index: 0;
    container-type: size;
    pointer-events: none;
    background: #0a0a0a;
  }
}

.media__poster {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  filter: saturate(0.9);
}

/* Cover the box at any aspect ratio (at least as wide as the box, and at
   least as wide as a 16:9 frame the height of the box), then 35% larger again
   so YouTube's title bar, logo and corner controls fall outside the box. */
.media__frame {
  position: absolute;
  top: 50%;
  left: 50%;
  width: max(100cqw, 177.78cqh);
  height: max(100cqh, 56.25cqw);
  transform: translate(-50%, -50%) scale(1.35);
  border: 0;
  opacity: 0;
  transition: opacity 1.2s ease;
}

.media__frame--shown {
  opacity: 1;
}

/* Dark on the left where the words are, lighter to the right, so the headline
   is readable whatever frame the video is on. */
.media__shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgb(8 8 8 / 0.82) 0%, rgb(8 8 8 / 0.55) 45%, rgb(8 8 8 / 0.2) 100%),
    linear-gradient(0deg, rgb(8 8 8 / 0.6), transparent 35%);
}
</style>
