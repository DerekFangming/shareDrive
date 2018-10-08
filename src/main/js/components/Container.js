import React, {Component} from 'react';
import DirectoryPath from './DirectoryPath';
import FileTable from './FileTable';
import InfoTables from './InfoTables';

export default class Container extends Component {
	
	constructor() {
		super();
		this.infoTable = React.createRef();
	}
	
	fileClickHandler = (file) => {
		this.infoTable.current.fileClickHandler(file)
	}
	
	render () {
		return (
			<div className="container-fluid">
				<div className="row mt-2">
					<DirectoryPath />
				</div>
				
				<div className="row">
					<FileTable fileClickHandler={this.fileClickHandler}/>
					<InfoTables ref={this.infoTable}/>
				</div>
			</div>
		)
	}
	
}
