package com.fmning.drive;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fmning.drive.type.DriveStatus;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.apachecommons.CommonsLog;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import jakarta.servlet.*;
import java.io.IOException;
import java.io.PrintWriter;

@Component
@CommonsLog
@RequiredArgsConstructor(onConstructor_={@Autowired})
public class DriveStatusFilter implements Filter {

    private final ObjectMapper objectMapper;

    public void init(FilterConfig filterConfig) throws ServletException {}

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain)
            throws IOException, ServletException {

        if (DriveConfiguration.driveStatus == DriveStatus.OK) {
            filterChain.doFilter(servletRequest, servletResponse);
        } else {
            log.error("Drive status failed: " + DriveConfiguration.driveStatus);

            ((HttpServletResponse) servletResponse).setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            servletResponse.setContentType("application/json");

            PrintWriter out = servletResponse.getWriter();
            out.print(objectMapper.writeValueAsString(new DriveExceptionHandler.ErrorDto("Drive status failed.")));
            out.flush();
        }
    }
}
