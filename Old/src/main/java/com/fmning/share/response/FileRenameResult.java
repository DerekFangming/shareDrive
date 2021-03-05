package com.fmning.share.response;

import java.io.File;

public class FileRenameResult {
	
	private String error;
	private Shareable file;
	
	public FileRenameResult(String error) {
		this.error = error;
	}
	
	public FileRenameResult(File file, String homeDir) {
		this.error = "";
		this.file = new Shareable(file, homeDir);
	}

	public String getError() {
		return error;
	}

	public void setError(String error) {
		this.error = error;
	}

	public Shareable getFile() {
		return file;
	}

	public void setFile(Shareable file) {
		this.file = file;
	}

}
