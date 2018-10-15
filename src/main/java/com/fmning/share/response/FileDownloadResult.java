package com.fmning.share.response;

public class FileDownloadResult {
	
	private String error;
	
	public FileDownloadResult(String error) {
		this.error = error;
	}

	public String getError() {
		return error;
	}

	public void setError(String error) {
		this.error = error;
	}

}
