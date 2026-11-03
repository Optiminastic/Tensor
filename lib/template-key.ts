/**
 * The key a design file is filed under, taken from the file's own name.
 *
 * The key is what the renderer looks up and what a variant links to, and it
 * used to be typed by hand beside the file picker. Typing it is the step
 * nobody should have to take: the designer already named the file, and the
 * name they gave it is the name they will go looking for.
 *
 * WHAT THE TYPED FIELD WAS GUARDING AGAINST IS REAL, THOUGH, and it is why
 * this is a normalisation rather than a trimmed extension. A file dragged out
 * of a downloads folder is called "dnp_two_heart (2).scad"; a file exported
 * from the shop's own folders is called "PDHR Gold v2.scad". Both have to
 * come out as something a person can type, read back, and put in a URL -
 * the key is a path segment on the upload route and a varchar(64) in the
 * table.
 *
 *   dnp_three_heart.scad      -> dnp_three_heart
 *   dnp_two_heart (2).scad    -> dnp_two_heart_2
 *   PDHR Gold v2.scad         -> pdhr_gold_v2
 *   lotus-diya-holder.SCAD    -> lotus-diya-holder
 *   pwdh-p.scad               -> pwdh-p
 *
 * A HYPHEN IS KEPT, and that is not cosmetic. This shop's live keys are
 * pdhr-g, pdhr-p, pdhr-r, pwdh-p, pwdh-r and pwdh-w - hyphens, not
 * underscores - so folding them would derive "pwdh_p" for pwdh-p.scad, miss
 * the key already in the table, and quietly file a second design beside the
 * one it was meant to be. The dialog's "already exists" warning is what
 * stands between somebody and that mistake, and it only fires on an exact
 * match.
 *
 * The derived key is SHOWN before the upload, never only after it. Deriving
 * it silently would be the same hazard the typed field had, moved somewhere
 * nobody can see it.
 */
export function templateKeyFromFileName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.scad$/i, '')
  const key = withoutExtension
    .toLowerCase()
    // Any run of anything else becomes one underscore, so spaces, brackets
    // and dots all collapse the same way. A hyphen survives - see above.
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^[_-]+|[_-]+$/g, '')

  // varchar(64) in design_templates. Truncated here rather than refused by
  // Postgres, and the trailing separator a cut can leave is tidied so the
  // key reads as a name.
  return key.slice(0, 64).replace(/[_-]+$/g, '')
}
