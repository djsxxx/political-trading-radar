# 资产估值 K 线（2026-10-26）

## 范围

- 人物档案统一为资产、社交账号、家庭关系三个入口；取消独立年度资产增减导航，保留原始申报与历史计算代码，不删除资料。
- 当前可核数量登记仅有 Trump Revocable Trust 的 DJT 普通股114,750,000股。来源：SEC Form4（2026-06-19事件，6月23日签署），非Donald Trump Jr.的个人股数。OGE年报第4页受益关系及第865页对应资产行交叉核实。信托权益只估值一次。
- 其他人物仍显示年度申报资产；未核实股数与日期时不画替代K线，不从交易金额档或年度价值上下限反推数量。

## 计算与限制

- 单一资产固定数量情景：开、收、高、低分别等于公开股数乘同一标的美元OHLC。数量核实日期之前不画；日期之后保持数量不变是明确假设，不声称持续持仓已获证实。
- 周/月聚合首日开、末日收、最高高、最低低。末根可能是不完整周期。当前未合成多标的资产K线，避免把不同时刻发生的日内最高值相加。
- 只涵盖被选资产，不是总资产或净资产，不与年度申报小计相加。不计限制性股票折价、税费、负债、资金进出和未核实交易。涨跌不是实际收益。
- Yahoo Finance一年每日行情、USD、获取时间与行情时间保留；打开时每5分钟检查，失败保留有时间标记的缓存。浏览器显示本次下载快照，不声称实时。
- 行情缓存schema2记录OHLC和拆股。非USD、代码不符、旧格式、核实日期后出现拆股时拒绝估值；单日重复/冲突、无效或缺失OHLC跳过并告知，不前填、不补零。上游二进制浮点噪声按7位有效数字处理，未发明缺失价格。

## 来源与复现

- 股数：https://www.sec.gov/Archives/edgar/data/1849635/000143774926021434/xslF345X06/rdgdoc.xml
- 年报：https://extapps2.oge.gov/201/Presiden.nsf/PAS%2BIndex/69AEAA9D7455ACD585258E27002DDEE1/$FILE/Donald-J-Trump-2026-278ANNUAL.pdf
- 行情请求：Yahoo Finance chart DJT，range=1y、interval=1d、events=splits；先query1再query2。
- `desktop/valuationQuote.test.ts`通过现有服务获取真实行情，生成`frontend/public/valuation-quotes.json`浏览器快照。持仓依据在`valuation-holdings.json`，不篡改原annual-assets/executive-assets。
- `node research/political-trades/audit_asset_valuation.cjs`核对纯计算与拒绝条件；测试使用明确合成夹具，不进入界面。

## 股票入口

列表仅代码/简称与半年买入去重人数；点开先看买入头像，再看年度关联持仓。明确区分交易额与持仓价值；有股数证据才显示股数，其他显示原件金额区间及股数未披露。年度可能含配偶与期权，不推断今日余额。党派/地区范围同源过滤。
