package com.fmning.share;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.util.Properties;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import com.fmning.share.utils.Utils;

@Component
public class Initializer {
	
	@EventListener(ApplicationReadyEvent.class)
	public void initilizer(){
		
		try {
			Properties prop = new Properties();
			prop.load(new FileInputStream(Utils.PROPERTIES_FILE));
			String errors = Utils.validateSettings(prop);
			if (errors.equals("")) {
				Utils.guardExistRecycleBin(Utils.homeDir + Utils.RECYCLE_BIN_FOLDER_NAME);
			}
			//Else not needed since set up flag is already turned on
		} catch (Exception e) {
			e.printStackTrace();
			System.out.println("file missing");
			Utils.setupNeeded = true;
			//prop.setProperty("crapKey", "crapValue");
			
			//prop.store(new FileOutputStream(PROPERTIES_FILE), "");
		}
		
//		
	    File recycleBin = new File(Utils.homeDir + Utils.RECYCLE_BIN_FOLDER_NAME);
	    
	    if (! recycleBin.exists()){
	    	recycleBin.mkdir();
	    	
	    	try {
		    	Boolean hidden = (Boolean) Files.getAttribute(recycleBin.toPath(), "dos:hidden", LinkOption.NOFOLLOW_LINKS);
		    	if (hidden != null && !hidden) {
		    		Files.setAttribute(recycleBin.toPath(), "dos:hidden", Boolean.TRUE, LinkOption.NOFOLLOW_LINKS);
		    	}
	    	} catch (IOException ignored) {};
	    }
//	    Utils.test(homeDir);

	}

}
