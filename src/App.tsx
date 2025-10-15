import { useState, useEffect, useRef, useCallback } from 'react'
import Moveable, { type OnDrag } from 'react-moveable'
import { parseSeq9XML } from './lib/converter'
import { StepKind, type Seq9, type Step } from './types/seq9'
import { screenOffsetToTick, tickToScreenOffset } from './lib/timing'
import { Step as StepComp } from './components/notes/step'
import { cn } from './lib/utils'
import { JumpDown } from './components/notes/jump-down'
import { MenuBar } from './components/menubar'
import { useAtom } from 'jotai/react'
import { speedAtom } from '@/stores/speed.atom'

function App () {
  const [seq, setSeq] = useState<Seq9 | null>(null)
  const [speed] = useAtom(speedAtom)
  const [selectedElem, setSelectedElem] = useState<SVGElement | null>(null)
  const [selectedStep, setSelectedStep] = useState<Step | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const onDrag = useCallback(({ delta }: OnDrag) => {
    const [dx, dy] = delta
    const containerRect = containerRef.current?.getBoundingClientRect()
    const stepRect = selectedElem?.getBoundingClientRect()
    if (!containerRect || !selectedStep || !stepRect || !seq) return

    const tickOffset = screenOffsetToTick(stepRect.top + dy - containerRect.top - ([StepKind.Down, StepKind.Jump].includes(selectedStep.kind) ? 0 : 8), seq, speed) - selectedStep.start_tick
    if (selectedStep.start_tick + tickOffset < 0 || selectedStep.end_tick + tickOffset > seq.info.end_tick) return
    const xOffset = dx / containerRect.width * 65536
    const leftPos = Math.round(selectedStep.left_pos + xOffset)
    const rightPos = Math.round(selectedStep.right_pos + xOffset)
    const startTick = Math.round(selectedStep.start_tick + tickOffset)
    const endTick = Math.round(selectedStep.end_tick + tickOffset)
    if (leftPos < 0 || rightPos > 65536 || startTick < 0 || endTick > seq.info.end_tick) return
    selectedStep.start_tick = startTick
    selectedStep.end_tick = endTick
    if (selectedStep.long_point) {
      const updatedPoints = [...selectedStep.long_point.point]
      for (let i = 0; i < updatedPoints.length; i++) {
        const point = updatedPoints[i]
        const newTick = point.tick + tickOffset
        const newLeftPos = point.left_pos + xOffset
        const newRightPos = point.right_pos + xOffset
        if (newLeftPos < 0 || newRightPos > 65536 || newTick < selectedStep.start_tick || newTick > selectedStep.end_tick) {
          return
        }
        const newLeftEndPos = point.left_end_pos !== undefined ? point.left_end_pos + xOffset : 0
        const newRightEndPos = point.right_end_pos !== undefined ? point.right_end_pos + xOffset : 65536
        if (newLeftEndPos < 0 || newRightEndPos > 65536) {
          return
        }
        updatedPoints[i] = {
          ...point,
          tick: Math.round(newTick),
          left_pos: Math.round(newLeftPos),
          right_pos: Math.round(newRightPos),
          left_end_pos: point.left_end_pos !== undefined ? Math.round(newLeftEndPos) : undefined,
          right_end_pos: point.right_end_pos !== undefined ? Math.round(newRightEndPos) : undefined,
        }
      }
      selectedStep.long_point.point = updatedPoints
    }
    selectedStep.left_pos = leftPos
    selectedStep.right_pos = rightPos
    setSeq({ ...seq })
  }, [selectedElem, selectedStep, seq, speed])

  useEffect(() => {
    const fetchDataAndParse = async () => {
      try {
        const response = await fetch('/test.xml')
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        const xmlText = await response.text()
        const parsedData = parseSeq9XML(xmlText)
        setSeq(parsedData)
      } catch (error) {
        console.error('Error fetching or parsing XML:', error)
      }
    }
    fetchDataAndParse()
  }, [])

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
              {seq.sequence_data.step.filter((step) => [StepKind.Left, StepKind.Right].includes(step.kind)).map((step, index) => (
                <StepComp
                  key={index}
                  step={step}
                  speed={speed}
                  seq={seq}
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
              ))}
              {seq.sequence_data.step.filter((step) => [StepKind.Down, StepKind.Jump].includes(step.kind)).map((step, index) => (
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
