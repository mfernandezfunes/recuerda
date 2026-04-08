import { useCallback, useRef } from 'react'
import { useSettingsStore } from '../store/settings.store'

export function useTTS() {
  const { ttsEnabled } = useSettingsStore()
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const speak = useCallback((text: string): Promise<void> => {
    if (!ttsEnabled || !window.speechSynthesis) return Promise.resolve()

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'es-AR'
    utterance.rate = 0.85
    utterance.pitch = 1.1

    const voices = window.speechSynthesis.getVoices()
    const spanishVoice = voices.find(
      (v) => v.lang.startsWith('es') && (v.name.includes('Google') || v.name.includes('Mónica') || v.name.includes('Monica'))
    ) || voices.find((v) => v.lang.startsWith('es'))

    if (spanishVoice) utterance.voice = spanishVoice
    utteranceRef.current = utterance

    return new Promise<void>((resolve) => {
      utterance.onend = () => resolve()
      utterance.onerror = () => resolve()
      window.speechSynthesis.speak(utterance)
    })
  }, [ttsEnabled])

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel()
  }, [])

  return { speak, stop }
}
