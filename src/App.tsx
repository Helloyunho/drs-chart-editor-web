import { useState, useEffect } from 'react'
import { parseSeq9XML } from './lib/converter'
import { StepKind, type Seq9 } from './types/seq9'
import { tickToScreenOffset } from './lib/timing'
import { Step } from './components/notes/step'
import { cn } from './lib/utils'
import { JumpDown } from './components/notes/jump-down'
import { MenuBar } from './components/menubar'
import { useAtom } from 'jotai/react'
import { speedAtom } from '@/stores/speed.atom'

function App () {
  const [seq, setSeq] = useState<Seq9 | null>(null)
  const [speed] = useAtom(speedAtom)

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
            <div className='relative mx-6 w-[calc(100% - 6rem)] h-full bg-gray-500'>
              {seq.sequence_data.step.filter((step) => [StepKind.Left, StepKind.Right].includes(step.kind)).map((step, index) => (
                <Step
                  key={index}
                  step={step}
                  speed={speed}
                  seq={seq}
                  className={cn(
                    step.kind === StepKind.Left ? 'text-orange-500' : 'text-blue-500'
                  )}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    console.log(step)
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
                    console.log(step)
                  }}
                />
              ))}
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
