package com.fmning.share.utils;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.context.support.PropertySourcesPlaceholderConfigurer;

@ConfigurationProperties
@Configuration("applicationProperties")
@Deprecated
public class ApplicationProperties {
	
    private String somekey;

	public String getSomekey() {
		return somekey;
	}

	public void setSomekey(String somekey) {
		this.somekey = somekey;
	}


}
