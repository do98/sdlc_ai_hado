package vn.docchat.contract;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.yaml.snakeyaml.Yaml;

/** Đọc {@code api/openapi.yaml} (nguồn sự thật của hợp đồng, T05) cho các test hợp đồng. */
final class OpenApiSpec {

    /** Chạy từ thư mục apps/api (Maven) → ../../api/openapi.yaml. */
    static final Path FILE =
            Path.of("..", "..", "api", "openapi.yaml").toAbsolutePath().normalize();

    private final Map<String, Object> root;

    OpenApiSpec() {
        try (InputStream in = Files.newInputStream(FILE)) {
            this.root = new Yaml().load(in);
        } catch (IOException e) {
            throw new IllegalStateException("Không đọc được " + FILE, e);
        }
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> map(Object o) {
        return (Map<String, Object>) o;
    }

    Map<String, Object> errorCodeSchema() {
        return map(map(map(root.get("components")).get("schemas")).get("ErrorCode"));
    }

    @SuppressWarnings("unchecked")
    List<String> errorCodes() {
        return (List<String>) errorCodeSchema().get("enum");
    }

    Map<String, Object> catalog() {
        return map(errorCodeSchema().get("x-catalog"));
    }

    /** operationId của các thao tác có {@code x-implemented: true}. */
    Set<String> implementedOperations() {
        Set<String> ids = new LinkedHashSet<>();
        for (Object pathItem : map(root.get("paths")).values()) {
            for (Object op : map(pathItem).values()) {
                Map<String, Object> o = map(op);
                if (Boolean.TRUE.equals(o.get("x-implemented"))) {
                    ids.add((String) o.get("operationId"));
                }
            }
        }
        return ids;
    }

    Set<String> allOperations() {
        Set<String> ids = new LinkedHashSet<>();
        for (Object pathItem : map(root.get("paths")).values()) {
            for (Object op : map(pathItem).values()) {
                ids.add((String) map(op).get("operationId"));
            }
        }
        return ids;
    }
}
