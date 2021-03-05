package com.fmning.share.response;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.attribute.BasicFileAttributes;

public class Shareable {
	
	private String name;
	private String path;
	private boolean isFile;
	private long created;
	private long lastModified;
	private long size;

	public Shareable (File file, String homeDir) {
		this.name = file.getName();
		this.path = file.getPath().replace("\\", "/").replaceFirst(homeDir, "");
		this.isFile = file.isFile();
		this.lastModified = file.lastModified();
		this.size = file.isFile() ? file.length() : 0;
		try {
			BasicFileAttributes attr = Files.readAttributes(Paths.get(homeDir + path), BasicFileAttributes.class);
			this.created = attr.creationTime().toMillis();
		} catch (Exception ignore) {}
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
	
	public long getCreated() {
		return created;
	}

	public void setCreated(long created) {
		this.created = created;
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
