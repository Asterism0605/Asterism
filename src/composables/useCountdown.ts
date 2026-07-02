import { onUnmounted, ref } from 'vue'

export function useCountdown(seconds: number) {
  const countdown = ref(0)
  let timer: ReturnType<typeof setInterval> | undefined

  function start() {
    clearInterval(timer)
    countdown.value = seconds
    timer = setInterval(() => {
      countdown.value -= 1
      if (countdown.value <= 0) clearInterval(timer)
    }, 1000)
  }

  onUnmounted(() => clearInterval(timer))

  return { countdown, start }
}
