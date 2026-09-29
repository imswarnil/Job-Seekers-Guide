<script setup lang="ts">
/**
 * The video behind the home headline, when `hero.youtubeId` is set in
 * app.config.ts. Muted, looping, no controls, from the no-cookie domain.
 *
 * Wide screens only: on a phone the hero stays the plain gradient, because a
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
    loop: '1',
    // YouTube only loops an embed when the video is also its own playlist.
    playlist: props.id,
    controls: '0',
    disablekb: '1',
    fs: '0',
    iv_load_policy: '3',
    modestbranding: '1',
    playsinline: '1',
    rel: '0'
  })
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(props.id)}?${params}`
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
        :src="src"
        class="media__frame"
        title="Background video"
        tabindex="-1"
        allow="autoplay; encrypted-media; picture-in-picture"
        loading="lazy"
        referrerpolicy="strict-origin-when-cross-origin"
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

/* Cover the box at any aspect ratio: at least as wide as the box, and at
   least as wide as a 16:9 frame the height of the box. */
.media__frame {
  position: absolute;
  top: 50%;
  left: 50%;
  width: max(100cqw, 177.78cqh);
  height: max(100cqh, 56.25cqw);
  transform: translate(-50%, -50%);
  border: 0;
}

/* Dark on the left where the words are, lighter to the right, so the headline
   is readable whatever frame the video is on. */
.media__shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgb(8 8 8 / 0.92) 0%, rgb(8 8 8 / 0.78) 45%, rgb(8 8 8 / 0.45) 100%),
    linear-gradient(0deg, rgb(8 8 8 / 0.7), transparent 40%),
    radial-gradient(50rem 20rem at 0% 0%, color-mix(in oklab, var(--color-guide-600) 30%, transparent), transparent 70%);
}
</style>
