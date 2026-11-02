package vn.docchat.service;

import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

/** Tuần tự hóa JSON tối giản cho thuộc tính audit/analytics: chỉ chuỗi (đã thoát), số, boolean. */
final class Json {

    private Json() {}

    static String of(Map<String, Object> attributes, Set<String> allowedKeys) {
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> e : new TreeMap<>(attributes).entrySet()) {
            if (!allowedKeys.contains(e.getKey())) {
                throw new IllegalArgumentException(
                        "Khóa thuộc tính không được phép: " + e.getKey());
            }
            if (!first) {
                sb.append(',');
            }
            first = false;
            sb.append('"').append(e.getKey()).append("\":");
            Object v = e.getValue();
            if (v == null) {
                sb.append("null");
            } else if (v instanceof Number || v instanceof Boolean) {
                sb.append(v);
            } else {
                sb.append('"').append(escape(v.toString())).append('"');
            }
        }
        return sb.append('}').toString();
    }

    private static String escape(String s) {
        StringBuilder out = new StringBuilder();
        for (char c : s.toCharArray()) {
            switch (c) {
                case '"' -> out.append("\\\"");
                case '\\' -> out.append("\\\\");
                default ->
                        out.append(
                                c < 0x20 ? String.format("\\u%04x", (int) c) : String.valueOf(c));
            }
        }
        return out.toString();
    }
}
