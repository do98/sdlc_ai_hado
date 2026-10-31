import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import boundaries from 'eslint-plugin-boundaries';
import prettier from 'eslint-config-prettier';

// Luật ranh giới R-1…R-6 (đề xuất, xem docs/implement/tasks/T01.md mục 4; đối chiếu SDD khi có):
//  R-1 shared không import features/app          R-2 feature không import feature khác
//  R-3 chỉ shared/api được gọi mạng              R-4 chỉ shared/lib/markdown được tạo HTML từ chuỗi
//  R-5 app là nơi duy nhất ghép các feature      R-6 component không import thư viện HTTP
// Luật bổ sung: không lưu token ở localStorage/sessionStorage.
const NETWORK_GLOBALS = [
  { name: 'fetch', message: 'R-3: chỉ shared/api được gọi mạng.' },
  { name: 'XMLHttpRequest', message: 'R-3: chỉ shared/api được gọi mạng.' },
  { name: 'WebSocket', message: 'R-3: chỉ shared/api được gọi mạng.' },
  { name: 'EventSource', message: 'R-3: chỉ shared/api được gọi mạng.' },
];
const STORAGE_GLOBALS = [
  {
    name: 'localStorage',
    message: 'Không dùng localStorage (không lưu token/dữ liệu nhạy cảm ở trình duyệt).',
  },
  { name: 'sessionStorage', message: 'Không dùng sessionStorage cho token/dữ liệu nhạy cảm.' },
];
const HTTP_LIBS = ['axios', 'ky', 'ofetch', 'got', 'node-fetch', 'superagent', 'undici'].map(
  (name) => ({
    name,
    message: 'R-6: dùng shared/api, không import thư viện HTTP trực tiếp.',
  }),
);
const HTML_SINKS = [
  { property: 'innerHTML', message: 'R-4: chỉ shared/lib/markdown được tạo HTML từ chuỗi.' },
  { property: 'outerHTML', message: 'R-4: chỉ shared/lib/markdown được tạo HTML từ chuỗi.' },
  {
    property: 'insertAdjacentHTML',
    message: 'R-4: chỉ shared/lib/markdown được tạo HTML từ chuỗi.',
  },
];

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'coverage'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
  {
    files: ['src/**/*.{ts,vue}'],
    plugins: { boundaries },
    settings: {
      'import/resolver': { node: { extensions: ['.ts', '.vue', '.js'] } },
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app', mode: 'folder' },
        { type: 'feature', pattern: 'src/features/*', mode: 'folder', capture: ['featureName'] },
        { type: 'shared', pattern: 'src/shared', mode: 'folder' },
      ],
    },
    rules: {
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          message:
            '${file.type} không được import ${dependency.type} (luật ranh giới R-1, R-2, R-5)',
          rules: [
            { from: 'shared', allow: ['shared'] },
            {
              from: 'feature',
              allow: ['shared', ['feature', { featureName: '${from.featureName}' }]],
            },
            { from: 'app', allow: ['shared', 'feature', 'app'] },
          ],
        },
      ],
      'no-restricted-globals': ['error', ...NETWORK_GLOBALS, ...STORAGE_GLOBALS],
      'no-restricted-properties': [
        'error',
        ...HTML_SINKS,
        { object: 'window', property: 'fetch', message: 'R-3: chỉ shared/api được gọi mạng.' },
        { object: 'window', property: 'localStorage', message: 'Không dùng localStorage.' },
        { object: 'window', property: 'sessionStorage', message: 'Không dùng sessionStorage.' },
        { object: 'globalThis', property: 'fetch', message: 'R-3: chỉ shared/api được gọi mạng.' },
      ],
      '@typescript-eslint/no-restricted-imports': ['error', { paths: HTTP_LIBS }],
      'no-restricted-imports': 'off',
      'vue/no-v-html': 'error',
    },
  },
  // R-3: shared/api được gọi mạng (nhưng vẫn cấm lưu trữ trình duyệt)
  {
    files: ['src/shared/api/**/*.{ts,vue}'],
    rules: {
      'no-restricted-globals': ['error', ...STORAGE_GLOBALS],
      'no-restricted-properties': [
        'error',
        ...HTML_SINKS,
        { object: 'window', property: 'localStorage', message: 'Không dùng localStorage.' },
      ],
      '@typescript-eslint/no-restricted-imports': ['error', { paths: [] }],
    },
  },
  // R-4: shared/lib/markdown được tạo HTML từ chuỗi (sau khi làm sạch ở T16)
  {
    files: ['src/shared/lib/markdown/**/*.{ts,vue}'],
    rules: {
      'no-restricted-properties': [
        'error',
        { object: 'window', property: 'localStorage', message: 'Không dùng localStorage.' },
      ],
      'vue/no-v-html': 'off',
    },
  },
  prettier,
);
