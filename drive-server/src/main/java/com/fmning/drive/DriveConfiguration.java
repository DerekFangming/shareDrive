package com.fmning.drive;

import com.fmning.drive.type.DriveStatus;
import org.apache.commons.lang3.StringUtils;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.io.File;
import java.sql.Connection;
import java.util.UUID;

import static com.fmning.drive.FileUtil.getInnerFolder;

@Configuration
public class DriveConfiguration {

    public static DriveStatus driveStatus = DriveStatus.UNKNOWN;
    private static final String INTERNAL_FOLDER_NAME = ".dr_internal";

    @Bean
    public File rootDir(DriveProperties driveProperties) {
        if (StringUtils.isBlank(driveProperties.getRootDir())) {
            driveStatus = DriveStatus.NO_ROOT_DIR;
            return new File("");
        } else {
            File rootDir = new File(driveProperties.getRootDir());
            if (rootDir.isFile()) {
                driveStatus = DriveStatus.INVALID_ROOT_DIR;
            } else if (rootDir.isDirectory()) {
                File internalFolder = getInnerFolder(rootDir, INTERNAL_FOLDER_NAME);
                if (internalFolder.exists()) {
                    File testFolder = getInnerFolder(internalFolder, UUID.randomUUID().toString());
                    if (testFolder.mkdir()) {
                        if (testFolder.delete()) {
                            driveStatus = DriveStatus.OK;
                        } else {
                            driveStatus = DriveStatus.INVALID_PERMISSION;
                        }
                    } else {
                        driveStatus = DriveStatus.INVALID_PERMISSION;
                    }
                } else {
                    if (internalFolder.mkdir()) {
                        driveStatus = DriveStatus.OK;
                    } else {
                        driveStatus = DriveStatus.INVALID_PERMISSION;
                    }
                }
            } else {
                driveStatus = DriveStatus.INVALID_ROOT_DIR;
            }
            return rootDir;
        }
    }

    @Bean
    public DataSource getDataSource(File file, DriveProperties driveProperties) {
        DataSourceBuilder dataSourceBuilder = DataSourceBuilder.create();
        dataSourceBuilder.driverClassName("org.h2.Driver");
        dataSourceBuilder.username(driveProperties.getDbUsername());
        dataSourceBuilder.password(driveProperties.getDbPassword());

        if (driveStatus != DriveStatus.OK) {
            dataSourceBuilder.url("jdbc:h2:mem:drive");
            return dataSourceBuilder.build();
        } else {
            dataSourceBuilder.url("jdbc:h2:file:" + file.getAbsolutePath() + File.separator + INTERNAL_FOLDER_NAME + File.separator + "drive");
            DataSource dataSource = dataSourceBuilder.build();

            try {
                Connection connection = dataSource.getConnection();
                connection.close();
                return dataSource;
            } catch (Exception e) {
                dataSourceBuilder.url("jdbc:h2:mem:drive");
                driveStatus = DriveStatus.INVALID_DATABASE;
                return dataSourceBuilder.build();
            }
        }
    }

}
