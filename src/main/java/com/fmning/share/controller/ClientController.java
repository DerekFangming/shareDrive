package com.fmning.share.controller;

import java.io.File;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fmning.share.response.BackupResponse;
import com.fmning.share.response.HandshakeResult;
import com.fmning.share.utils.FileStructure;
import com.fmning.share.utils.Utils;

@RestController
@RequestMapping("/api")
public class ClientController {
	
	@GetMapping("/handshake")
	public HandshakeResult handshake() {
		
		if (Utils.setupNeeded) {
			return new HandshakeResult("1.3", "Share drive is not set up yet. Please open share drive through broswer and set it up.");
		} else {
			return new HandshakeResult("1.3");
		}
	}
	
	@PostMapping("/validate_folder_structure")
	public BackupResponse validateFolderStructure(@RequestHeader("Authorization") String auth, @RequestBody Map<String, Object> payload) {
		if (Utils.findUser(auth) == null) {
			return new BackupResponse("Not autorized.", "");
		}
		
		String dirStr = (String)payload.get("dir");
		String fileStructure = (String)payload.get("fileStructure");
		
		List<FileStructure> fileStructureList;
		ObjectMapper mapper = new ObjectMapper();
		try {
			fileStructureList = mapper.readValue(fileStructure, new TypeReference<List<FileStructure>>(){});
			
			File dir = dirStr == null ? new File(Utils.homeDir) : new File(Utils.homeDir + dirStr);
			if (dir.isDirectory()) {
				for (FileStructure fs : fileStructureList) {
					processNode(dirStr == null ? Utils.homeDir : Utils.homeDir + dirStr + File.separator, fs);
				}
				
				String a = mapper.writeValueAsString(fileStructureList);
				return new BackupResponse("", a);
			} else {
				throw new IllegalStateException();
			}
		} catch (Exception e) {
			return new BackupResponse("Invalid request.", "");
		}
	}
	
	private void processNode(String serverCurrentDir, FileStructure clientFile) {
		File serverFile = new File(serverCurrentDir + clientFile.name);
		
		if (serverFile.exists()) { // When both file names are the same
			if (serverFile.isFile() == clientFile.isFile) { // When both file types are the same
				if (serverFile.isFile()) {
					if (serverFile.length() == clientFile.size) {// When they are both files and the byte sizes are the same, do not upload
						clientFile.isMissing = false;
					} else {
						processFileNameCollision(serverCurrentDir, clientFile);
					}
				} else {
					// When both are folders, check children recursively
					clientFile.isMissing = false;
					if (clientFile.children != null) {
						for (FileStructure childFile : clientFile.children) {
							processNode (serverCurrentDir + clientFile.name + File.separator, childFile);
						}
					}
				}
			} else {
				processFileNameCollision(serverCurrentDir, clientFile);
			}
		}
	}
	
	private void processFileNameCollision(String serverCurrentDir, FileStructure clientFile) {
		int dotIdx = clientFile.name.lastIndexOf(".");//System.out.println(a.substring(0, i) + " " + a.substring(i));

		int i = 0;
		while(true) {
			i ++;
			String newName = dotIdx == -1 ? clientFile.name + "(" + i + ")" : clientFile.name.substring(0, dotIdx) + "(" + i + ")" + clientFile.name.substring(dotIdx);
			
			File newFile = new File(serverCurrentDir + newName);
			if (newFile.exists()) {
				if (newFile.length() == clientFile.size) {
					clientFile.isMissing = false;
					return;
				}
			} else {
				clientFile.adjustedName = newName;
				break;
			}
		}
	}

}
