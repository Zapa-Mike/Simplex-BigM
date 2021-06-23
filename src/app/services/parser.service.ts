import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Constraint,
  ObjectiveFunction,
  Expression,
} from '../models/parser-models';

@Injectable({
  providedIn: 'root',
})
export class ParserService {
  private fileData: string;
  public constraints: Constraint[] = [];
  public objectiveFunction: ObjectiveFunction = {
    expressions: [],
    problemType: 'min',
    value: 0,
  };
  private constraintExpressions: Expression[] = [];
  private constraintValues: number[] = [];
  private objectiveFunctionExpressions: Expression[] = [];

  private reset() {
    this.constraints = [];
    this.objectiveFunction = {
      expressions: [],
      problemType: 'min',
      value: 0,
    };
    this.constraintExpressions = [];
    this.constraintValues = [];
    this.objectiveFunctionExpressions = [];
  }
  public async parse(benchmarkNumber: number) {
    this.reset();
    this.fileData = await this.http
      .get('assets/KI_' + benchmarkNumber + '.txt', { responseType: 'text' })
      .toPromise();

    {
      let semiColonsPassed = 0;
      for (let index = 0; index < this.fileData.length; index++) {
        if (index + 1 == this.fileData.length) {
          break;
        }
        if (this.fileData[index] == ';') {
          semiColonsPassed += 1;
        }
        if (this.fileData[index] != ';') {
          let expression: Expression = {
            coefficient: -1,
            variable: '',
            sign: false,
          };
          if (this.fileData[index] == '+') {
            expression.sign = true;
            const positionOFSpaceAfterPlusSign = index + 1;
            const positionOfNextMultiplicationSign =
              this.fileData.substr(index + 1).indexOf('*') +
              positionOFSpaceAfterPlusSign;
            const coefficient = this.fileData.substring(
              positionOFSpaceAfterPlusSign,
              positionOfNextMultiplicationSign
            );
            expression.coefficient = +coefficient.trim();

            const positionOfNextSpace =
              this.fileData
                .substr(positionOfNextMultiplicationSign)
                .indexOf(' ') + positionOfNextMultiplicationSign;

            const variable = this.fileData
              .substring(
                positionOfNextMultiplicationSign + 1,
                positionOfNextSpace
              )
              .trim()
              .split(';')[0];
            expression.variable = variable;
            if (semiColonsPassed > 0) {
              this.constraintExpressions.push(expression);
            } else {
              this.objectiveFunctionExpressions.push(expression);
            }
          }
        } else {
          if (semiColonsPassed > 1) {
            let spaceIndicatorIndex = index;
            let fromSemiColonToSpace = 0;
            while (this.fileData[spaceIndicatorIndex] != ' ') {
              spaceIndicatorIndex -= 1;
              fromSemiColonToSpace += 1;
            }
            const fromSpaceToSemiColonWithoutSpaceOrSemiColon = this.fileData
              .substring(index - fromSemiColonToSpace, index)
              .trim();

            const constraintValue =
              +fromSpaceToSemiColonWithoutSpaceOrSemiColon;
            this.constraintValues.push(constraintValue);
            this.constraintExpressions.push({
              coefficient: -1,
              variable: 'separator',
              sign: true,
            });
          }
        }
      }
      this.mapExpressionsToObjectiveFunction();
      this.mapExpressionsToConstraints();

      console.log(this.constraints);
      console.log(this.objectiveFunction);
    }
  }
  public constructor(private http: HttpClient) {}

  private mapExpressionsToConstraints() {
    let constraints: Constraint[] = [];
    let numberOfConstraints = this.constraintExpressions.filter(
      (e) => e.variable == 'separator'
    ).length;

    let currentIndex = 0;
    while (true) {
      let constraint: Constraint = {
        expressions: [],
        constraint: -1,
      };
      for (
        let index = currentIndex;
        index < this.constraintExpressions.length;
        index++
      ) {
        const element = this.constraintExpressions[index];
        if (element.variable == 'separator') {
          currentIndex = index + 1;
          break;
        }
        constraint.expressions.push(element);
      }
      constraints.push(constraint);
      if (constraints.length == numberOfConstraints) {
        break;
      }
    }
    this.constraints = constraints;
    for (let index = 0; index < this.constraintValues.length; index++) {
      this.constraints[index].constraint = this.constraintValues[index];
    }
  }

  private mapExpressionsToObjectiveFunction() {
    this.objectiveFunction.expressions = this.objectiveFunctionExpressions;
    this.objectiveFunction.problemType = this.fileData.includes('min')
      ? 'min'
      : 'max';
  }
}
