package vn.docchat.fixture.service;

import vn.docchat.fixture.api.BadController;

/** Fixture vi phạm: service gọi ngược lên tầng api. */
public class BadService {
    public Object call() {
        return new BadController().get();
    }
}
