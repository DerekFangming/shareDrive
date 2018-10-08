package com.fmning.share.controller;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fmning.share.response.DriveStatus;
import com.fmning.share.response.Shareable;
import com.fmning.share.utils.ResponseList;

@RestController
@RequestMapping("/api")
public class DirectoryController {
	
	@Value("${homeDir}")
	private String homeDir;
	
	@PostMapping("/get_files_in_directory")
	public ResponseList getFiles(@RequestBody Map<String, Object> payload) {
		
		String dirStr = (String)payload.get("dir");
		
		File dir = dirStr.equals("root") ? new File(homeDir) : new File(homeDir + dirStr);
		
		if (dir.isFile()) {
			return new ResponseList("Requested path is not a directory.");
		} else if (!dir.isDirectory()) {
			return new ResponseList("Requested path does not exist.");
		} else if (dir.listFiles() == null) {
			return new ResponseList("Internal server error.");
		} else {
			List<Shareable> fileList = new ArrayList<>();
			for(File f : dir.listFiles()) {
				if (!f.isHidden()) {
					fileList.add(new Shareable(f, homeDir));
				}
			}

			return new ResponseList(fileList);
		}
	}
	
	@GetMapping("/get_drive_status")
	public DriveStatus sayHello1() {
		File root = new File(homeDir);
		return new DriveStatus(root.getTotalSpace(), root.getUsableSpace());
	}
	

}
