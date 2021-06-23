import { Injectable } from '@angular/core';
import { Result } from '../models/simplex-models';
import { DataService } from './data.service';
import { CheckConditionService } from './optimality-condition.service';

@Injectable({
  providedIn: 'root',
})
export class SimplexService {
  constructor(
    public checkCondition: CheckConditionService,
    public sharedDataService: DataService
  ) {}

  public solve(): Result {
    this.step1();
    var result = this.step2();
    return result;
  }

  private step2(): Result {
    this.sharedDataService.result =
      this.checkCondition.getConditionFulfillmentStatus();
    console.log(this.sharedDataService.result);

    while (!this.sharedDataService.result.solved) {
      this.getNewMatrixFromPivot(
        this.sharedDataService.result.pivotElementRowIndex,
        this.sharedDataService.result.pivotElementColumnIndex
      );
      this.sharedDataService.result =
        this.checkCondition.getConditionFulfillmentStatus();
      console.log(this.sharedDataService.result);
    }

    return this.sharedDataService.result.result;
  }

  private getNewMatrixFromPivot(
    pivotElementRowIndex: number,
    pivotElementColumnIndex: number
  ) {
    this.sharedDataService.pivotElementIndices[pivotElementRowIndex] =
      pivotElementColumnIndex;

    let pivotColumnWithNormalizedPivotValue = [];

    let pivotElement =
      this.sharedDataService.tableau[pivotElementColumnIndex][
        pivotElementRowIndex
      ];

    //normalize pivot column
    for (let i = 0; i < this.sharedDataService.tableau.length; i++) {
      pivotColumnWithNormalizedPivotValue[i] =
        this.sharedDataService.tableau[i][pivotElementRowIndex] / pivotElement;
    }

    console.log(pivotColumnWithNormalizedPivotValue);

    console.log(pivotElement);

    //recalculate pivot element values
    let newPivotElementValues = [];
    newPivotElementValues.length =
      this.sharedDataService.pivotElementValues.length;
    for (let i = 0; i < this.sharedDataService.pivotElementValues.length; i++) {
      if (pivotElementRowIndex == i) {
        newPivotElementValues[i] =
          this.sharedDataService.pivotElementValues[i] / pivotElement;
      } else {
        newPivotElementValues[i] =
          this.sharedDataService.pivotElementValues[i] -
          (this.sharedDataService.pivotElementValues[pivotElementRowIndex] /
            pivotElement) *
            this.sharedDataService.tableau[pivotElementColumnIndex][i];
      }
    }
    this.sharedDataService.pivotElementValues = newPivotElementValues;
    console.log(this.sharedDataService.pivotElementValues);

    //recalculate matrix
    let newTableau: number[][] = [];
    newTableau.length = this.sharedDataService.tableau.length;
    for (let i = 0; i < this.sharedDataService.tableau.length; i++) {
      newTableau[i] = [];
      for (
        let j = 0;
        j < this.sharedDataService.pivotElementIndices.length;
        j++
      ) {
        if (j == pivotElementRowIndex) {
          newTableau[i][j] = pivotColumnWithNormalizedPivotValue[i];
        } else {
          newTableau[i][j] =
            this.sharedDataService.tableau[i][j] -
            pivotColumnWithNormalizedPivotValue[i] *
              this.sharedDataService.tableau[pivotElementColumnIndex][j];
        }
      }
    }
    this.sharedDataService.tableau = newTableau;

    console.log(this.sharedDataService.tableau);
  }

  private step1() {
    if (this.sharedDataService.isObjectiveFunctionMin) {
      this.turnObjFuncToMax();
    }

    this.sharedDataService.tableau = this.resolveTableau();

    this.sharedDataService.pivotElementIndices.length =
      this.sharedDataService.constraints.length;
    for (let i = 0; i < this.sharedDataService.constraints.length; i++) {
      this.sharedDataService.pivotElementIndices[i] =
        this.sharedDataService.tableau.length -
        this.sharedDataService.constraints.length +
        i;
    }

    this.initializeIgnoreIndexArray();

    this.initializePivotElementArray();

    this.initializeObjFuncVariables();
  }

  private initializeObjFuncVariables() {
    this.sharedDataService.objFuncVariables.length =
      this.sharedDataService.tableau.length;
    for (let i = 0; i < this.sharedDataService.tableau.length; i++) {
      this.sharedDataService.objFuncVariables[i] =
        i < this.sharedDataService.objFunc.expressions.length
          ? this.sharedDataService.objFunc.expressions[i].coefficient
          : 0;
    }
  }

  private initializePivotElementArray() {
    this.sharedDataService.pivotElementValues.length =
      this.sharedDataService.constraints.length;
    for (let i = 0; i < this.sharedDataService.constraints.length; i++) {
      this.sharedDataService.pivotElementValues[i] =
        this.sharedDataService.constraints[i].constraint;
    }
  }

  private initializeIgnoreIndexArray() {
    this.sharedDataService.ignoreIndex.length =
      this.sharedDataService.tableau.length;

    for (let i = 0; i < this.sharedDataService.tableau.length; i++) {
      this.sharedDataService.ignoreIndex[i] = false;
    }
    for (let i = 0; i < this.sharedDataService.constraints.length; i++) {
      this.sharedDataService.ignoreIndex[
        this.sharedDataService.ignoreIndex.length - i - 1
      ] = true;
    }
  }

  private resolveTableau(): number[][] {
    let tableauOfConstraints: number[][] = [];
    tableauOfConstraints.length = this.sharedDataService.amountOfExpressions;

    for (let i = 0; i < this.sharedDataService.amountOfExpressions; i++) {
      tableauOfConstraints[i] = [];
      tableauOfConstraints[i].length =
        this.sharedDataService.constraints.length;
      for (let j = 0; j < this.sharedDataService.constraints.length; j++) {
        tableauOfConstraints[i][j] =
          this.sharedDataService.constraints[j].expressions[i].coefficient;
      }
    }
    let tableauOfSurplusVariables: number[][] = [];
    tableauOfSurplusVariables.length =
      this.sharedDataService.constraints.length;
    for (let i = 0; i < this.sharedDataService.constraints.length; i++) {
      tableauOfSurplusVariables[i] = [];
      tableauOfSurplusVariables[i].length =
        this.sharedDataService.constraints.length;

      for (let j = 0; j < this.sharedDataService.constraints.length; j++) {
        tableauOfSurplusVariables[i][j] = j == i ? -1 : 0;
      }
    }
    let tableauOfArtificialVariables: number[][] = [];
    tableauOfArtificialVariables.length =
      this.sharedDataService.constraints.length;
    for (let i = 0; i < this.sharedDataService.constraints.length; i++) {
      tableauOfArtificialVariables[i] = [];
      tableauOfArtificialVariables[i].length =
        this.sharedDataService.constraints.length;

      for (let j = 0; j < this.sharedDataService.constraints.length; j++) {
        tableauOfArtificialVariables[i][j] = j == i ? 1 : 0;
      }
    }

    var finalTableau = tableauOfConstraints
      .concat(tableauOfSurplusVariables)
      .concat(tableauOfArtificialVariables);

    return finalTableau;
  }

  private turnObjFuncToMax() {
    let maxFunctionExpressions = this.sharedDataService.objFunc.expressions.map(
      (expression) => {
        expression.coefficient = expression.coefficient * -1;
        return expression;
      }
    );
    this.sharedDataService.objFunc.expressions = maxFunctionExpressions;
    this.sharedDataService.objFunc.value =
      this.sharedDataService.objFunc.value * -1;
  }
}
