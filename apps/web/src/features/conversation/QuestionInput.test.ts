import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { messages } from '../../shared/lib/messages';
import QuestionInput from './QuestionInput.vue';

describe('QuestionInput — ST-04 ô nhập bị khóa', () => {
  it('chưa có tài liệu sẵn sàng: ô nhập bị khóa kèm giải thích gắn bằng aria-describedby', () => {
    const w = mount(QuestionInput, { props: { hasReadyDocuments: false } });
    const box = w.get('textarea');
    expect(box.attributes('disabled')).toBeDefined();
    const helpId = box.attributes('aria-describedby') ?? '';
    expect(w.get(`#${helpId}`).text()).toBe(messages.conversation.lockedNoReady);
    expect(w.get('label').text()).toBe(messages.conversation.inputLabel);
  });

  it('đã có tài liệu sẵn sàng: giải thích đổi (tính năng hỏi đáp có ở bước sau)', () => {
    const w = mount(QuestionInput, { props: { hasReadyDocuments: true } });
    expect(w.get('[data-testid="question-help"]').text()).toBe(messages.conversation.lockedSoon);
  });
});
