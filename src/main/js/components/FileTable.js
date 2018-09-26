import React, {Component} from 'react';

class FileTable extends Component {
	render () {
		return (
			<div className="col-md-8">
				<h1 className="my-4">Page Heading
					<small>Secondary Text</small>
				</h1>
				<table className="table table-hover">
					<caption>List of users</caption>
					<thead>
						<tr>
							<th style={{width:'70%'}}>Name</th>
							<th style={{width:'20%'}}>Last Modified</th>
							<th style={{width:'10%'}}>Size</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>Something.txt</td>
							<td>2016/01/20</td>
							<td>1kb</td>
						</tr>
						<tr>
							<td>ahhahaha ha hjkasdhs sad askdh.doc</td>
							<td>2016/01/20</td>
							<td>3MB</td>
						</tr>
						<tr>
							<td>dafjdks.mp3</td>
							<td>2016/01/20</td>
							<td>20TB</td>
						</tr>
					</tbody>
				</table>
			</div>
		);
	}
}

export default FileTable;

