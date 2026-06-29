# Pull Request

## 這個 PR 做了什麼？

更新顧問諮詢預約流程，讓使用者可從圖片詳情頁點擊 `CONSULT STYLIST` 進入諮詢預約；未登入時會先導向註冊頁，並保留原本要前往的諮詢頁路徑。

同時重整諮詢表單，加入日期選擇器、下拉選單、登入資訊自動帶入、付款確認區塊與 demo 付款提示。

---

## 改動清單

- 新增 `ConsultationDatePicker.vue`，處理諮詢預約日期選擇
- 新增 `ConsultationDropdown.vue`，處理 Time Slot、Design Field、Design Focus 下拉選單
- 更新 `RecommendationPanel.vue`：
  - 自動帶入登入使用者的 name / email
  - 移除 `use my account info` 相關 UI
  - 新增 `Consultation Fee` 區塊與 `NT$500 deposit`
  - 新增付款確認 checkbox，未勾選時阻擋送出
  - 新增 demo 提示
  - 調整送出按鈕文案為 `Confirm & Pay`
- 更新 `PictureDetail.vue`：
  - 已登入時導到 `/consultant?sourceImageId=...`
  - 未登入時導到 `/sign-up?next=/consultant?sourceImageId=...`
- 更新 `StyleConsultant.vue`，讀取 `sourceImageId` 並帶入登入帳號資料
- 更新註冊頁既有帳號入口，切到登入頁時保留安全的 next path
- 更新相關測試

---

## 為什麼要這樣做？

完成顧問諮詢流程的驗收需求：使用者可以從圖片詳情頁進入諮詢預約，未登入時先完成註冊或登入，登入後表單自動帶入帳號資訊。

付款確認區塊則用來明確阻擋未確認付款意圖的送出行為，並透過 demo 提示避免誤解為真實付款。

---

## 測試方式

1. 進入圖片詳情頁
2. 點擊 `CONSULT STYLIST`
3. 已登入時應導到 `/consultant?sourceImageId=...`
4. 未登入時應導到 `/sign-up?next=/consultant?sourceImageId=...`
5. 在 `/consultant` 檢查表單是否自動帶入登入使用者的 name / email
6. 未勾選付款確認 checkbox 時送出表單，應顯示錯誤且不送出
7. 勾選付款確認並填完必要欄位後，表單可正常送出
8. 確認 `ADD TO MOODBOARD` 既有功能仍可正常使用

已執行：

```bash
npm run lint
npm run build
npm test
```

結果：

- `npm run lint` 通過
- `npm run build` 通過
- `npm test` 通過：45 個 test files、203 個 tests passed

---

## 截圖

### 改動前

未附。

### 改動後

未附。

---

## 提交前自查清單

- [ ] 在本地跑起來，功能正常
- [x] `npm run lint` 沒有 ESLint 錯誤
- [x] `npm run build` 正常
- [ ] 已經 `git pull origin develop` 同步最新的 develop
- [x] 自己重讀過一遍，沒有覺得奇怪的地方
- [x] 沒有殘留的 `console.log`
- [x] 沒有被 comment 掉的無用程式碼
- [x] 命名符合團隊規範

---

## 給 Reviewer 的備註

consultant 頁目前仍保留部分 component-scoped hex 色值。這批顏色主要是諮詢頁一次性使用的局部視覺，例如表單玻璃感、hover、border、陰影與輔助文字透明度。

本來有評估抽成全域 token，但因為這些色值只服務單一諮詢頁，抽到 `main.css` 會產生大量頁面限定 token，反而增加閱讀與維護成本。因此本次保留既有全域品牌色 token，局部透明色則留在對應元件內。未來如果有第二個以上頁面共用同一套表單視覺，再抽成共用 token 或共用 class 會更合理。
