package com.fmning.share.utils;

public class Range {
    public long start;
    public long end;
    public long length;
    public long total;
    
    public Range(long start, long end, long total) {
        this.start = start;
        this.end = end;
        this.length = end - start + 1;
        this.total = total;
    }
}
