package vn.docchat.fixture.api;

import vn.docchat.fixture.repository.BadRepository;

/** Fixture vi phạm: controller gọi repository trực tiếp. */
public class BadController {
    private final BadRepository repository = new BadRepository();

    public Object get() {
        return repository.find();
    }
}
