package com.fmning.drive.util;

import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.classic.spi.ThrowableProxy;
import ch.qos.logback.core.LayoutBase;
import lombok.Builder;
import lombok.Data;
import org.apache.commons.lang3.exception.ExceptionUtils;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.text.SimpleDateFormat;
import java.util.*;

public class JsonEventLayout extends LayoutBase<ILoggingEvent> {
    public static final SimpleDateFormat ISO_DATETIME_UTC = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS");
    public static final SimpleDateFormat ISO_DATETIME_CST = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS");

    private Timer timer = new Timer();
    List<Log> logs = new ArrayList<>();

    private boolean isProduction;
    private String url;
    private String username;
    private String password;

    public JsonEventLayout() {
        ISO_DATETIME_CST.setTimeZone(TimeZone.getTimeZone("CST"));

        isProduction = "true".equals(System.getenv("PRODUCTION"));
        url = System.getenv("TL_DATABASE_URL");
        username = System.getenv("DATABASE_USERNAME");
        password = System.getenv("DATABASE_PASSWORD");
    }

    @Builder
    @Data
    public static class Log {
        private final String level;
        private final String source;
        private final String message;
        private final String stacktrace;
        private final String created;
    }

    @Override
    public String doLayout(ILoggingEvent event) {
        String stacktrace = null;
        if (event.getThrowableProxy() instanceof ThrowableProxy) {
            Throwable throwable = ((ThrowableProxy)event.getThrowableProxy()).getThrowable();
            stacktrace = ExceptionUtils.getStackTrace(throwable);
        }

        StackTraceElement info = event.getCallerData()[0];
        logs.add(Log.builder()
                .level(event.getLevel().toString())
                .source(info.getClassName() + " - " + info.getMethodName() + ": " + info.getLineNumber())
                .message(event.getFormattedMessage())
                .stacktrace(stacktrace)
                .created(ISO_DATETIME_UTC.format(new Date(event.getTimeStamp())))
                .build());

        if (logs.size() >= 20) {
            saveLogs();
        } else {
            timer.cancel();
            timer = new Timer();
            timer.schedule(
                    new TimerTask() {
                        @Override
                        public void run() {
                            saveLogs();
                        }
                    }, 5000
            );
        }

        String loggerName = event.getLoggerName();
        if (loggerName.length() > 40) {
            loggerName = loggerName.substring(loggerName.length() - 40);
        }

        return ISO_DATETIME_CST.format(new Date(event.getTimeStamp())) + "  " + event.getLevel().toString() + "  " +
                String.format("%-40s", loggerName) + " : " + event.getFormattedMessage() + "\n";
    }

    private void saveLogs() {
        if (!isProduction) return;

        List<Log> batch = new ArrayList<>(logs);
        logs = new ArrayList<>();
        try {
            Connection conn = DriverManager.getConnection(url, username, password);
            PreparedStatement statement = conn.prepareStatement("INSERT INTO LOGS (level, service, source, message, stacktrace, created)" +
                    " VALUES (?,?,?,?,?,to_timestamp(?, 'YYYY-MM-DD hh24:mi:ss.ms'))");
            for (Log log : batch) {
                statement.setString(1, log.getLevel());
                statement.setString(2, "drive");
                statement.setString(3, log.getSource());
                statement.setString(4, log.getMessage());
                statement.setString(5, log.getStacktrace());
                statement.setString(6, log.getCreated());
                statement.addBatch();
            }
            statement.executeBatch();
            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
