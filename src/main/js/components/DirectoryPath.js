import React, {Component} from 'react';
import Arrow from './Arrow';

export default class DirectoryPath extends Component {
	
	constructor() {
	    super();
	    this.state = {
	    	path: <a className="nav-link px-1" href="#">Home</a>
	    };
	}
	
	createFilePath = (filePath) => {
		let resultPath = [<a className="nav-link px-1" href="#">Home</a>];
		let filePathArray = filePath.split('/');
		
		for (let ind in filePathArray) {
			resultPath.push(<Arrow />);
			resultPath.push(<a className="nav-link px-1" href="#">{filePathArray[ind]}</a>);
		}
		
		return (<div>{resultPath}</div>)
	}
	
	render () {
		return (
			<div className="col-md-12">
				<nav className="nav nav-pills">
					{this.state.path}
				</nav>
			</div>
		);
	}
}
