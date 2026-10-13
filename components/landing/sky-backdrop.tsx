import type { JSX } from 'react'

const VIEW_WIDTH = 1200
const VIEW_HEIGHT = 700
const HORIZON_Y = 420
const VANISH_X = VIEW_WIDTH / 2
/** Rails of the build plate, fanning out from the vanishing point. */
const RAIL_COUNT = 24
/** Cross lines of the plate, closer together towards the horizon. */
const ROW_COUNT = 9

function rails(): JSX.Element[] {
  const spread = VIEW_WIDTH * 2.4
  return Array.from({ length: RAIL_COUNT + 1 }, (_, i) => {
    const x = VANISH_X - spread / 2 + (spread / RAIL_COUNT) * i
    return <line key={`r${i}`} x1={VANISH_X} y1={HORIZON_Y} x2={x} y2={VIEW_HEIGHT} />
  })
}

function rows(): JSX.Element[] {
  return Array.from({ length: ROW_COUNT }, (_, i) => {
    const t = (i + 1) / ROW_COUNT
    const y = HORIZON_Y + (VIEW_HEIGHT - HORIZON_Y) * t * t
    return <line key={`h${i}`} x1={0} y1={y} x2={VIEW_WIDTH} y2={y} />
  })
}

interface SkyBackdropProps {
  /**
   * "hero" fades to a pale horizon, for content that ends in dark text.
   * "deep" stays saturated top to bottom and leaves out the build plate, so
   * white text holds its contrast everywhere on the card.
   */
  variant?: 'hero' | 'deep'
}

/**
 * The hero's sky, given a 3D-printing surface: the fine horizontal ridges of
 * printed layers, and a build plate receding to the horizon where the
 * inspiration had clouds. Decorative only, so hidden from assistive tech.
 */
export function SkyBackdrop({ variant = 'hero' }: SkyBackdropProps): JSX.Element {
  const deep = variant === 'deep'
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className={`absolute inset-0 bg-gradient-to-b ${
          deep
            ? 'from-landing-sky-deep to-landing-sky-mid'
            : 'from-landing-sky-deep via-landing-sky to-landing-sky-haze'
        }`}
      />
      <svg
        className="absolute inset-0 size-full"
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="landing-layers" width="8" height="6" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0.5" x2="8" y2="0.5" stroke="white" strokeOpacity="0.07" />
          </pattern>
          <linearGradient id="landing-plate-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.55" stopColor="white" stopOpacity="0" />
            <stop offset="1" stopColor="white" stopOpacity="1" />
          </linearGradient>
          <mask id="landing-plate-mask">
            <rect width={VIEW_WIDTH} height={VIEW_HEIGHT} fill="url(#landing-plate-fade)" />
          </mask>
        </defs>
        <rect width={VIEW_WIDTH} height={VIEW_HEIGHT} fill="url(#landing-layers)" />
        {deep ? null : (
          <g mask="url(#landing-plate-mask)" stroke="white" strokeOpacity="0.35" strokeWidth="1">
            {rails()}
            {rows()}
          </g>
        )}
      </svg>
      {deep ? null : (
        <div className="absolute inset-x-[-10%] bottom-[-35%] h-2/3 rounded-full bg-white/45 blur-3xl" />
      )}
    </div>
  )
}
