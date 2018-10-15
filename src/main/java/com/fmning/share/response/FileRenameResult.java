package com.fmning.share.response;

public class FileRenameResult {
	
	private String error;
	
	public FileRenameResult(String error) {
		this.error = error;
	}

	public String getError() {
		return error;
	}

	public void setError(String error) {
		this.error = error;
	}

}
