package com.fmning.share.controller;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.apache.commons.io.FileUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fmning.share.response.DirSize;
import com.fmning.share.response.DriveStatus;
import com.fmning.share.response.FileRenameResult;
import com.fmning.share.response.FileSearchResult;
import com.fmning.share.response.FileRetrieveResult;
import com.fmning.share.response.Shareable;
import com.fmning.share.utils.Utils;

@RestController
@RequestMapping("/api")
public class DirectoryController {
	
	@PostMapping("/get_files_in_directory")
	public FileRetrieveResult getFiles(@RequestHeader("Authorization") String auth, @RequestBody Map<String, Object> payload) {
		if (Utils.findUser(auth) == null) {
			return new FileRetrieveResult("Not autorized.");
		}
		
		String dirStr = (String)payload.get("dir");
		Object loadDirOnly = payload.get("loadDirOnly");
		boolean dirOnly = loadDirOnly == null ? false : (boolean)loadDirOnly;
		if (dirStr == null) dirStr = "";
		
		File dir = new File(Utils.homeDir + dirStr);
		
		if (dir.isFile()) {
			return new FileRetrieveResult("Requested path is not a directory.");
		} else if (!dir.isDirectory()) {
			return new FileRetrieveResult("Requested path does not exist.");
		} else if (dir.listFiles() == null) {
			return new FileRetrieveResult("Internal server error.");
		} else {
			File[] childFileList = dir.listFiles();

			if (childFileList == null) {
				return new FileRetrieveResult("Internal server error.");
			} else {
				List<Shareable> fileList = new ArrayList<>();
				for(File f : childFileList) {
					if (!f.isHidden() && !f.getName().startsWith(".") && !f.getName().startsWith("$")) {
						if (dirOnly) {
							if (f.isDirectory()) {
								fileList.add(new Shareable(f, Utils.homeDir));
							}
						} else {
							fileList.add(new Shareable(f, Utils.homeDir));
						}
					}
				}

				return new FileRetrieveResult(fileList);
			}

		}
	}
	
	@PostMapping("/search_files_in_directory")
	public FileSearchResult searchFiles(@RequestHeader("Authorization") String auth, @RequestBody Map<String, Object> payload) {
		if (Utils.findUser(auth) == null) {
			return new FileSearchResult("Not autorized.");
		}
		
		String dirStr = (String)payload.get("dir");
		String keyword = (String)payload.get("keyword");
		if (keyword == null) return new FileSearchResult("The request is not complete");
		
		File dir = dirStr == null ? new File(Utils.homeDir) : new File(Utils.homeDir + dirStr);
		
		if (keyword.trim().equals("")) {
			return new FileSearchResult("Please enter a keyword.");
		} else if (dir.isFile()) {
			return new FileSearchResult("Requested path is not a directory.");
		} else if (!dir.isDirectory()) {
			return new FileSearchResult("Requested path does not exist.");
		} else if (dir.listFiles() == null) {
			return new FileSearchResult("Internal server error.");
		} else {
			try {
				String regex = ".*" + keyword.trim().toLowerCase().replace(".", "\\.").replace("*", ".*").replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
						.replace("/", "\\/").replace("$", "\\$").replace("^", "\\^").replace("+", "\\+").replace("[", "\\[").replace("]", "\\]").replace("|", "\\|")
						.replace("?", "\\?")+ ".*";
				List<Shareable> resultList = Files.walk(dir.toPath())
						.map(Path::toFile)
						.parallel()
						.filter(p -> p.getName().toLowerCase().matches(regex))
						.map(f -> new Shareable(f, Utils.homeDir))
						.collect(Collectors.toList());
				
				return new FileSearchResult(resultList);
			} catch (IOException e) {
				return new FileSearchResult("Internal server error");
			}
		}
	}
	
	@GetMapping("/get_drive_status")
	public DriveStatus getDriveStatus(@RequestHeader("Authorization") String auth) {
		if (Utils.findUser(auth) == null) {
			return new DriveStatus("Not autorized.");
		}
		
		File baseDir = new File(Utils.homeDir);
		return new DriveStatus(baseDir.getTotalSpace(), baseDir.getUsableSpace());
	}
	
	@PostMapping("/get_directory_size")
	public DirSize getDirSize(@RequestHeader("Authorization") String auth, @RequestBody Map<String, Object> payload) {
		if (Utils.findUser(auth) == null) {
			return new DirSize("Not autorized.");
		}
		
		String dirStr = (String)payload.get("dir");
		if (dirStr == null) return new DirSize("The request is not complete");
		
		File dir = new File(Utils.homeDir + dirStr);
		
		if (dir.isFile()) {
			return new DirSize("Requested path is not a directory.");
		} else if (!dir.isDirectory()) {
			return new DirSize("Requested path does not exist.");
		} else {
			return new DirSize(FileUtils.sizeOfDirectory(dir));
		}
	}
	
	@PostMapping("/create_folder")
	public FileRenameResult createFoler(@RequestHeader("Authorization") String auth, @RequestBody Map<String, Object> payload) {
		if (Utils.findUser(auth) == null) {
			return new FileRenameResult("Not autorized.");
		}
		
		String dirStr = (String)payload.get("dir");
		String folderName = (String)payload.get("folderName");
		if (folderName == null) return new FileRenameResult("The request is not complete");
		
		File newDir = dirStr == null ? new File(Utils.homeDir + File.separator + folderName) : new File(Utils.homeDir + dirStr + File.separator + folderName);
		
		if (newDir.exists()) {
			return new FileRenameResult("The folder already exits"); 
		}
		
		boolean result = newDir.mkdirs();
		
		if (result) {
			return new FileRenameResult(newDir, Utils.homeDir);
		} else {
			return new FileRenameResult("Failed to create folder due to internal server error.");
		}
		
	}
	

}
