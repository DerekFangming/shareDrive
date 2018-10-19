package com.fmning.share.response;

import java.util.List;

public class FileSearchResult {
	
	private String error;
	private List<Shareable> fileList;
	
	public FileSearchResult(List<Shareable> fileList) {
		this.error = "";
		this.fileList = fileList;
	}
	
	public FileSearchResult(String error) {
		this.error = error;
	}
	
	public String getError() {
		return error;
	}
	
	public void setError(String error) {
		this.error = error;
	}
	
	public List<Shareable> getFileList() {
		return fileList;
	}
	
	public void setFileList(List<Shareable> fileList) {
		this.fileList = fileList;
	}

}
