import { templateKeyFromFileName } from '@/lib/template-key'

/**
 * Why one chosen file will or will not be uploaded.
 *
 * Every reason is decided BEFORE anything is sent, so the dialog can show the
 * whole batch and what will happen to it. Finding out that four of nine files
 * were skipped by reading the table afterwards is how somebody concludes the
 * upload is broken.
 */
export type DesignUploadStatus =
  /** Will be uploaded and filed. */
  | 'ready'
  /** A design is already filed under this key. */
  | 'taken'
  /** Two of the chosen files reduce to the same key. */
  | 'duplicate'
  /** The file's name has nothing in it to make a key from. */
  | 'unusable'

export interface DesignUploadCandidate {
  /** The file as chosen, for the upload itself. */
  file: File
  /** The name as shown, so a skipped row is recognisable. */
  fileName: string
  /** The key it would be filed under, '' when the name yields none. */
  key: string
  status: DesignUploadStatus
}

export interface DesignUploadPlan {
  candidates: DesignUploadCandidate[]
  /** Just the ones that will be sent, in the order they were chosen. */
  ready: DesignUploadCandidate[]
  /** Everything else, each with a reason. */
  skipped: DesignUploadCandidate[]
}

/**
 * What will happen to each of the files somebody just chose.
 *
 * Uploading many at once is the point - a product arrives as a folder of
 * .scad files and filing them one dialog at a time is the manual effort this
 * removes - but a batch makes two mistakes possible that a single file could
 * not:
 *
 *  - TWO CHOSEN FILES REDUCING TO ONE KEY. "pwdh-p.scad" and "PWDH P.scad"
 *    both become pwdh-p. Uploaded in sequence, the second would not be a
 *    second design: the endpoint treats a repeat key as a new VERSION, so one
 *    file would silently replace the other and the table would show one row
 *    where somebody chose two files.
 *  - ONE BAD FILE IN NINE. Refusing the whole batch over a single clash would
 *    mean re-picking the other eight, which is the manual effort again.
 *
 * So each file is judged on its own, the good ones go, and the skipped ones
 * are named with their reason. A caller that wants all-or-nothing can check
 * `skipped` before starting; this deliberately does not decide that.
 *
 * PURE, and separate from the dialog, so the rules above are testable without
 * rendering anything or uploading anything.
 */
export function planDesignUploads(files: File[], existingKeys: string[]): DesignUploadPlan {
  const taken = new Set(existingKeys.map(sameDesignAs))
  const seen = new Set<string>()

  const candidates = files.map((file): DesignUploadCandidate => {
    const key = templateKeyFromFileName(file.name)
    const base = { file, fileName: file.name, key }
    const same = sameDesignAs(key)

    if (key === '') return { ...base, status: 'unusable' }
    if (taken.has(same)) return { ...base, status: 'taken' }
    // Checked against the files chosen alongside it, in the order they were
    // chosen: the FIRST file to claim a key keeps it, and a later one that
    // would overwrite it is the one held back.
    if (seen.has(same)) return { ...base, status: 'duplicate' }

    seen.add(same)
    return { ...base, status: 'ready' }
  })

  return {
    candidates,
    ready: candidates.filter(c => c.status === 'ready'),
    skipped: candidates.filter(c => c.status !== 'ready'),
  }
}

/**
 * The form two keys are compared in to decide they are the same design.
 *
 * LOOSER THAN THE KEY ITSELF, deliberately, and only for comparing. The key
 * stored is faithful to the filename - a hyphen survives, because every live
 * Diwali key is hyphenated - but the shop does not name its files
 * consistently enough for that to be a safe equality test. "pwdh-p.scad" and
 * "PWDH P.scad" are the same design exported twice, and they derive pwdh-p
 * and pwdh_p: distinct keys, so without this the second uploads cleanly and
 * sits in the table beside the first, two rows for one drawing with nothing
 * saying which a variant should link to.
 *
 * So a separator is a separator when asking "is this already here?", and the
 * answer sends somebody to Replace.
 */
function sameDesignAs(key: string): string {
  return key.trim().toLowerCase().replace(/[_-]+/g, '-')
}

/** The sentence shown against a file that will not be uploaded. */
export function skipReason(candidate: DesignUploadCandidate): string {
  switch (candidate.status) {
    case 'taken':
      return `already filed as ${candidate.key} — use Replace on its row for a new version`
    case 'duplicate':
      return `another chosen file is already becoming ${candidate.key}`
    case 'unusable':
      return 'nothing in the name to make a key from'
    default:
      return ''
  }
}
