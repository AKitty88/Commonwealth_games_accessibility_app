import {Injectable} from '@angular/core';
import {Http, Response} from '@angular/http';
import 'rxjs/Rx';
import 'rxjs/add/operator/map';

@Injectable()
export class jsonFileLoader {
	constructor(public http: Http) { }

	getData() {
		return this.http.get("assets/data/data.json")
			.map((res: Response) => res.json()); //records in this case
	}

	getTxtData() {
		return this.http.get("assets/data/gctoilets.txt")
			.map((res: Response) => res.text()); //records in this case
	}
}
