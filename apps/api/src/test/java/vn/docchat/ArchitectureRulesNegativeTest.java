package vn.docchat;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import org.junit.jupiter.api.Test;
import vn.docchat.fixture.api.BadController;
import vn.docchat.fixture.domain.BadDomain;
import vn.docchat.fixture.domain.BadDomainToService;
import vn.docchat.fixture.repository.BadRepository;
import vn.docchat.fixture.service.BadService;

/** Chứng minh mỗi luật bắt được vi phạm (T01: "test chứng minh bị bắt khi vi phạm"). */
class ArchitectureRulesNegativeTest {

    private static JavaClasses fixtures(Class<?>... classes) {
        return new ClassFileImporter().importClasses(classes);
    }

    @Test
    void controllerGoiRepositoryBiBat() {
        JavaClasses classes = fixtures(BadController.class, BadRepository.class);
        assertThatThrownBy(() -> ArchitectureRules.API_NOT_TO_REPOSITORY.check(classes))
                .isInstanceOf(AssertionError.class);
    }

    @Test
    void domainPhuThuocSpringBiBat() {
        JavaClasses classes = fixtures(BadDomain.class);
        assertThatThrownBy(() -> ArchitectureRules.DOMAIN_NOT_TO_SPRING.check(classes))
                .isInstanceOf(AssertionError.class);
    }

    @Test
    void domainGoiTangKhacBiBat() {
        JavaClasses classes = fixtures(BadDomainToService.class, BadService.class);
        assertThatThrownBy(() -> ArchitectureRules.DOMAIN_NOT_TO_OTHER_LAYERS.check(classes))
                .isInstanceOf(AssertionError.class);
    }

    @Test
    void tangDuoiGoiNguocLenApiBiBat() {
        JavaClasses classes = fixtures(BadService.class, BadController.class);
        assertThatThrownBy(() -> ArchitectureRules.LOWER_LAYERS_NOT_TO_API.check(classes))
                .isInstanceOf(AssertionError.class);
    }
}
