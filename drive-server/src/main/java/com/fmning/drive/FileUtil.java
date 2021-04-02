package com.fmning.drive;

import com.fmning.drive.dto.Shareable;
import org.apache.commons.lang3.StringUtils;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.attribute.BasicFileAttributes;

public class FileUtil {

    public static File getInnerFolder(File baseFolder, String path) {
        if (!path.startsWith("/") && !path.startsWith("\\")) path = File.separator + path;
        return new File(baseFolder.getAbsolutePath() + path);
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

    public static boolean isNameValid(String name) {
        if (StringUtils.isBlank(name)) {
            return false;
        } else {
            return !name.matches(".*[/\n\r\t\0\f`?*<>|\":].*");
        }
    }

    public static Shareable toShareable(File rootDir, File file) {
        return Shareable.builder()
                .name(file.getName())
                .path(getRelativePath(file, rootDir))
                .isFile(file.isFile())
                .created(getCreationTime(file))
                .lastModified(file.lastModified())
                .size(file.isFile() ? file.length() : 0)
                .build();
    }

}
