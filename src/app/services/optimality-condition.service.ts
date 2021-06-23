import { Injectable } from '@angular/core';
import { IterationData } from '../models/simplex-models';
import { DataService } from './data.service';

@Injectable({
  providedIn: 'root',
})
export class CheckConditionService {
  constructor(public sharedDataService: DataService) {}

  public getConditionFulfillmentStatus(): IterationData {
    let currentZj = 0;
    for (let i = 0; i < this.sharedDataService.tableau.length; i++) {
      currentZj = 0;
      for (let j = 0; j < this.sharedDataService.tableau[0].length; j++) {
        currentZj -= this.sharedDataService.ignoreIndex[
          this.sharedDataService.pivotElementIndices[j]
        ]
          ? this.sharedDataService.tableau[i][j]
          : 0;
      }
      //1 for Artificial values (M values)
      this.sharedDataService.zjValues[i] = this.sharedDataService.ignoreIndex[i]
        ? 1
        : currentZj;
    }

    console.log(this.sharedDataService.zjValues);

    let currentCj = 0;
    for (let i = 0; i < this.sharedDataService.tableau.length; i++) {
      currentCj = 0;
      for (let j = 0; j < this.sharedDataService.tableau[0].length; j++) {
        currentCj += this.sharedDataService.ignoreIndex[
          this.sharedDataService.pivotElementIndices[j]
        ]
          ? 0
          : this.sharedDataService.objFuncVariables[
              this.sharedDataService.pivotElementIndices[j]
            ] * this.sharedDataService.tableau[i][j];
      }

      this.sharedDataService.cjValues[i] =
        currentCj - this.sharedDataService.objFuncVariables[i];
    }
    console.log(this.sharedDataService.cjValues);

    let indexOfMostNegativeZValue = -1;

    for (let i = 0; i < this.sharedDataService.zjValues.length; i++) {
      if (this.sharedDataService.zjValues[i] >= 0) {
        continue;
      }

      if (
        !this.sharedDataService.zjValuesGreaterZero ||
        (this.sharedDataService.zjValuesGreaterZero &&
          !this.sharedDataService.ignoreIndex[i])
      ) {
        if (indexOfMostNegativeZValue == -1) {
          indexOfMostNegativeZValue = i;
        } else if (
          Math.abs(this.sharedDataService.zjValues[i]) >
          Math.abs(this.sharedDataService.zjValues[indexOfMostNegativeZValue])
        ) {
          indexOfMostNegativeZValue = i;
        }
      }
    }

    if (indexOfMostNegativeZValue == -1) {
      //Zj doesn't have negative values
      this.sharedDataService.zjValuesGreaterZero = true;
      let columnOfMostNegativeElement = -1;
      for (let i = 0; i < this.sharedDataService.cjValues.length; i++) {
        if (this.sharedDataService.cjValues[i] >= 0) {
          continue;
        }

        if (
          !this.sharedDataService.zjValuesGreaterZero ||
          (this.sharedDataService.zjValuesGreaterZero &&
            !this.sharedDataService.ignoreIndex[i])
        ) {
          if (columnOfMostNegativeElement == -1) {
            columnOfMostNegativeElement = i;
          } else if (
            Math.abs(this.sharedDataService.cjValues[i]) >
            Math.abs(
              this.sharedDataService.cjValues[columnOfMostNegativeElement]
            )
          ) {
            columnOfMostNegativeElement = i;
          }
        }
      }
      if (columnOfMostNegativeElement == -1) {
        let result: IterationData = {
          result: {
            finalFunctionValue: this.getFinalFunctionValue(),
            valueForEachVariable: this.getValueForEachVariable(),
          },
          solved: true,
        };
        return result;
      } else {
        let minRatioIndex = -1;
        const constraintValueCoefficientsOfPivot =
          this.sharedDataService.tableau[columnOfMostNegativeElement];
        for (let i = 0; i < constraintValueCoefficientsOfPivot.length; i++) {
          if (
            constraintValueCoefficientsOfPivot[i] > 0 &&
            this.sharedDataService.pivotElementValues[i] > 0
          ) {
            if (minRatioIndex == -1) {
              minRatioIndex = i;
            } else if (
              this.sharedDataService.pivotElementValues[i] /
                constraintValueCoefficientsOfPivot[i] <
              this.sharedDataService.pivotElementValues[minRatioIndex] /
                constraintValueCoefficientsOfPivot[minRatioIndex]
            ) {
              minRatioIndex = i;
            }
          }
        }
        let result: IterationData = {
          solved: false,
          pivotElementColumnIndex: columnOfMostNegativeElement,
          pivotElementRowIndex: minRatioIndex,
          result: null,
        };
        return result;
      }
    } else {
      let pivotColValues =
        this.sharedDataService.tableau[indexOfMostNegativeZValue];
      let minRatioIndex = -1;
      for (let i = 0; i < pivotColValues.length; i++) {
        if (
          pivotColValues[i] > 0 &&
          this.sharedDataService.pivotElementValues[i] > 0
        ) {
          if (minRatioIndex == -1) {
            minRatioIndex = i;
          } else if (
            this.sharedDataService.pivotElementValues[i] / pivotColValues[i] <
            this.sharedDataService.pivotElementValues[minRatioIndex] /
              pivotColValues[minRatioIndex]
          ) {
            minRatioIndex = i;
          }
        }
      }
      let result: IterationData = {
        result: null,
        solved: false,
        pivotElementColumnIndex: indexOfMostNegativeZValue,
        pivotElementRowIndex: minRatioIndex,
      };
      return result;
    }
  }

  private getValueForEachVariable(): number[] {
    let valueForEachVariable = [];
    this.sharedDataService.constraints[0].expressions.map((o) => {
      valueForEachVariable.push(0);
    });
    console.log(this.sharedDataService.pivotElementIndices);

    for (let i = 0; i < valueForEachVariable.length; i++) {
      if (
        this.sharedDataService.pivotElementIndices[i] <
        this.sharedDataService.objFunc.expressions.length
      ) {
        valueForEachVariable[this.sharedDataService.pivotElementIndices[i]] =
          this.sharedDataService.pivotElementValues[i];
      }
    }

    return valueForEachVariable;
  }

  private getFinalFunctionValue(): number {
    let result = 0;

    for (
      let i = 0;
      i < this.sharedDataService.pivotElementIndices.length;
      i++
    ) {
      result =
        result +
        this.sharedDataService.objFuncVariables[
          this.sharedDataService.pivotElementIndices[i]
        ] *
          this.sharedDataService.pivotElementValues[i];
    }

    return result;
  }
}
