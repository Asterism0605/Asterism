import { fetchActiveConsultants, type ConsultantRow } from '@/api/consultants.api';
import { matchConsultantByDesignField } from '@/services/consultant-match.service';

// 顧問資料的 service 層：page / component 只跟這裡打交道，不直接 import src/api（分層規則）。
// 錯誤原樣往上拋，由呼叫端管理 loading / error 的 reactive 狀態（見 ConsultantLoadStatus）。

// 顧問清單載入狀態。空陣列不代表「沒有顧問」，也可能是還沒載入或載入失敗，
// 呼叫端用這個 enum 區分四種狀態，避免把「載入失敗」誤當成「尚未配對」。
export type ConsultantLoadStatus = 'idle' | 'loading' | 'success' | 'error';

export function loadActiveConsultants(): Promise<ConsultantRow[]> {
  return fetchActiveConsultants();
}

export { matchConsultantByDesignField };
export type { ConsultantRow };
