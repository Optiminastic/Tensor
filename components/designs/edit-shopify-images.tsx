'use client'

import { Plus, RotateCcw, X } from 'lucide-react'
import Image from 'next/image'
import type { JSX } from 'react'

import { Field } from '@/components/ui/field'
import type { ShopifyListingImage } from '@/lib/validators/shopify-listing'

interface ListingImagesProps {
  existing: ShopifyListingImage[]
  removedIds: string[]
  onToggleExisting: (id: string) => void
  newImages: File[]
  onAddFiles: (files: FileList | null) => void
  onRemoveNew: (index: number) => void
}

/**
 * The listing's image gallery editor: current Shopify images that can be marked
 * for removal (and un-marked), plus newly picked files to add. State lives in the
 * parent form; this component is presentation and event wiring only.
 */
export function ListingImages({
  existing,
  removedIds,
  onToggleExisting,
  newImages,
  onAddFiles,
  onRemoveNew,
}: ListingImagesProps): JSX.Element {
  return (
    <Field label="Images" htmlFor="edit-add-images" hint="Mark to remove, or add new ones">
      {existing.length > 0 ? (
        <ul className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {existing.map(image => {
            const removing = removedIds.includes(image.id)
            return (
              <li key={image.id} className="relative">
                <div className="border-border bg-surface-muted relative aspect-square overflow-hidden rounded-md border">
                  <Image
                    src={image.url}
                    alt=""
                    fill
                    sizes="120px"
                    className={`object-cover transition-opacity ${removing ? 'opacity-30' : ''}`}
                  />
                  {removing ? (
                    <span className="bg-danger-subtle text-danger absolute inset-x-0 bottom-0 py-0.5 text-center text-[0.65rem] font-medium">
                      Removing
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => onToggleExisting(image.id)}
                  aria-label={removing ? 'Keep this image' : 'Remove this image'}
                  className="border-border bg-surface text-muted-foreground hover:text-foreground absolute -top-2 -right-2 rounded-full border p-1 shadow-xs"
                >
                  {removing ? (
                    <RotateCcw className="size-3" aria-hidden />
                  ) : (
                    <X className="size-3" aria-hidden />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}

      <label
        htmlFor="edit-add-images"
        className="border-border text-muted-foreground hover:border-border-strong hover:text-foreground flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm transition-colors"
      >
        <Plus className="size-4" aria-hidden />
        Add images
      </label>
      <input
        id="edit-add-images"
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={e => {
          onAddFiles(e.target.files)
          e.target.value = ''
        }}
      />

      {newImages.length > 0 ? (
        <ul className="mt-2 flex flex-col gap-1.5">
          {newImages.map((image, index) => (
            <li
              key={`${image.name}-${image.size}`}
              className="border-border flex items-center justify-between gap-3 rounded-md border px-3 py-2"
            >
              <span className="text-foreground truncate text-sm">
                {image.name}
                <span className="text-subtle-foreground ml-2 font-mono text-xs">
                  {(image.size / 1024).toFixed(0)} KB
                </span>
              </span>
              <button
                type="button"
                onClick={() => onRemoveNew(index)}
                aria-label={`Remove ${image.name}`}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </Field>
  )
}
