/** The headline each auth page's sky panel carries. */
export interface AuthPanelCopy {
  title: string
  /** The second, lighter line of the two-tone headline. */
  highlight: string
}

export const AUTH_PANELS = {
  signIn: { title: 'Every print,', highlight: 'accounted for' },
  setup: { title: 'Set up your', highlight: 'print floor' },
  invite: { title: 'Welcome to', highlight: 'the floor' },
} as const satisfies Record<string, AuthPanelCopy>
