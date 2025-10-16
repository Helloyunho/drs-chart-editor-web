import { useState, useEffect, useRef, useCallback } from 'react'
import Moveable, { type OnDrag } from 'react-moveable'
import { parseSeq9XML } from './lib/converter'
import { StepKind, type Seq9, type Step } from './types/seq9'
import { allBeatTicks, allNumeratorTicks, numTickWithMeasures, screenOffsetToTick, tickToScreenOffset } from './lib/timing'
import { Step as StepComp } from './components/notes/step'
import { cn } from './lib/utils'
import { JumpDown } from './components/notes/jump-down'
import { MenuBar } from './components/menubar'
import { useAtom } from 'jotai/react'
import { speedAtom } from '@/stores/speed.atom'

const TICK_SNAP_THRESHOLD = 30
const X_SNAP_THRESHOLD = 360

function App () {
  const seqRef = useRef<Seq9 | null>(null)
  const [, forceRender] = useState(0)
  const [speed] = useAtom(speedAtom)
  const [selectedElem, setSelectedElem] = useState<SVGElement | null>(null)
  const [selectedStep, setSelectedStep] = useState<Step | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const onDrag = useCallback(({ delta }: OnDrag) => {
    const [dx, dy] = delta
    const containerRect = containerRef.current?.getBoundingClientRect()
    const stepRect = selectedElem?.getBoundingClientRect()
    const seq = seqRef.current
    if (!containerRect || !selectedStep || !stepRect || !seq) return

    const isSelectedStepJumpOrDown = selectedStep.kind === StepKind.Jump || selectedStep.kind === StepKind.Down
    let tickOffset = screenOffsetToTick(
      stepRect.top + dy - containerRect.top,
      seq,
      speed
    ) - selectedStep.start_tick
    if (selectedStep.start_tick + tickOffset < 0 || selectedStep.end_tick + tickOffset > seq.info.end_tick) return
    const nextNumeratorTick = numTickWithMeasures(selectedStep.start_tick, seq, 'next')
    const prevNumeratorTick = numTickWithMeasures(selectedStep.start_tick, seq, 'prev')
    if (Math.abs(selectedStep.start_tick + tickOffset - nextNumeratorTick) < TICK_SNAP_THRESHOLD) {
      tickOffset = nextNumeratorTick - selectedStep.start_tick
    } else if (Math.abs(selectedStep.start_tick + tickOffset - prevNumeratorTick) < TICK_SNAP_THRESHOLD) {
      tickOffset = prevNumeratorTick - selectedStep.start_tick
    }
    if (!isSelectedStepJumpOrDown) {
      if (Math.abs(selectedStep.end_tick + tickOffset - nextNumeratorTick) < TICK_SNAP_THRESHOLD) {
        tickOffset = nextNumeratorTick - selectedStep.end_tick
      } else if (Math.abs(selectedStep.end_tick + tickOffset - prevNumeratorTick) < TICK_SNAP_THRESHOLD) {
        tickOffset = prevNumeratorTick - selectedStep.end_tick
      }
    }

    let xOffset = dx / containerRect.width * 65536
    if (isSelectedStepJumpOrDown) xOffset = 0
    const leftPosWithOffset = selectedStep.left_pos + xOffset
    const rightPosWithOffset = selectedStep.right_pos + xOffset
    if (leftPosWithOffset < 0 || rightPosWithOffset > 65536) return
    const leftSnapPos = Math.round(leftPosWithOffset / (65536 / 16)) * (65536 / 16)
    const rightSnapPos = Math.round(rightPosWithOffset / (65536 / 16)) * (65536 / 16)
    if (Math.abs(leftPosWithOffset - leftSnapPos) < X_SNAP_THRESHOLD) {
      xOffset = leftSnapPos - selectedStep.left_pos
    } else if (Math.abs(rightPosWithOffset - rightSnapPos) < X_SNAP_THRESHOLD) {
      xOffset = rightSnapPos - selectedStep.right_pos
    }

    // Apply offsets after all checks

    const leftPos = Math.round(selectedStep.left_pos + xOffset)
    const rightPos = Math.round(selectedStep.right_pos + xOffset)
    const startTick = Math.round(selectedStep.start_tick + tickOffset)
    const endTick = Math.round(selectedStep.end_tick + tickOffset)
    if (leftPos < 0 || rightPos > 65536 || startTick < 0 || endTick > seq.info.end_tick) return

    if (selectedStep.long_point) {
      let invalid = false
      const points = selectedStep.long_point.point.map((point) => {
        const newTick = point.tick + tickOffset
        const newLeftPos = point.left_pos + xOffset
        const newRightPos = point.right_pos + xOffset
        if (newLeftPos < 0 || newRightPos > 65536 || newTick < startTick || newTick > endTick) {
          invalid = true
          return point
        }
        const newLeftEndPos = point.left_end_pos !== undefined ? point.left_end_pos + xOffset : 0
        const newRightEndPos = point.right_end_pos !== undefined ? point.right_end_pos + xOffset : 65536
        if (newLeftEndPos < 0 || newRightEndPos > 65536) {
          invalid = true
          return point
        }

        return {
          ...point,
          tick: Math.round(newTick),
          left_pos: Math.round(newLeftPos),
          right_pos: Math.round(newRightPos),
          left_end_pos: point.left_end_pos !== undefined ? Math.round(newLeftEndPos) : undefined,
          right_end_pos: point.right_end_pos !== undefined ? Math.round(newRightEndPos) : undefined,
        }
      })

      if (invalid) return
      selectedStep.long_point.point = points
    }

    selectedStep.start_tick = startTick
    selectedStep.end_tick = endTick
    selectedStep.left_pos = leftPos
    selectedStep.right_pos = rightPos
    forceRender((value) => value + 1)
  }, [selectedElem, selectedStep, speed])

  useEffect(() => {
    const fetchDataAndParse = async () => {
      try {
        const response = await fetch('/test.xml')
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        const xmlText = await response.text()
        const parsedData = parseSeq9XML(xmlText)
        seqRef.current = parsedData
        forceRender((value) => value + 1)
        setSelectedElem(null)
        setSelectedStep(null)
      } catch (error) {
        console.error('Error fetching or parsing XML:', error)
      }
    }
    fetchDataAndParse()
  }, [])

  const seq = seqRef.current
  const beatTicks = seq ? allBeatTicks(seq) : []
  const numeratorTicks = seq ? allNumeratorTicks(seq) : []

  return (
    <>
      <MenuBar />
      {seq
        ? (
          <div
            className='relative max-w-lg mx-auto' style={
          {
            height: tickToScreenOffset(seq.info.end_tick, seq, speed) + 'px',
          }
        }
          >
            <div
              className='relative mx-6 w-[calc(100% - 6rem)] h-full bg-gray-500'
              onClick={() => setSelectedElem(null)}
              ref={containerRef}
            >
              {beatTicks.map((tick) => (
                <div
                  key={tick}
                  className='absolute left-0 w-full h-1 bg-white'
                  style={{ top: tickToScreenOffset(tick, seq, speed) + 'px' }}
                />
              ))}
              {numeratorTicks.map((tick) => (
                <div
                  key={tick}
                  className='absolute left-0 w-full h-0.5 bg-white/50'
                  style={{ top: tickToScreenOffset(tick, seq, speed) + 'px' }}
                />
              ))}
              {Array.from({ length: 16 }).map((_, i) => i !== 0
                ? (
                  <div
                    key={i}
                    className={cn('absolute top-0 bottom-0 bg-white/20', i % 4 === 0 ? 'w-1' : 'w-0.5')}
                    style={{ left: i / 16 * 100 + '%' }}
                  />
                  )
                : null)}
              {seq.sequence_data.step.map((step, index) => (
                [StepKind.Left, StepKind.Right].includes(step.kind)
                  ? (
                    <StepComp
                      key={index}
                      step={step}
                      speed={speed}
                      seq={seq}
                      data-step-index={index}
                      className={cn(
                        step.kind === StepKind.Left ? 'text-orange-500' : 'text-blue-500'
                      )}
                      onContextMenu={(e) => {
                        e.preventDefault()
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedElem(e.currentTarget)
                        setSelectedStep(step)
                      }}
                    />
                    )
                  : (
                    <JumpDown
                      key={index}
                      step={step}
                      speed={speed}
                      seq={seq}
                      className={cn(
                        step.kind === StepKind.Down ? 'text-yellow-500' : 'text-cyan-500'
                      )}
                      onContextMenu={(e) => {
                        e.preventDefault()
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedElem(e.currentTarget)
                        setSelectedStep(step)
                      }}
                    />
                    )
              ))}
              <Moveable
                target={selectedElem}
                draggable
                origin={false}
                onDrag={onDrag}
                resizable={!selectedStep?.kind || [StepKind.Left, StepKind.Right].includes(selectedStep.kind)}
                throttleResize={1}
              />
            </div>
          </div>
          )
        : (
          <div className='text-center mt-10'>
            <p>Loading...</p>
          </div>
          )}
    </>
  )
}

export default App
