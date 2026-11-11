/**
 * An approximate swatch for a colour NAME, for display only.
 *
 * A shelf row's real swatch is its colour_hex, which comes from BambuBuddy, the
 * shop's colour map or the built-in table - the same sources a render uses.
 * When none of those know a name ("Royal Blue", a typo like "Bbay Blue"), the
 * Inventory table still wants a dot, so this turns the name into a CSS colour
 * keyword. It is never stored and never reaches a printer.
 *
 * CSS keywords rather than hex values: the browser already defines them, so
 * there is no second palette here to drift from anything.
 */
const CSS_COLOUR_KEYWORDS = new Set([
  'black',
  'white',
  'red',
  'green',
  'blue',
  'yellow',
  'orange',
  'purple',
  'pink',
  'brown',
  'gray',
  'grey',
  'gold',
  'silver',
  'ivory',
  'beige',
  'navy',
  'teal',
  'cyan',
  'magenta',
  'maroon',
  'olive',
  'lime',
  'violet',
  'indigo',
  'turquoise',
  'coral',
  'salmon',
  'khaki',
  'lavender',
  'tan',
  'royalblue',
  'skyblue',
  'lightblue',
  'darkblue',
  'darkgreen',
  'lightgreen',
  'hotpink',
  'lightpink',
  'darkred',
  'lightgray',
  'lightgrey',
  'darkgray',
  'darkgrey',
])

/** Common shop names that are not CSS keywords, mapped to one that is. */
const ALIASES: Record<string, string> = {
  babyblue: 'lightblue',
  babypink: 'lightpink',
  skin: 'tan',
  cream: 'ivory',
  rosegold: 'salmon',
}

/** A CSS colour keyword for the name, or null when nothing fits. */
export function swatchForName(name: string | null | undefined): string | null {
  if (!name) return null
  const words = name.toLowerCase().trim().split(/\s+/).filter(Boolean)
  const joined = words.join('')
  for (const candidate of [joined, words[words.length - 1] ?? '']) {
    const keyword = ALIASES[candidate] ?? candidate
    if (CSS_COLOUR_KEYWORDS.has(keyword)) return keyword
  }
  return null
}
