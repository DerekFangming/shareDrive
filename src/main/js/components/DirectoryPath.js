import React, {Component} from 'react';
import Arrow from './Arrow';

export default class DirectoryPath extends Component {
	
	constructor() {
	    super();
	    this.state = {
	    	path: <nav className="nav nav-pills align-items-center"><a className="nav-link px-1" href="#">Home</a></nav>
	    };
	}
	
	createFilePath = (file) => {
		if (file.isFile) return;
		
		let filePath = file.path;
		let resultPath = [<a className="nav-link px-1" href="#">Home</a>];
		let filePathArray = filePath.split('/');
		
		for (let ind in filePathArray) {
			resultPath.push(<Arrow />);
			resultPath.push(<a className="nav-link px-1" href="#">{filePathArray[ind]}</a>);
		}
		
		this.setState({
			path: <nav className="nav nav-pills align-items-center">{resultPath}</nav>
		})
	}
	
	render () {
		return (
			<div className="col-md-12">
				{this.state.path}
			</div>
		);
	}
}
