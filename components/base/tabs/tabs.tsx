'use client'

import type { ComponentType, ReactNode, Ref } from 'react'
import {
  Tab as AriaTab,
  TabList as AriaTabList,
  TabPanel as AriaTabPanel,
  Tabs as AriaTabs,
} from 'react-aria-components'
import type {
  TabListProps as AriaTabListProps,
  TabPanelProps as AriaTabPanelProps,
  TabProps as AriaTabProps,
  TabsProps as AriaTabsProps,
} from 'react-aria-components'

import { cx } from '@/utils/cx'

/**
 * Figma source: Board UI → Tab (node 3793:2942).
 *
 * Underline tabs. The tab strip sits on a 1px border/button/default baseline;
 * the active tab paints a 2px color/blue/600 underline over it.
 *   tab       px 10, py 8, gap 10 (label ↔ count), Body 1 (14/20)
 *     active     text color/blue/600, Medium weight, 2px blue underline
 *     inactive   text/primary, Regular weight, transparent underline
 *   count     radius/sm, px 4, py 1, Caption 1/Medium (12/16)
 *     active     bg color/blue/100, text color/blue/600
 *     inactive   bg black/10 @ 50% opacity, text/primary
 *   icon      optional 16px leading glyph, inherits the label color
 *
 * Built on react-aria Tabs: roving-tabindex arrow-key navigation, automatic
 * activation, and TabList/TabPanel association.
 */

type IconComponent = ComponentType<{
  className?: string
  'aria-hidden'?: boolean | 'true' | 'false'
}>

export interface TabsProps extends AriaTabsProps {
  ref?: Ref<HTMLDivElement>
}

export function Tabs({ className, ref, ...props }: TabsProps) {
  return (
    <AriaTabs
      ref={ref}
      {...props}
      className={state =>
        cx(
          'flex w-full flex-col gap-4',
          state.orientation === 'vertical' && 'flex-row',
          typeof className === 'function' ? className(state) : className,
        )
      }
    />
  )
}

export interface TabListProps<T extends object> extends AriaTabListProps<T> {
  ref?: Ref<HTMLDivElement>
}

/**
 * Re-skinned for Tensor: a rounded track of pills, the selected one filled
 * ink, in place of BoardUI's ruled list with a sliding underline. The pill
 * marks the selection by itself, so nothing has to be measured.
 */
export function TabList<T extends object>({ className, ref, ...props }: TabListProps<T>) {
  return (
    <AriaTabList
      ref={ref}
      {...props}
      className={state =>
        cx(
          'bg-surface ring-border inline-flex w-max items-center gap-1 rounded-full p-1 ring-1',
          typeof className === 'function' ? className(state) : className,
        )
      }
    />
  )
}

export interface TabProps extends Omit<AriaTabProps, 'children'> {
  children?: ReactNode
  /** Optional leading icon (16px). Inherits the label color. */
  icon?: IconComponent
  /** Optional trailing count badge. */
  count?: ReactNode
  ref?: Ref<HTMLDivElement>
}

export function Tab({ className, children, icon: Icon, count, ref, ...props }: TabProps) {
  return (
    <AriaTab
      ref={ref}
      {...props}
      className={state =>
        cx(
          'relative inline-flex h-9 cursor-pointer items-center gap-2 rounded-full px-3.5 text-sm whitespace-nowrap',
          'ease transition-colors duration-150 outline-none',
          'focus-visible:ring-ring focus-visible:ring-2',
          state.isSelected
            ? 'bg-landing-ink dark:bg-foreground dark:text-background text-white'
            : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground',
          state.isDisabled && 'cursor-not-allowed opacity-50',
          typeof className === 'function' ? className(state) : className,
        )
      }
    >
      {({ isSelected }) => (
        <>
          <span className="inline-flex items-center gap-1.5 font-medium">
            {Icon && <Icon className="size-4 shrink-0" aria-hidden />}
            {children}
          </span>
          {count != null && (
            <span
              className={cx(
                'inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 font-mono text-xs whitespace-nowrap tabular-nums',
                isSelected ? 'dark:bg-background/20 bg-white/20' : 'bg-surface-muted',
              )}
            >
              {count}
            </span>
          )}
        </>
      )}
    </AriaTab>
  )
}

export interface TabPanelProps extends AriaTabPanelProps {
  ref?: Ref<HTMLDivElement>
}

export function TabPanel({ className, ref, ...props }: TabPanelProps) {
  return (
    <AriaTabPanel
      ref={ref}
      {...props}
      className={state =>
        cx(
          'focus-visible:ring-border-focus-ring outline-none focus-visible:rounded-sm focus-visible:ring-2',
          typeof className === 'function' ? className(state) : className,
        )
      }
    />
  )
}
