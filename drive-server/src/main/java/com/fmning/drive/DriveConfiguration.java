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
        if (driveProperties.isPostgres()) {
            return buildPostgresDataSource(driveProperties);
        }
        return buildH2DataSource(file, driveProperties);
    }

    private DataSource buildPostgresDataSource(DriveProperties driveProperties) {
        if (StringUtils.isBlank(driveProperties.getDbUrl())) {
            markDatabaseInvalid();
            return buildInMemoryH2DataSource(driveProperties);
        }

        DataSource dataSource = DataSourceBuilder.create()
                .driverClassName("org.postgresql.Driver")
                .url(driveProperties.getDbUrl())
                .username(driveProperties.getDbUsername())
                .password(driveProperties.getDbPassword())
                .build();

        try {
            Connection connection = dataSource.getConnection();
            connection.close();
            return dataSource;
        } catch (Exception e) {
            markDatabaseInvalid();
            return buildInMemoryH2DataSource(driveProperties);
        }
    }

    private void markDatabaseInvalid() {
        if (driveStatus == DriveStatus.OK) {
            driveStatus = DriveStatus.INVALID_DATABASE;
        }
    }

    private DataSource buildH2DataSource(File file, DriveProperties driveProperties) {
        if (driveStatus != DriveStatus.OK) {
            return buildInMemoryH2DataSource(driveProperties);
        }

        DataSource dataSource = DataSourceBuilder.create()
                .driverClassName("org.h2.Driver")
                .url("jdbc:h2:file:" + file.getAbsolutePath() + File.separator + INTERNAL_FOLDER_NAME + File.separator + "drive")
                .username(driveProperties.getDbUsername())
                .password(driveProperties.getDbPassword())
                .build();

        try {
            Connection connection = dataSource.getConnection();
            connection.close();
            return dataSource;
        } catch (Exception e) {
            markDatabaseInvalid();
            return buildInMemoryH2DataSource(driveProperties);
        }
    }

    private DataSource buildInMemoryH2DataSource(DriveProperties driveProperties) {
        return DataSourceBuilder.create()
                .driverClassName("org.h2.Driver")
                .url("jdbc:h2:mem:drive")
                .username(driveProperties.getDbUsername())
                .password(driveProperties.getDbPassword())
                .build();
    }

}
