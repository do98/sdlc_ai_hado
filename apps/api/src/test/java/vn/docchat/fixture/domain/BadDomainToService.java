package vn.docchat.fixture.domain;

import vn.docchat.fixture.service.BadService;

/** Fixture vi phạm: domain gọi tầng service. */
public class BadDomainToService {
    public Object call() {
        return new BadService().call();
    }
}
