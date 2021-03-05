package com.fmning.share.response;

public class BackupResponse {
	
	private String error;
	private String fileStructure;
	
	public BackupResponse(String error, String fileStructure) {
		this.error = error;
		this.fileStructure = fileStructure;
	}

	public String getError() {
		return error;
	}

	public void setError(String error) {
		this.error = error;
	}

	public String getFileStructure() {
		return fileStructure;
	}

	public void setFileStructure(String fileStructure) {
		this.fileStructure = fileStructure;
	}
}
