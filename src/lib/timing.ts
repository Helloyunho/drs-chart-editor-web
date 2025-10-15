import type { Seq9 } from '@/types/seq9'

export const tickToTime = (tick: number, seq9: Seq9): number => {
  let noteStartMS = 0

  const { bpm } = seq9.info.bpm_info
  for (let i = 0; i < bpm.length; i++) {
    const currentBPMChange = bpm[i]
    const nextStartTick = i < bpm.length - 1 ? bpm[i + 1].tick : seq9.info.end_tick
    const ticksInSegment = Math.min(tick, nextStartTick) - currentBPMChange.tick

    const msPerBeat = 6000000 / currentBPMChange.bpm
    const msPerTick = msPerBeat / seq9.info.time_unit
    noteStartMS += ticksInSegment * msPerTick

    if (tick <= nextStartTick) {
      break
    }
  }

  return noteStartMS
}

export const timeToTick = (time: number, seq9: Seq9): number => {
  let accumulatedMs = 0
  let currentTick = 0

  const { bpm } = seq9.info.bpm_info
  for (let i = 0; i < bpm.length; i++) {
    const currentBPMChange = bpm[i]
    const nextStartTick = i < bpm.length - 1 ? bpm[i + 1].tick : seq9.info.end_tick

    const msPerBeat = 6000000 / currentBPMChange.bpm
    const msPerTick = msPerBeat / seq9.info.time_unit

    const ticksInSegment = nextStartTick - currentBPMChange.tick

    const segmentMs = ticksInSegment * msPerTick

    if (accumulatedMs + segmentMs >= time) {
      const remainingMs = time - accumulatedMs
      const additionalTicks = Math.floor(remainingMs / msPerTick)
      return currentTick + additionalTicks
    }

    accumulatedMs += segmentMs
    currentTick += ticksInSegment
  }

  return seq9.info.end_tick
}

export const numTickWithMeasures = (givenTick: number, seq9: Seq9, direction: 'next' | 'prev' = 'next'): number => {
  let currentTick = givenTick
  const { measure } = seq9.info.measure_info

  if (direction === 'next') {
    for (let i = 0; i < measure.length; i++) {
      const currentMeasure = measure[i]
      const nextMeasureTick = i < measure.length - 1 ? measure[i + 1].tick : seq9.info.end_tick

      const ticksPerBeat = Math.floor((seq9.info.time_unit * 4) / currentMeasure.denomi)

      const measureLength = currentMeasure.num * ticksPerBeat
      const positionInMeasure = currentTick % measureLength
      const nextNumeratorPosition = (Math.floor(positionInMeasure / ticksPerBeat) + 1) * ticksPerBeat

      const nextNumeratorTick = currentTick + (nextNumeratorPosition - positionInMeasure)

      if (nextNumeratorTick < nextMeasureTick) {
        return nextNumeratorTick
      }

      currentTick = nextMeasureTick
    }

    return seq9.info.end_tick
  } else {
    for (let i = measure.length - 1; i >= 0; i--) {
      const currentMeasure = measure[i]
      let previousMeasureTick = i > 0 ? measure[i - 1].tick : 0

      const ticksPerBeat = Math.floor((seq9.info.time_unit * 4) / currentMeasure.denomi)

      const measureLength = currentMeasure.num * ticksPerBeat
      const positionInMeasure = currentTick % measureLength
      const previousNumeratorPosition = Math.floor(positionInMeasure / ticksPerBeat) * ticksPerBeat

      const previousNumeratorTick = currentTick - (positionInMeasure - previousNumeratorPosition)

      if (previousMeasureTick === givenTick) {
        previousMeasureTick -= ticksPerBeat
      }

      if (previousNumeratorTick >= currentMeasure.tick) {
        return previousNumeratorTick
      }

      currentTick = previousMeasureTick
    }

    return 0
  }
}

export const allNumeratorTicks = (seq9: Seq9): number[] => {
  const numeratorTicks: number[] = []
  const { measure } = seq9.info.measure_info
  let currentTick = 0

  for (let i = 0; i < measure.length; i++) {
    const currentMeasure = measure[i]
    const nextMeasureTick = i < measure.length - 1 ? measure[i + 1].tick : seq9.info.end_tick

    const ticksPerBeat = Math.floor((seq9.info.time_unit * 4) / currentMeasure.denomi)
    const measureLength = currentMeasure.num * ticksPerBeat

    while (currentTick < nextMeasureTick) {
      const positionInMeasure = currentTick % measureLength
      const nextNumeratorPosition = (Math.floor(positionInMeasure / ticksPerBeat) + 1) * ticksPerBeat

      const nextNumeratorTick = currentTick + (nextNumeratorPosition - positionInMeasure)

      if (nextNumeratorTick < nextMeasureTick) {
        numeratorTicks.push(nextNumeratorTick)
      }
      currentTick = nextNumeratorTick
    }

    currentTick = nextMeasureTick
  }

  return numeratorTicks
}

export const allBeatTicks = (seq9: Seq9): number[] => {
  const beatTicks: number[] = []
  const { measure } = seq9.info.measure_info
  let currentTick = 0

  for (let i = 0; i < measure.length; i++) {
    const currentMeasure = measure[i]
    const nextMeasureTick = i < measure.length - 1 ? measure[i + 1].tick : seq9.info.end_tick

    const ticksPerBeat = Math.floor((seq9.info.time_unit * 4) / currentMeasure.denomi)
    const measureLength = currentMeasure.num * ticksPerBeat

    while (currentTick < nextMeasureTick) {
      const positionInMeasure = currentTick % measureLength
      const nextBeatPosition = (Math.floor(positionInMeasure / ticksPerBeat) + currentMeasure.num) * ticksPerBeat

      const nextBeatTick = currentTick + (nextBeatPosition - positionInMeasure)

      if (nextBeatTick < nextMeasureTick) {
        beatTicks.push(nextBeatTick)
      }
      currentTick = nextBeatTick
    }

    currentTick = nextMeasureTick
  }

  return beatTicks
}

export const timeToScreenOffset = (time: number, speed: number = 1): number => {
  return time / 1000 * speed
}

export const tickToScreenOffset = (tick: number, seq9: Seq9, speed: number = 1): number => {
  const time = tickToTime(tick, seq9)
  return timeToScreenOffset(time, speed)
}

export const screenOffsetToTime = (offset: number, speed: number = 1): number => {
  return offset * 1000 / speed
}
export const screenOffsetToTick = (offset: number, seq9: Seq9, speed: number = 1): number => {
  const time = screenOffsetToTime(offset, speed)
  return timeToTick(time, seq9)
}
