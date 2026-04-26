// CSS imports
declare module '*.css'

// bpmn-js — no official @types
declare module 'bpmn-js' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const BpmnJS: any
  export default BpmnJS
}

// bpmn-moddle
declare module 'bpmn-moddle' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export default class BpmnModdle {
    fromXML(xml: string): Promise<{
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rootElement: any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      warnings: any[]
    }>
  }
}

// bpmn-js-properties-panel
declare module 'bpmn-js-properties-panel' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const BpmnPropertiesPanelModule: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const BpmnPropertiesProviderModule: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const CamundaPlatformPropertiesProviderModule: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const ZeebePropertiesProviderModule: any
}

declare module 'camunda-bpmn-js-behaviors/lib/camunda-platform' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CamundaBehaviors: any
  export default CamundaBehaviors
}

// bpmn-js-differ
declare module 'bpmn-js-differ' {
  export interface AttrChange {
    oldValue: unknown
    newValue: unknown
  }

  export interface ChangedEntry {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model: any
    attrs: Record<string, AttrChange>
  }

  export interface ChangeHandlerResult {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _added: Record<string, any>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _removed: Record<string, any>
    _changed: Record<string, ChangedEntry>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _layoutChanged: Record<string, any>
  }

  export class ChangeHandler implements ChangeHandlerResult {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _added: Record<string, any>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _removed: Record<string, any>
    _changed: Record<string, ChangedEntry>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _layoutChanged: Record<string, any>
  }

  export class Differ {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    diff(a: any, b: any, handler?: ChangeHandler): ChangeHandler
  }
}
