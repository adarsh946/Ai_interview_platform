let _interviewGraph: any = null;

export function setInterviewGraph(graph: any) {
  _interviewGraph = graph;
}

export function getInterviewGraph() {
  if (!_interviewGraph) throw new Error("Interview graph not initialized");
  return _interviewGraph;
}
