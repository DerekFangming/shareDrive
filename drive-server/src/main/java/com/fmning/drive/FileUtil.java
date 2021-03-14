package com.fmning.drive;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.BasicFileAttributes;

public class FileUtil {

    public static File getInnerFolder(File baseFolder, String path) {
        return new File(baseFolder.getAbsolutePath() + File.separator + path);
    }

    public static String getRelativePath(File file, File rootDir) {
        String root = rootDir.getPath().replace("\\", "/") + "/";
        return file.getPath().replace("\\", "/").replaceFirst(root, "");
    }

    public static long getCreationTime(File file) {
        try {
            BasicFileAttributes attributes = Files.readAttributes(file.toPath(), BasicFileAttributes.class);
            return attributes.creationTime().toMillis();
        } catch (IOException e) {
            return 0;
        }
    }

}
