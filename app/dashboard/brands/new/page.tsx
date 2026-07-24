import { redirect } from 'next/navigation'

// The create-brand flow now lives at /create-brand. Keep this path working for
// any bookmarks by redirecting there.
export default function LegacyNewBrandPage(): never {
  redirect('/create-brand')
}
