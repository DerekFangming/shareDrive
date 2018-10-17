import React, {Component} from 'react';
import DirectoryPath from './DirectoryPath';
import FileTable from './FileTable';
import InfoTables from './InfoTables';

export default class Container extends Component {
	
	constructor() {
		super();
		this.dirPath = React.createRef();
		this.fileTable = React.createRef();
		this.infoTable = React.createRef();
	}
	
	showFileDetailsHandler = (file) => {
		this.dirPath.current.createFilePath(file);
		this.infoTable.current.showFileDetailsHandler(file);
	}
	
	fileRenameHandler = (oldFile, newFile) => {
		this.fileTable.current.fileRenameHandler(oldFile, newFile);
	}
	
	dirPathClickHandler = (path) => {
		let file = path == null ? null : {isFile: false, path: path}
		this.fileTable.current.loadFolder(file);
		this.infoTable.current.showFileDetailsHandler(null);
	}
	
	render () {
		return (
			<div className="container-fluid">
				<div className="row mt-2">
					<DirectoryPath ref={this.dirPath} dirPathClickHandler={this.dirPathClickHandler}/>
				</div>
				
				<div className="row">
					<FileTable ref={this.fileTable} showFileDetailsHandler={this.showFileDetailsHandler}/>
					<InfoTables ref={this.infoTable} fileRenameHandler={this.fileRenameHandler}/>
				</div>
			</div>
		)
	}
	
}
