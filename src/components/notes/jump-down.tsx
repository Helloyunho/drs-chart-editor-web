import { tickToScreenOffset } from '@/lib/timing'
import { cn } from '@/lib/utils'
import { type Seq9, type Step } from '@/types/seq9'

export const JumpDown = ({ className, seq, speed = 1, step, ...props }: React.ComponentProps<'svg'> & {
  seq: Seq9
  speed?: number
  step: Step
}) => {
  return (
    <svg
      data-slot='jump-down'
      width={24}
      height={24}
      viewBox='0 0 24 24'
      className={
        cn(
          'absolute size-4 -left-5',
          className
        )
      }
      style={{
        top: tickToScreenOffset(step.start_tick, seq, speed) + 'px',
      }}
      preserveAspectRatio='none'
      {...props}
    >
      <circle cx={12} cy={12} r={12} fill='currentColor' />
    </svg>
  )
}
