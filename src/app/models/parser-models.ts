export interface Expression {
  coefficient: number;
  variable: string;
  sign: boolean;
}

export interface ObjectiveFunction {
  expressions: Expression[];
  problemType: 'max' | 'min';
  value: number;
}

export interface Constraint {
  expressions: Expression[];
  constraint: number;
}
