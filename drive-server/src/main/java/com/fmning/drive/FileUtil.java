package com.fmning.drive;

import com.fmning.drive.dto.Shareable;
import org.apache.commons.lang3.StringUtils;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.servlet.HandlerMapping;

import javax.servlet.http.HttpServletRequest;
import java.io.File;
import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
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

    public static String getFilePath(HttpServletRequest request, String basePath) {
        String path = new AntPathMatcher().extractPathWithinPattern((String) request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE), request.getRequestURI());
        try {
            return URLDecoder.decode(path, StandardCharsets.UTF_8.name()).replaceFirst(basePath, "");
        } catch (Exception e){
            throw new IllegalArgumentException("Failed to parse request");
        }
    }

    public static long sublong(String value, int beginIndex, int endIndex) {
        String substring = value.substring(beginIndex, endIndex);
        return (substring.length() > 0) ? Long.parseLong(substring) : -1;
    }

    public static boolean isNameInvalid(String name) {
        if (StringUtils.isBlank(name)) {
            return true;
        } else {
            return name.matches(".*[/\n\r\t\0\f`?*<>|\":].*");
        }
    }

    public static Shareable toShareable(String relativePath, File file) {
        return Shareable.builder()
                .name(file.getName())
                .path(relativePath)
                .isFile(file.isFile())
                .created(getCreationTime(file))
                .lastModified(file.lastModified())
                .size(file.isFile() ? file.length() : 0)
                .build();
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
