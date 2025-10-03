

export function speak(text: string) {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "id-ID"
    utterance.rate = 1
    utterance.pitch = 1
    speechSynthesis.speak(utterance)
  }
  