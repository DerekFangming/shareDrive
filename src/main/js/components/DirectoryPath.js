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
		let resultPath = [<a className="nav-link px-1" href="#" dir="root" onClick={(e) => this.loadDir(e) }>Home</a>];
		
		if (filePath != '') {
			let filePathArray = filePath.split('/');
			let curPath;
			
			for (let ind in filePathArray) {
				if (curPath == undefined) {
					curPath = '';
				} else {
					curPath += '/'
				}
				curPath += filePathArray[ind]
				
				resultPath.push(<Arrow />);
				resultPath.push(<a className="nav-link px-1" href="#" dir={curPath} onClick={(e) => this.loadDir(e) }> {filePathArray[ind]}</a>);
				
			}
		}
		
		this.setState({
			path: <nav className="nav nav-pills align-items-center">{resultPath}</nav>
		})
	}
	
	loadDir = (e) => {
		let dir = e.target.getAttribute('dir')
		this.props.dirPathClickHandler(dir)
		let file = {isFile: false, path: dir == 'root' ? '' : dir}
		this.createFilePath(file)
	}
	
	render () {
		return (
			<div className="col-md-12">
				{this.state.path}
			</div>
		);
	}
}
