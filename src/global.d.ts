// CSS modules and raw CSS imports
declare module '*.css'

// bpmn-js has no official @types package
declare module 'bpmn-js' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const BpmnJS: any
  export default BpmnJS
}

declare module 'bpmn-js/lib/Viewer' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const BpmnViewer: any
  export default BpmnViewer
}

declare module 'bpmn-js/lib/Modeler' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const BpmnModeler: any
  export default BpmnModeler
}
