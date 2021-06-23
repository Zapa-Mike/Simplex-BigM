import { Injectable } from '@angular/core';
import { Constraint, ObjectiveFunction } from '../models/parser-models';
import { IterationData } from '../models/simplex-models';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor() {}
  public objFunc: ObjectiveFunction;
  public constraints: Constraint[];

  public result: IterationData = {
    result: null,
    solved: false,
    pivotElementColumnIndex: -1,
    pivotElementRowIndex: -1,
  };

  public pivotElementIndices: number[] = [];
  public pivotElementValues: number[] = [];
  public tableau: number[][] = [];

  public zjValuesGreaterZero: boolean = false;

  public cjValues: number[] = [];

  public zjValues: number[] = [];

  public ignoreIndex: boolean[] = [];

  public objFuncVariables: number[] = [];

  public get isObjectiveFunctionMin() {
    return this.objFunc.problemType == 'min';
  }

  public get amountOfExpressions() {
    return this.constraints[0].expressions.length;
  }
}
