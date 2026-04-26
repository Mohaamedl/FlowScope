import { create } from 'zustand'
import type { BpmnModel, DiffSummary, DiffItem, ChangeType } from '@/core/models'

export type DiffFilter = ChangeType | 'all'

interface FlowScopeState {
  leftModel: BpmnModel | null
  rightModel: BpmnModel | null
  diffSummary: DiffSummary | null
  activeItemId: string | null
  filter: DiffFilter

  setLeftModel: (model: BpmnModel | null) => void
  setRightModel: (model: BpmnModel | null) => void
  setDiffSummary: (summary: DiffSummary | null) => void
  setActiveItem: (item: DiffItem | null) => void
  setFilter: (filter: DiffFilter) => void
}

export const useStore = create<FlowScopeState>((set) => ({
  leftModel: null,
  rightModel: null,
  diffSummary: null,
  activeItemId: null,
  filter: 'all',

  setLeftModel: (model) => set({ leftModel: model }),
  setRightModel: (model) => set({ rightModel: model }),
  setDiffSummary: (summary) => set({ diffSummary: summary }),
  setActiveItem: (item) => set({ activeItemId: item?.id ?? null }),
  setFilter: (filter) => set({ filter }),
}))

