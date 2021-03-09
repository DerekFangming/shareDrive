package com.fmning.drive;

import com.fmning.drive.type.DriveStatus;
import org.springframework.stereotype.Component;

import javax.servlet.*;
import java.io.IOException;

@Component
public class DriveStatusFilter implements Filter {

    public void init(FilterConfig filterConfig) throws ServletException {}

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain)
            throws IOException, ServletException {

        if (DriveConfiguration.driveStatus == DriveStatus.OK) {
            filterChain.doFilter(servletRequest, servletResponse);
        } else {
            throw new IllegalStateException("Drive status error");
        }
    }
}
