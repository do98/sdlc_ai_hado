package vn.docchat;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.lang.ArchRule;

/** Luật ranh giới tầng của backend (T01). Dùng cho mã thật và cho bộ fixture vi phạm. */
final class ArchitectureRules {

    private ArchitectureRules() {}

    /** Controller không gọi repository trực tiếp; phải đi qua service. */
    static final ArchRule API_NOT_TO_REPOSITORY =
            noClasses()
                    .that()
                    .resideInAPackage("..api..")
                    .should()
                    .dependOnClassesThat()
                    .resideInAPackage("..repository..")
                    .allowEmptyShould(true)
                    .because("controller phải gọi service, không gọi repository trực tiếp");

    /** Domain thuần: không phụ thuộc Spring. */
    static final ArchRule DOMAIN_NOT_TO_SPRING =
            noClasses()
                    .that()
                    .resideInAPackage("..domain..")
                    .should()
                    .dependOnClassesThat()
                    .resideInAnyPackage("org.springframework..")
                    .allowEmptyShould(true)
                    .because("domain không được phụ thuộc framework");

    /** Domain không phụ thuộc các tầng khác. */
    static final ArchRule DOMAIN_NOT_TO_OTHER_LAYERS =
            noClasses()
                    .that()
                    .resideInAPackage("..domain..")
                    .should()
                    .dependOnClassesThat()
                    .resideInAnyPackage(
                            "..api..", "..service..", "..repository..", "..integration..")
                    .allowEmptyShould(true)
                    .because("domain là lõi, các tầng khác phụ thuộc vào nó chứ không ngược lại");

    /** Tầng dưới không gọi ngược lên tầng api. */
    static final ArchRule LOWER_LAYERS_NOT_TO_API =
            noClasses()
                    .that()
                    .resideInAnyPackage("..service..", "..repository..", "..integration..")
                    .should()
                    .dependOnClassesThat()
                    .resideInAPackage("..api..")
                    .allowEmptyShould(true)
                    .because("không gọi ngược từ service/repository/integration lên api");
}
