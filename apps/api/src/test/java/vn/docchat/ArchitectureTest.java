package vn.docchat;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

/** Kiểm tra mã thật của ứng dụng (bỏ qua mã test và fixture). */
@AnalyzeClasses(packages = "vn.docchat", importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {

    @ArchTest static final ArchRule apiNotToRepository = ArchitectureRules.API_NOT_TO_REPOSITORY;

    @ArchTest static final ArchRule domainNotToSpring = ArchitectureRules.DOMAIN_NOT_TO_SPRING;

    @ArchTest
    static final ArchRule domainNotToOtherLayers = ArchitectureRules.DOMAIN_NOT_TO_OTHER_LAYERS;

    @ArchTest static final ArchRule lowerLayersNotToApi = ArchitectureRules.LOWER_LAYERS_NOT_TO_API;
}
