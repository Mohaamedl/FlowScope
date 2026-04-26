/** The parsed representation of a BPMN 2.0 process model. */
export interface BpmnModel {
  /**
   * bpmn:Definitions moddle root object produced by BpmnModdle.fromXML().
   * Typed as unknown — consumers cast as needed; type declarations live in global.d.ts.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  definitions: any
  /** Raw XML string — passed directly to bpmn-js for rendering. */
  sourceXml: string
  /** Human-readable label for the source (filename, git ref, etc.). */
  label: string
}
