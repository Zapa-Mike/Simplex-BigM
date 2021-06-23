import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Constraint, ObjectiveFunction } from './models/parser-models';
import { Result } from './models/simplex-models';
import { DataService } from './services/data.service';
import { ParserService } from './services/parser.service';
import { SimplexService } from './services/simplex.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'simplex';
  public solutionFound = false;
  public result: Result;

  public form = this.formBuilder.group({
    benchmark: [
      '',
      {
        updateOn: 'change',
      },
    ],
  });

  constructor(
    public parser: ParserService,
    public formBuilder: FormBuilder,
    public simplex: SimplexService,
    public sharedDataService: DataService
  ) {}

  public async solve() {
    await this.parser.parse(+this.form.get('benchmark').value);
    this.sharedDataService.objFunc = this.parser.objectiveFunction;
    this.sharedDataService.constraints = this.parser.constraints;
    this.result = this.simplex.solve();
    this.solutionFound = true;
  }
}
