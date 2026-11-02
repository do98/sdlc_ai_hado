package vn.docchat.domain;

/**
 * Một dòng của nhật ký sự kiện workspace; {@code seq} là id SSE, {@code payloadJson} là JSON một
 * dòng.
 */
public record WorkspaceEvent(long seq, String type, String payloadJson) {}
