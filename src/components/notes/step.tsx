import type { Seq9, Step as Seq9Step } from '@/types/seq9'
import { cn } from '@/lib/utils'
import { tickToScreenOffset } from '@/lib/timing'

const STROKE_WIDTH = 8

export const Step = ({ step, seq, className, speed = 1, ...props }: React.ComponentProps<'svg'> & {
  step: Seq9Step
  seq: Seq9
  speed?: number
}) => {
  const mostLeftPoint = step.long_point ? step.long_point.point.reduce((min, point) => Math.min(min, point.left_pos, point.left_end_pos ?? Infinity), step.left_pos) : step.left_pos
  const mostRightPoint = step.long_point ? step.long_point.point.reduce((max, point) => Math.max(max, point.right_pos, point.right_end_pos ?? 0), step.right_pos) : step.right_pos
  const width = mostRightPoint - mostLeftPoint

  return (
    <svg
      data-slot='step'
      width={width}
      height={step.end_tick - step.start_tick + STROKE_WIDTH}
      viewBox={`0 0 ${width} ${step.end_tick - step.start_tick + STROKE_WIDTH}`}
      style={{
        width: (width) / 65536 * 100 + '%',
        height: tickToScreenOffset(step.end_tick - step.start_tick, seq, speed) + STROKE_WIDTH + 'px',
        left: mostLeftPoint / 65536 * 100 + '%',
        top: tickToScreenOffset(step.start_tick, seq, speed) + STROKE_WIDTH,
      }}
      className={
        cn(
          'absolute',
          className
        )
      }
      preserveAspectRatio='none'
      {...props}
    >
      {step.long_point && step.long_point.point.length > 0
        ? (
          <>
            <path
              d={step.long_point.point.map((point, index) => {
                let prevLeftPos: number
                let prevRightPos: number
                let lastY: number = 0
                const currentY = point.tick - step.start_tick
                if (index === 0) {
                  prevLeftPos = step.left_pos
                  prevRightPos = step.right_pos
                } else {
                  prevLeftPos = step.long_point!.point[index - 1].left_end_pos ?? step.long_point!.point[index - 1].left_pos
                  prevRightPos = step.long_point!.point[index - 1].right_end_pos ?? step.long_point!.point[index - 1].right_pos
                  lastY = step.long_point!.point[index - 1].tick - step.start_tick
                }
                let d = `M ${prevLeftPos - mostLeftPoint} ${lastY} L ${prevRightPos - mostLeftPoint} ${lastY} L ${point.right_pos - mostLeftPoint} ${currentY} L ${point.left_pos - mostLeftPoint} ${currentY} L ${prevLeftPos - mostLeftPoint} ${lastY}`
                if (point.left_end_pos !== undefined && point.right_end_pos !== undefined) {
                  d += ` M ${point.left_pos - mostLeftPoint} ${currentY} L ${point.left_end_pos - mostLeftPoint} ${currentY} L ${point.right_end_pos - mostLeftPoint} ${currentY}`
                }
                return d
              }).join(' ')}
              fill='currentColor'
            />
            {step.long_point.point.length > 1 && step.long_point.point[step.long_point.point.length - 1].left_end_pos !== undefined && step.long_point.point[step.long_point.point.length - 1].right_end_pos !== undefined && (
              <line
                x1={step.long_point.point[step.long_point.point.length - 1].left_end_pos! - mostLeftPoint}
                y1={step.long_point.point[step.long_point.point.length - 1].tick - step.start_tick + STROKE_WIDTH / 2}
                x2={step.long_point.point[step.long_point.point.length - 1].right_end_pos! - mostLeftPoint}
                y2={step.long_point.point[step.long_point.point.length - 1].tick - step.start_tick + STROKE_WIDTH / 2}
                strokeWidth={STROKE_WIDTH}
                stroke='currentColor'
              />
            )}
          </>
          )
        : (
          <line
            x1={step.left_pos - mostLeftPoint}
            y1={STROKE_WIDTH / 2}
            x2={step.right_pos - step.left_pos}
            y2={STROKE_WIDTH / 2}
            strokeWidth={STROKE_WIDTH}
            stroke='currentColor'
          />
          )}
    </svg>
  )
}
