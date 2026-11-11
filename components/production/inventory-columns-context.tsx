'use client'

import { createContext, useContext, type JSX, type ReactNode } from 'react'

import type { InventoryColumn, InventoryShelf } from '@/lib/validators/inventory-columns'

type ColumnsByShelf = Record<InventoryShelf, InventoryColumn[]>

const InventoryColumnsContext = createContext<ColumnsByShelf>({ filament: [], items: [] })

interface InventoryColumnsProviderProps {
  columns: ColumnsByShelf
  children: ReactNode
}

/**
 * Each shelf's custom columns, for the forms deep inside a row menu - an Edit
 * dialog is four components below the page that loaded them.
 */
export function InventoryColumnsProvider({
  columns,
  children,
}: InventoryColumnsProviderProps): JSX.Element {
  return (
    <InventoryColumnsContext.Provider value={columns}>{children}</InventoryColumnsContext.Provider>
  )
}

/** The custom columns of one shelf. */
export function useInventoryColumns(shelf: InventoryShelf): InventoryColumn[] {
  return useContext(InventoryColumnsContext)[shelf]
}
