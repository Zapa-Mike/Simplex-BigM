export interface Result {
  finalFunctionValue: number;
  valueForEachVariable: number[];
}
export interface IterationData {
  solved: boolean;
  result: Result;
  pivotElementRowIndex?: number;
  pivotElementColumnIndex?: number;
}
