package com.fmning.share.response;

import java.io.File;

public class Shareable {
	
	private String name;
	private String path;
	private boolean isFile;
	private long lastModified;
	private long size;

	public Shareable (File file) {
		this.name = file.getName();
		this.path = file.getPath();
		this.isFile = file.isFile();
		this.lastModified = file.lastModified();
		this.size = file.length();
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

	public boolean getIsFile() {
		return isFile;
	}

	public void setIsFile(boolean isFile) {
		this.isFile = isFile;
	}

	public long getLastModified() {
		return lastModified;
	}

	public void setLastModified(long lastModified) {
		this.lastModified = lastModified;
	}
	
	public long getSize() {
		return size;
	}

	public void setSize(long size) {
		this.size = size;
	}

}
