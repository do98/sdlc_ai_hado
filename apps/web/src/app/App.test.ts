import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import App from './App.vue';

describe('App', () => {
  it('hiển thị tiêu đề ứng dụng', () => {
    expect(mount(App).text()).toContain('Chat với tài liệu');
  });
});
