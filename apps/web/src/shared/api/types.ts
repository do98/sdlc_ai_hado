// Kiểu dữ liệu API lấy từ hợp đồng (schema.d.ts sinh từ api/openapi.yaml): đổi hợp đồng → chỗ dùng sai sẽ không biên dịch.
import type { components } from './schema';

type Schemas = components['schemas'];

export type Me = Schemas['Me'];
export type DocumentSummary = Schemas['DocumentSummary'];
export type DocumentList = Schemas['DocumentList'];
export type DocumentStatus = Schemas['DocumentStatus'];
export type DocumentErrorCode = Schemas['DocumentErrorCode'];
export type DocumentWarning = Schemas['DocumentWarning'];
export type UploadAccepted = Schemas['UploadAccepted'];
export type Conversation = Schemas['Conversation'];
export type AskRequest = Schemas['AskRequest'];
export type Readiness = Schemas['Readiness'];
export type ErrorBody = Schemas['Error'];
export type ErrorCodeName = Schemas['ErrorCode'];
