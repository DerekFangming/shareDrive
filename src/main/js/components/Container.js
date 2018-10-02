import React, {Component} from 'react';
import DirectoryPath from './DirectoryPath';
import FileTable from './FileTable';
import InfoTables from './InfoTables';

const Container = () => {
	return (
		<div className="container-fluid">
			<div className="row mt-2">
				<DirectoryPath />
			</div>
			
			<div className="row">
				<FileTable />
				<InfoTables />
			</div>
			
		</div>
	)
}

export default Container;