package com.fmning.share.directory;

import java.io.File;

public class Shareable {
	
	private String name;
	private String path;
	private boolean isFile;
	private long lastModified;
	
	public Shareable (File file) {
		this.name = file.getName();
		this.path = file.getPath();
		this.isFile = file.isFile();
		this.lastModified = file.lastModified();
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getPath() {
		return path;
	}

	public void setPath(String path) {
		this.path = path;
	}

	public boolean isFile() {
		return isFile;
	}

	public void setFile(boolean isFile) {
		this.isFile = isFile;
	}

	public long getLastModified() {
		return lastModified;
	}

	public void setLastModified(long lastModified) {
		this.lastModified = lastModified;
	}

}
